package com.mistakebook.controller;

import com.mistakebook.dto.*;
import com.mistakebook.service.UserService;
import com.mistakebook.util.Result;
import com.mistakebook.util.UserContext;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.*;

@Slf4j
@Tag(name = "认证管理", description = "用户注册、登录、退出接口")
@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final UserService userService;

    @Operation(summary = "用户注册")
    @PostMapping("/register")
    public Result<UserResponse> register(@Valid @RequestBody RegisterRequest request) {
        log.info("用户注册请求: username={}, grade={}, gender={}", 
                request.getUsername(), request.getGrade(), request.getGender());
        try {
            UserResponse data = userService.register(request);
            log.info("用户注册成功: id={}, username={}", data.getId(), data.getUsername());
            return Result.success("注册成功", data);
        } catch (Exception e) {
            log.error("用户注册失败: username={}", request.getUsername(), e);
            throw e;
        }
    }

    @Operation(summary = "用户登录")
    @PostMapping("/login")
    public Result<LoginResponse> login(@Valid @RequestBody LoginRequest request) {
        log.info("用户登录请求: username={}", request.getUsername());
        try {
            LoginResponse data = userService.login(request);
            log.info("用户登录成功: userId={}, username={}", data.getUser().getId(), data.getUser().getUsername());
            return Result.success("登录成功", data);
        } catch (Exception e) {
            log.error("用户登录失败: username={}", request.getUsername(), e);
            throw e;
        }
    }

    @Operation(summary = "用户退出登录")
    @PostMapping("/logout")
    public Result<Void> logout() {
        Long userId = UserContext.getCurrentUserId();
        log.info("用户退出登录: userId={}", userId);
        try {
            userService.logout(userId);
            log.info("用户退出成功: userId={}", userId);
            return Result.success("退出成功", null);
        } catch (Exception e) {
            log.error("用户退出失败: userId={}", userId, e);
            throw e;
        }
    }

    @Operation(summary = "获取当前用户信息")
    @GetMapping("/me")
    public Result<UserResponse> getCurrentUser() {
        Long userId = UserContext.getCurrentUserId();
        log.debug("获取当前用户信息: userId={}", userId);
        UserResponse data = userService.getUserInfo(userId);
        return Result.success(data);
    }
}
