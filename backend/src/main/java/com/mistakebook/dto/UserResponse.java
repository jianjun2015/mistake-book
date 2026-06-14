package com.mistakebook.dto;

import lombok.Data;

import java.time.LocalDateTime;

/**
 * 用户信息响应
 */
@Data
public class UserResponse {

    private Long id;
    private String username;
    private Integer grade;
    private String gradeName;
    private Integer gender;
    private String genderName;
    private LocalDateTime createTime;

    /**
     * 年级编号转名称
     */
    public static String gradeToName(Integer grade) {
        if (grade == null) return "未知";
        return switch (grade) {
            case 1 -> "一年级";
            case 2 -> "二年级";
            case 3 -> "三年级";
            case 4 -> "四年级";
            case 5 -> "五年级";
            case 6 -> "六年级";
            case 7 -> "初一";
            case 8 -> "初二";
            case 9 -> "初三";
            case 10 -> "高一";
            case 11 -> "高二";
            case 12 -> "高三";
            default -> "未知";
        };
    }

    /**
     * 性别编号转名称
     */
    public static String genderToName(Integer gender) {
        if (gender == null) return "未知";
        return switch (gender) {
            case 1 -> "男";
            case 2 -> "女";
            default -> "未知";
        };
    }
}
