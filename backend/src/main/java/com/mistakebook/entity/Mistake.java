package com.mistakebook.entity;

import jakarta.persistence.*;
import lombok.Data;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

/**
 * 错题实体类
 */
@Data
@Entity
@Table(name = "t_mistake")
public class Mistake {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /**
     * 用户ID
     */
    @Column(name = "user_id", nullable = false)
    private Long userId;

    /**
     * 题目摘要
     */
    @Column(name = "title", length = 200)
    private String title;

    /**
     * 题目内容
     */
    @Column(name = "content", columnDefinition = "TEXT")
    private String content;

    /**
     * 正确答案
     */
    @Column(name = "correct_answer", columnDefinition = "TEXT")
    private String correctAnswer;

    /**
     * 错误分析
     */
    @Column(name = "wrong_reason", columnDefinition = "TEXT")
    private String wrongReason;

    /**
     * 学科：MATH-数学, PHYSICS-物理, CHEMISTRY-化学, BIOLOGY-生物, ENGLISH-英语
     */
    @Column(name = "subject", length = 20)
    private String subject;

    /**
     * 难度 1-5
     */
    @Column(name = "difficulty")
    private Integer difficulty;

    /**
     * 标签，逗号分隔
     */
    @Column(name = "tags", length = 500)
    private String tags;

    /**
     * 掌握状态：0-未掌握，1-半掌握，2-已掌握
     */
    @Column(name = "status")
    private Integer status;

    /**
     * 复习次数
     */
    @Column(name = "review_count")
    private Integer reviewCount;

    /**
     * 下次复习时间
     */
    @Column(name = "next_review_time")
    private LocalDateTime nextReviewTime;

    /**
     * 创建时间
     */
    @CreationTimestamp
    @Column(name = "create_time", updatable = false)
    private LocalDateTime createTime;

    /**
     * 更新时间
     */
    @UpdateTimestamp
    @Column(name = "update_time")
    private LocalDateTime updateTime;
}
