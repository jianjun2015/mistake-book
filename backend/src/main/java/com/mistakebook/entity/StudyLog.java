package com.mistakebook.entity;

import lombok.Data;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;

/**
 * 学习日志 - MongoDB 文档示例
 */
@Data
@Document(collection = "study_logs")
public class StudyLog {

    @Id
    private String id;

    private Long userId;

    private String action;

    private String content;

    private LocalDateTime createTime;
}
