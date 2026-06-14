package com.mistakebook.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import java.nio.file.Paths;

/**
 * 静态资源映射配置
 */
@Configuration
public class ResourceConfig implements WebMvcConfigurer {

    private final StorageProperties storageProperties;

    public ResourceConfig(StorageProperties storageProperties) {
        this.storageProperties = storageProperties;
    }

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        String uploadDir = storageProperties.getUploadDir();
        java.nio.file.Path uploadPath = Paths.get(uploadDir);
        String uploadPathAbs = uploadPath.toAbsolutePath().toString();

        registry.addResourceHandler("/uploads/**")
                .addResourceLocations("file:" + uploadPathAbs + "/");
    }
}
