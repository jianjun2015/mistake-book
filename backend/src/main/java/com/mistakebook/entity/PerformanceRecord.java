package com.mistakebook.entity;

import jakarta.persistence.*;
import lombok.Data;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * 表现记录实体类
 */
@Data
@Entity
@Table(name = "performance_record")
public class PerformanceRecord {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /**
     * 用户ID
     */
    @Column(name = "user_id", nullable = false)
    private Long userId;

    /**
     * 分类ID
     */
    @Column(name = "category_id", nullable = false)
    private Long categoryId;

    /**
     * 类型：EXAM-考试, LEARNING-学习, DAILY-日常
     */
    @Column(name = "type", length = 20, nullable = false)
    private String type;

    /**
     * 标题
     */
    @Column(name = "title", length = 200, nullable = false)
    private String title;

    /**
     * 分数
     */
    @Column(name = "score", precision = 5, scale = 2)
    private BigDecimal score;

    /**
     * 记录日期
     */
    @Column(name = "record_date", nullable = false)
    private LocalDate recordDate;

    /**
     * 备注
     */
    @Column(name = "remark", length = 500)
    private String remark;

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

    /**
     * 分类名称（非数据库字段，用于前端展示）
     */
    @Transient
    private String categoryName;
}
