package com.mistakebook.controller;

import com.mistakebook.config.StorageProperties;
import com.mistakebook.dto.MistakeResponse;
import com.mistakebook.entity.MistakeImage;
import com.mistakebook.repository.MistakeImageRepository;
import com.mistakebook.util.Result;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.net.MalformedURLException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * 图片管理控制器
 */
@Slf4j
@Tag(name = "图片管理", description = "错题图片上传与管理")
@RestController
@RequestMapping("/api/images")
public class ImageController {

    private final StorageProperties storageProperties;
    private final MistakeImageRepository mistakeImageRepository;

    @Autowired
    public ImageController(StorageProperties storageProperties, MistakeImageRepository mistakeImageRepository) {
        this.storageProperties = storageProperties;
        this.mistakeImageRepository = mistakeImageRepository;
    }

    @Operation(summary = "上传错题图片")
    @PostMapping("/upload")
    public Result<Map<String, Object>> uploadImage(
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "mistakeId", required = false) Long mistakeId,
            @RequestParam(value = "imageType", defaultValue = "1") Integer imageType) {

        log.info("图片上传请求: originalFilename={}, size={}, mistakeId={}, imageType={}", 
                file.getOriginalFilename(), file.getSize(), mistakeId, imageType);

        if (file.isEmpty()) {
            log.warn("图片上传失败: 文件为空");
            return Result.error(400, "请选择上传文件");
        }

        try {
            // 生成唯一文件名
            String originalFilename = file.getOriginalFilename();
            String extension = "";
            if (originalFilename != null && originalFilename.contains(".")) {
                extension = originalFilename.substring(originalFilename.lastIndexOf("."));
            }
            String newFilename = UUID.randomUUID().toString().replace("-", "") + extension;

            // 创建上传目录
            Path uploadPath = Paths.get(storageProperties.getUploadDir());
            if (!Files.exists(uploadPath)) {
                Files.createDirectories(uploadPath);
                log.info("创建上传目录: {}", uploadPath.toAbsolutePath());
            }

            // 保存文件
            Path targetPath = uploadPath.resolve(newFilename);
            Files.copy(file.getInputStream(), targetPath, StandardCopyOption.REPLACE_EXISTING);
            log.info("图片保存成功: path={}, size={}", targetPath.toAbsolutePath(), file.getSize());

            // 保存图片记录
            MistakeImage image = new MistakeImage();
            image.setMistakeId(mistakeId != null ? mistakeId : 0L);
            image.setImageUrl("/uploads/" + newFilename);
            image.setImageType(imageType);
            image.setSortOrder(mistakeImageRepository.findByMistakeIdOrderBySortOrderAsc(
                    mistakeId != null ? mistakeId : 0L).size() + 1);
            image = mistakeImageRepository.save(image);

            Map<String, Object> result = new HashMap<>();
            result.put("id", image.getId());
            result.put("imageUrl", image.getImageUrl());
            result.put("imageType", image.getImageType());
            
            log.info("图片上传完成: id={}, imageUrl={}", image.getId(), image.getImageUrl());
            return Result.success("图片上传成功", result);

        } catch (IOException e) {
            log.error("图片上传IO异常: originalFilename={}", file.getOriginalFilename(), e);
            return Result.error("图片上传失败: " + e.getMessage());
        } catch (Exception e) {
            log.error("图片上传异常: originalFilename={}", file.getOriginalFilename(), e);
            return Result.error("图片上传失败: " + e.getMessage());
        }
    }

    @Operation(summary = "删除图片")
    @DeleteMapping("/{id}")
    public Result<Void> deleteImage(@PathVariable Long id) {
        log.info("删除图片请求: id={}", id);
        MistakeImage image = mistakeImageRepository.findById(id)
                .orElseThrow(() -> {
                    log.error("图片不存在: id={}", id);
                    return new RuntimeException("图片不存在");
                });

        // 删除物理文件
        try {
            Path filePath = Paths.get(storageProperties.getUploadDir())
                    .resolve(Paths.get(image.getImageUrl()).getFileName())
                    .normalize();
            Files.deleteIfExists(filePath);
            log.info("物理文件删除: path={}", filePath.toAbsolutePath());
        } catch (IOException e) {
            log.warn("物理文件删除失败: id={}, error={}", id, e.getMessage());
        }

        mistakeImageRepository.delete(image);
        log.info("图片记录删除成功: id={}", id);
        return Result.success("图片删除成功", null);
    }

    @Operation(summary = "获取错题图片列表")
    @GetMapping("/mistake/{mistakeId}")
    public Result<List<MistakeResponse.ImageInfo>> getImages(@PathVariable Long mistakeId) {
        log.info("获取错题图片列表: mistakeId={}", mistakeId);
        List<MistakeImage> images = mistakeImageRepository.findByMistakeIdOrderBySortOrderAsc(mistakeId);
        List<MistakeResponse.ImageInfo> result = new ArrayList<>();
        for (MistakeImage img : images) {
            MistakeResponse.ImageInfo info = new MistakeResponse.ImageInfo();
            info.setId(img.getId());
            info.setImageUrl(img.getImageUrl());
            info.setImageType(img.getImageType());
            info.setSortOrder(img.getSortOrder());
            result.add(info);
        }
        log.info("错题图片列表: mistakeId={}, count={}", mistakeId, result.size());
        return Result.success(result);
    }

    @Operation(summary = "访问图片")
    @GetMapping("/{filename}")
    public ResponseEntity<Resource> getImage(@PathVariable String filename) throws MalformedURLException {
        log.debug("访问图片: filename={}", filename);
        Path filePath = Paths.get(storageProperties.getUploadDir()).resolve(filename).normalize();
        Resource resource = new UrlResource(filePath.toUri());

        if (!resource.exists()) {
            log.warn("图片文件不存在: filename={}", filename);
            return ResponseEntity.notFound().build();
        }

        String contentType = "image/jpeg";
        if (filename.endsWith(".png")) contentType = "image/png";
        else if (filename.endsWith(".gif")) contentType = "image/gif";
        else if (filename.endsWith(".webp")) contentType = "image/webp";
        else if (filename.endsWith(".svg")) contentType = "image/svg+xml";

        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(contentType))
                .header(HttpHeaders.CACHE_CONTROL, "max-age=3600")
                .body(resource);
    }
}
