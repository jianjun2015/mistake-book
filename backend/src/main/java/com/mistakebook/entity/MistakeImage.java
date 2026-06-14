package com.mistakebook.entity;

import jakarta.persistence.*;
import lombok.Data;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

/**
 * 错题图片实体类
 */
@Data
@Entity
@Table(name = "t_mistake_image")
public class MistakeImage {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /**
     * 关联的错题ID
     */
    @Column(name = "mistake_id", nullable = false)
    private Long mistakeId;

    /**
     * 图片URL路径
     */
    @Column(name = "image_url", length = 255)
    private String imageUrl;

    /**
     * 图片类型：1-题目图片，2-答案图片，3-解析图片，4-其他
     */
    @Column(name = "image_type")
    private Integer imageType;

    /**
     * 排序权重
     */
    @Column(name = "sort_order")
    private Integer sortOrder;

    /**
     * 创建时间
     */
    @CreationTimestamp
    @Column(name = "create_time", updatable = false)
    private LocalDateTime createTime;
}
