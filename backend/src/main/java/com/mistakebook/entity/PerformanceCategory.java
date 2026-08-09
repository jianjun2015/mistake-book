package com.mistakebook.entity;

import jakarta.persistence.*;
import lombok.Data;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

/**
 * 表现分类实体类
 */
@Data
@Entity
@Table(name = "performance_category")
public class PerformanceCategory {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /**
     * 用户ID
     */
    @Column(name = "user_id", nullable = false)
    private Long userId;

    /**
     * 类型：EXAM-考试, LEARNING-学习, DAILY-日常
     */
    @Column(name = "type", length = 20, nullable = false)
    private String type;

    /**
     * 分类名称
     */
    @Column(name = "name", length = 50, nullable = false)
    private String name;

    /**
     * 满分值，默认10
     */
    @Column(name = "max_score")
    private Integer maxScore = 10;

    /**
     * 排序序号，默认0
     */
    @Column(name = "sort_order")
    private Integer sortOrder = 0;

    /**
     * 创建时间
     */
    @CreationTimestamp
    @Column(name = "create_time", updatable = false)
    private LocalDateTime createTime;
}
