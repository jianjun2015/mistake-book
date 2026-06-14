package com.mistakebook.service.impl;

import com.mistakebook.dto.*;
import com.mistakebook.entity.User;
import com.mistakebook.repository.UserRepository;
import com.mistakebook.service.UserService;
import com.mistakebook.util.JwtUtil;
import com.mistakebook.util.RedisService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.concurrent.TimeUnit;

@Slf4j
@Service
@RequiredArgsConstructor
public class UserServiceImpl implements UserService {

    private final UserRepository userRepository;
    private final JwtUtil jwtUtil;
    private final RedisService redisService;
    private final BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder();

    @Value("${jwt.expiration:604800000}")
    private long jwtExpiration;

    // Redis key 前缀
    private static final String TOKEN_PREFIX = "token:";

    @Override
    @Transactional
    public UserResponse register(RegisterRequest request) {
        log.info("用户注册: username={}, grade={}, gender={}", 
                request.getUsername(), request.getGrade(), request.getGender());
        
        // 检查用户名是否已存在
        if (userRepository.existsByUsername(request.getUsername())) {
            log.warn("用户名已存在: username={}", request.getUsername());
            throw new RuntimeException("用户名已存在");
        }

        // 创建用户
        User user = new User();
        user.setUsername(request.getUsername());
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        user.setGrade(request.getGrade());
        user.setGender(request.getGender());

        User saved = userRepository.save(user);
        log.info("用户注册成功: id={}, username={}", saved.getId(), saved.getUsername());
        return convertToResponse(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public LoginResponse login(LoginRequest request) {
        log.info("用户登录: username={}", request.getUsername());
        
        // 查找用户
        User user = userRepository.findByUsername(request.getUsername())
                .orElseThrow(() -> {
                    log.warn("用户不存在: username={}", request.getUsername());
                    return new RuntimeException("用户名或密码错误");
                });

        // 验证密码
        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            log.warn("密码错误: username={}", request.getUsername());
            throw new RuntimeException("用户名或密码错误");
        }

        // 生成 Token
        String token = jwtUtil.generateToken(user.getId(), user.getUsername());

        // 将 Token 存入 Redis，过期时间与 JWT 一致
        String redisKey = TOKEN_PREFIX + user.getId();
        redisService.set(redisKey, token, jwtExpiration, TimeUnit.MILLISECONDS);
        log.info("Token已存入Redis: userId={}, redisKey={}", user.getId(), redisKey);

        UserResponse userResponse = convertToResponse(user);
        log.info("用户登录成功: userId={}, username={}", user.getId(), user.getUsername());
        return new LoginResponse(token, userResponse);
    }

    @Override
    public void logout(Long userId) {
        log.info("用户退出登录: userId={}", userId);
        // 从 Redis 中删除 Token
        String redisKey = TOKEN_PREFIX + userId;
        redisService.delete(redisKey);
        log.info("Token已从Redis删除: userId={}, redisKey={}", userId, redisKey);
    }

    /**
     * 验证 Token 是否有效（在 Redis 中存在）
     */
    public boolean isTokenValid(Long userId, String token) {
        String redisKey = TOKEN_PREFIX + userId;
        Object cachedToken = redisService.get(redisKey);
        boolean valid = cachedToken != null && cachedToken.toString().equals(token);
        log.debug("Token验证: userId={}, valid={}", userId, valid);
        return valid;
    }

    @Override
    @Transactional(readOnly = true)
    public UserResponse getUserInfo(Long userId) {
        log.debug("获取用户信息: userId={}", userId);
        User user = userRepository.findById(userId)
                .orElseThrow(() -> {
                    log.error("用户不存在: userId={}", userId);
                    return new RuntimeException("用户不存在");
                });
        return convertToResponse(user);
    }

    private UserResponse convertToResponse(User user) {
        UserResponse response = new UserResponse();
        response.setId(user.getId());
        response.setUsername(user.getUsername());
        response.setGrade(user.getGrade());
        response.setGradeName(UserResponse.gradeToName(user.getGrade()));
        response.setGender(user.getGender());
        response.setGenderName(UserResponse.genderToName(user.getGender()));
        response.setCreateTime(user.getCreateTime());
        return response;
    }
}
