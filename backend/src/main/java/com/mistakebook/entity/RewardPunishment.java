package com.mistakebook.entity;

import jakarta.persistence.*;
import lombok.Data;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * 奖惩记录实体类
 */
@Data
@Entity
@Table(name = "reward_punishment")
public class RewardPunishment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /**
     * 用户ID
     */
    @Column(name = "user_id", nullable = false)
    private Long userId;

    /**
     * 等级
     */
    @Column(name = "grade", length = 20)
    private String grade;

    /**
     * 分类：REWARD-奖励, PUNISHMENT-惩罚
     */
    @Column(name = "category", length = 20, nullable = false)
    private String category;

    /**
     * 子分类
     */
    @Column(name = "sub_category", length = 50)
    private String subCategory;

    /**
     * 详情
     */
    @Column(name = "detail", columnDefinition = "TEXT")
    private String detail;

    /**
     * 是否已完成/处理
     */
    @Column(name = "completed", nullable = false)
    private Boolean completed = false;

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
}
