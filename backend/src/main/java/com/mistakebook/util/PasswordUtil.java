package com.mistakebook.util;

import java.nio.charset.StandardCharsets;
import java.util.Base64;

/**
 * 密码加密工具
 */
public class PasswordUtil {

    private static final String PASSWORD_SALT = "mistake-book-2024";

    /**
     * 对前端传来的密码进行解密
     * 前端使用 Base64 编码，后端解码后再进行 BCrypt 加密
     */
    public static String decryptPassword(String encryptedPassword) {
        if (encryptedPassword == null || encryptedPassword.isEmpty()) {
            return encryptedPassword;
        }
        try {
            // 尝试 Base64 解码
            byte[] decoded = Base64.getDecoder().decode(encryptedPassword);
            return new String(decoded, StandardCharsets.UTF_8);
        } catch (IllegalArgumentException e) {
            // 如果不是有效的 Base64，直接返回原密码
            return encryptedPassword;
        }
    }

    /**
     * 验证密码格式
     * 检查是否是 Base64 编码的格式
     */
    public static boolean isBase64Encoded(String password) {
        if (password == null || password.isEmpty()) {
            return false;
        }
        try {
            Base64.getDecoder().decode(password);
            return true;
        } catch (IllegalArgumentException e) {
            return false;
        }
    }
}
