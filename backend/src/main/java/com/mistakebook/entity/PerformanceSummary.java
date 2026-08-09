package com.mistakebook.entity;

import jakarta.persistence.*;
import lombok.Data;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * 表现总结实体类
 */
@Data
@Entity
@Table(name = "performance_summary")
public class PerformanceSummary {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /**
     * 用户ID
     */
    @Column(name = "user_id", nullable = false)
    private Long userId;

    /**
     * 周期名称
     */
    @Column(name = "period_name", length = 50, nullable = false)
    private String periodName;

    /**
     * 开始日期
     */
    @Column(name = "start_date", nullable = false)
    private LocalDate startDate;

    /**
     * 结束日期
     */
    @Column(name = "end_date", nullable = false)
    private LocalDate endDate;

    /**
     * 考试平均分
     */
    @Column(name = "exam_avg", precision = 5, scale = 2)
    private BigDecimal examAvg;

    /**
     * 学习平均分
     */
    @Column(name = "learning_avg", precision = 5, scale = 2)
    private BigDecimal learningAvg;

    /**
     * 日常平均分
     */
    @Column(name = "daily_avg", precision = 5, scale = 2)
    private BigDecimal dailyAvg;

    /**
     * 总评分
     */
    @Column(name = "total_score", precision = 5, scale = 2)
    private BigDecimal totalScore;

    /**
     * 等级：A+, A, B, C, D, D-
     */
    @Column(name = "grade", length = 5)
    private String grade;

    /**
     * 学生自评
     */
    @Column(name = "student_summary", columnDefinition = "TEXT")
    private String studentSummary;

    /**
     * 改进计划
     */
    @Column(name = "improvement_plan", columnDefinition = "TEXT")
    private String improvementPlan;

    /**
     * 家长评语
     */
    @Column(name = "parent_comment", columnDefinition = "TEXT")
    private String parentComment;

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
