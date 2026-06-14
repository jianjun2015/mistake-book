package com.mistakebook.service;

import com.mistakebook.dto.*;

public interface UserService {

    /**
     * 用户注册
     */
    UserResponse register(RegisterRequest request);

    /**
     * 用户登录
     */
    LoginResponse login(LoginRequest request);

    /**
     * 用户退出登录
     */
    void logout(Long userId);

    /**
     * 验证 Token 是否有效
     */
    boolean isTokenValid(Long userId, String token);

    /**
     * 获取用户信息
     */
    UserResponse getUserInfo(Long userId);
}
