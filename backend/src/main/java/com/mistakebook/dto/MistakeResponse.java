package com.mistakebook.dto;

import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;

/**
 * 错题响应DTO
 */
@Data
public class MistakeResponse {

    private Long id;
    private Long userId;
    private String title;
    private String content;
    private String correctAnswer;
    private String wrongReason;
    private String subject;
    private Integer difficulty;
    private List<String> tags;
    private Integer status;
    private Integer reviewCount;
    private LocalDateTime nextReviewTime;
    private LocalDateTime createTime;
    private LocalDateTime updateTime;
    private List<ImageInfo> images;

    @Data
    public static class ImageInfo {
        private Long id;
        private String imageUrl;
        private Integer imageType;
        private Integer sortOrder;
    }
}
