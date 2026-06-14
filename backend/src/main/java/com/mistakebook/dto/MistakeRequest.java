package com.mistakebook.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.util.List;

/**
 * 创建/更新错题请求DTO
 */
@Data
public class MistakeRequest {

    /**
     * 题目摘要
     */
    @Size(max = 200, message = "题目摘要不能超过200个字符")
    private String title;

    /**
     * 题目内容
     */
    @NotBlank(message = "题目内容不能为空")
    private String content;

    /**
     * 正确答案
     */
    private String correctAnswer;

    /**
     * 错误分析
     */
    private String wrongReason;

    /**
     * 学科：MATH-数学, PHYSICS-物理, CHEMISTRY-化学, BIOLOGY-生物, ENGLISH-英语
     */
    private String subject;

    /**
     * 难度 1-5
     */
    private Integer difficulty;

    /**
     * 标签，逗号分隔
     */
    private String tags;

    /**
     * 掌握状态：0-未掌握，1-半掌握，2-已掌握
     */
    private Integer status;

    /**
     * 图片URL列表
     */
    private List<String> images;
}
