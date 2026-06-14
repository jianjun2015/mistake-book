package com.mistakebook.dto;

import jakarta.validation.constraints.*;
import lombok.Data;

/**
 * 用户注册请求
 */
@Data
public class RegisterRequest {

    @NotBlank(message = "用户名不能为空")
    @Size(min = 3, max = 50, message = "用户名长度3-50个字符")
    private String username;

    @NotBlank(message = "密码不能为空")
    @Size(min = 6, max = 100, message = "密码长度6-100个字符")
    private String password;

    @NotNull(message = "年级不能为空")
    @Min(value = 1, message = "年级最小为1")
    @Max(value = 12, message = "年级最大为12")
    private Integer grade;

    @NotNull(message = "性别不能为空")
    @Min(value = 0, message = "性别值无效")
    @Max(value = 2, message = "性别值无效")
    private Integer gender;
}
