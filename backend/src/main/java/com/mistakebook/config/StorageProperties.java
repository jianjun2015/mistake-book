package com.mistakebook.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

/**
 * 文件上传配置
 */
@Configuration
@ConfigurationProperties(prefix = "app.storage")
public class StorageProperties {

    private String uploadDir = "./uploads";

    public String getUploadDir() {
        return uploadDir;
    }

    public void setUploadDir(String uploadDir) {
        this.uploadDir = uploadDir;
    }
}
