package com.mistakebook.service.impl;

import com.mistakebook.dto.MistakeRequest;
import com.mistakebook.dto.MistakeResponse;
import com.mistakebook.entity.Mistake;
import com.mistakebook.entity.MistakeImage;
import com.mistakebook.repository.MistakeImageRepository;
import com.mistakebook.repository.MistakeRepository;
import com.mistakebook.service.MistakeService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

/**
 * 错题服务实现
 */
@Slf4j
@Service
public class MistakeServiceImpl implements MistakeService {

    private final MistakeRepository mistakeRepository;
    private final MistakeImageRepository mistakeImageRepository;

    public MistakeServiceImpl(MistakeRepository mistakeRepository,
                              MistakeImageRepository mistakeImageRepository) {
        this.mistakeRepository = mistakeRepository;
        this.mistakeImageRepository = mistakeImageRepository;
    }

    @Override
    @Transactional
    public MistakeResponse create(Long userId, MistakeRequest request) {
        log.info("创建错题: userId={}, title={}", userId, request.getTitle());
        
        Mistake mistake = new Mistake();
        mistake.setUserId(userId);
        mistake.setTitle(request.getTitle());
        mistake.setContent(request.getContent());
        mistake.setCorrectAnswer(request.getCorrectAnswer());
        mistake.setWrongReason(request.getWrongReason());
        mistake.setSubject(request.getSubject());
        mistake.setDifficulty(request.getDifficulty());
        mistake.setTags(request.getTags());
        mistake.setStatus(0); // 默认未掌握
        mistake.setReviewCount(0);

        Mistake saved = mistakeRepository.save(mistake);
        log.info("错题保存成功: id={}", saved.getId());

        // 关联已上传的图片
        if (request.getImages() != null && !request.getImages().isEmpty()) {
            log.info("关联图片: mistakeId={}, imageCount={}", saved.getId(), request.getImages().size());
            for (int i = 0; i < request.getImages().size(); i++) {
                String imageUrl = request.getImages().get(i);
                // 查找已上传的图片记录（mistake_id=0 的图片）
                List<MistakeImage> existingImages = mistakeImageRepository.findByMistakeIdOrderBySortOrderAsc(0L);
                MistakeImage image = existingImages.stream()
                        .filter(img -> img.getImageUrl().equals(imageUrl))
                        .findFirst()
                        .orElse(null);

                if (image != null) {
                    // 更新已有图片的 mistake_id
                    image.setMistakeId(saved.getId());
                    image.setSortOrder(i + 1);
                    mistakeImageRepository.save(image);
                    log.debug("更新图片关联: imageId={}, imageUrl={}", image.getId(), imageUrl);
                } else {
                    // 创建新的图片记录
                    MistakeImage newImage = new MistakeImage();
                    newImage.setMistakeId(saved.getId());
                    newImage.setImageUrl(imageUrl);
                    newImage.setImageType(1);
                    newImage.setSortOrder(i + 1);
                    mistakeImageRepository.save(newImage);
                    log.debug("创建图片记录: imageUrl={}", imageUrl);
                }
            }
            log.info("图片关联完成: mistakeId={}", saved.getId());
        }

        return convertToResponse(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public MistakeResponse getById(Long id) {
        log.debug("获取错题详情: id={}", id);
        Mistake mistake = mistakeRepository.findById(id)
                .orElseThrow(() -> {
                    log.error("错题不存在: id={}", id);
                    return new RuntimeException("错题不存在");
                });
        return convertToResponse(mistake);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<MistakeResponse> getList(Long userId, Pageable pageable) {
        log.debug("获取错题列表: userId={}, page={}, size={}", userId, pageable.getPageNumber(), pageable.getPageSize());
        return mistakeRepository.findByUserIdOrderByCreateTimeDesc(userId, pageable)
                .map(this::convertToResponse);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<MistakeResponse> getBySubject(Long userId, String subject, Pageable pageable) {
        log.debug("按学科筛选: userId={}, subject={}", userId, subject);
        return mistakeRepository.findByUserIdAndSubjectOrderByCreateTimeDesc(userId, subject, pageable)
                .map(this::convertToResponse);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<MistakeResponse> search(Long userId, String keyword, Pageable pageable) {
        log.debug("搜索错题: userId={}, keyword={}", userId, keyword);
        return mistakeRepository.searchByKeyword(userId, keyword, pageable)
                .map(this::convertToResponse);
    }

    @Override
    @Transactional
    public MistakeResponse update(Long id, MistakeRequest request) {
        log.info("更新错题: id={}", id);
        Mistake mistake = mistakeRepository.findById(id)
                .orElseThrow(() -> {
                    log.error("错题不存在: id={}", id);
                    return new RuntimeException("错题不存在");
                });

        if (StringUtils.hasText(request.getTitle())) {
            mistake.setTitle(request.getTitle());
        }
        if (StringUtils.hasText(request.getContent())) {
            mistake.setContent(request.getContent());
        }
        if (StringUtils.hasText(request.getCorrectAnswer())) {
            mistake.setCorrectAnswer(request.getCorrectAnswer());
        }
        if (StringUtils.hasText(request.getWrongReason())) {
            mistake.setWrongReason(request.getWrongReason());
        }
        if (StringUtils.hasText(request.getSubject())) {
            mistake.setSubject(request.getSubject());
        }
        if (request.getDifficulty() != null) {
            mistake.setDifficulty(request.getDifficulty());
        }
        if (StringUtils.hasText(request.getTags())) {
            mistake.setTags(request.getTags());
        }

        Mistake saved = mistakeRepository.save(mistake);
        log.info("错题更新成功: id={}", id);
        return convertToResponse(saved);
    }

    @Override
    @Transactional
    public void delete(Long id) {
        log.info("删除错题: id={}", id);
        if (!mistakeRepository.existsById(id)) {
            log.error("错题不存在: id={}", id);
            throw new RuntimeException("错题不存在");
        }
        mistakeImageRepository.deleteByMistakeId(id);
        mistakeRepository.deleteById(id);
        log.info("错题删除成功: id={}", id);
    }

    @Override
    @Transactional
    public MistakeResponse updateStatus(Long id, Integer status) {
        log.info("更新掌握状态: id={}, status={}", id, status);
        Mistake mistake = mistakeRepository.findById(id)
                .orElseThrow(() -> {
                    log.error("错题不存在: id={}", id);
                    return new RuntimeException("错题不存在");
                });
        mistake.setStatus(status);
        Mistake saved = mistakeRepository.save(mistake);
        log.info("状态更新成功: id={}, newStatus={}", id, status);
        return convertToResponse(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public List<String> getSubjects(Long userId) {
        log.debug("获取学科列表: userId={}", userId);
        List<String> subjects = mistakeRepository.findSubjectsByUserId(userId);
        log.debug("学科列表: userId={}, count={}", userId, subjects.size());
        return subjects;
    }

    private MistakeResponse convertToResponse(Mistake mistake) {
        MistakeResponse response = new MistakeResponse();
        response.setId(mistake.getId());
        response.setUserId(mistake.getUserId());
        response.setTitle(mistake.getTitle());
        response.setContent(mistake.getContent());
        response.setCorrectAnswer(mistake.getCorrectAnswer());
        response.setWrongReason(mistake.getWrongReason());
        response.setSubject(mistake.getSubject());
        response.setDifficulty(mistake.getDifficulty());
        response.setTags(parseTags(mistake.getTags()));
        response.setStatus(mistake.getStatus());
        response.setReviewCount(mistake.getReviewCount());
        response.setNextReviewTime(mistake.getNextReviewTime());
        response.setCreateTime(mistake.getCreateTime());
        response.setUpdateTime(mistake.getUpdateTime());

        // 关联图片
        List<MistakeImage> images = mistakeImageRepository.findByMistakeIdOrderBySortOrderAsc(mistake.getId());
        List<MistakeResponse.ImageInfo> imageInfos = images.stream().map(img -> {
            MistakeResponse.ImageInfo info = new MistakeResponse.ImageInfo();
            info.setId(img.getId());
            info.setImageUrl(img.getImageUrl());
            info.setImageType(img.getImageType());
            info.setSortOrder(img.getSortOrder());
            return info;
        }).collect(Collectors.toList());
        response.setImages(imageInfos);

        return response;
    }

    private List<String> parseTags(String tagsJson) {
        if (!StringUtils.hasText(tagsJson)) {
            return new ArrayList<>();
        }
        return List.of(tagsJson.split(","));
    }
}
