package com.mistakebook.entity;

import jakarta.persistence.*;
import lombok.Data;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

/**
 * 疑难点实体
 */
@Data
@Entity
@Table(name = "knowledge_doubt", uniqueConstraints = {
    @UniqueConstraint(columnNames = {"semester_key", "subject_key"})
})
public class KnowledgeDoubt {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long userId;

    /**
     * 学期标识，如 grade3-down
     */
    @Column(name = "semester_key", nullable = false, length = 50)
    private String semesterKey;

    /**
     * 科目标识，如 chinese, math, english
     */
    @Column(name = "subject_key", nullable = false, length = 50)
    private String subjectKey;

    /**
     * 疑难点内容（富文本）
     */
    @Column(columnDefinition = "TEXT")
    private String content;

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime createTime;

    @UpdateTimestamp
    private LocalDateTime updateTime;
}
