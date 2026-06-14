package com.mistakebook.service;

import com.mistakebook.dto.MistakeRequest;
import com.mistakebook.dto.MistakeResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;

public interface MistakeService {

    /**
     * 创建错题
     */
    MistakeResponse create(Long userId, MistakeRequest request);

    /**
     * 获取错题详情
     */
    MistakeResponse getById(Long id);

    /**
     * 分页获取错题列表
     */
    Page<MistakeResponse> getList(Long userId, Pageable pageable);

    /**
     * 按学科筛选
     */
    Page<MistakeResponse> getBySubject(Long userId, String subject, Pageable pageable);

    /**
     * 搜索错题
     */
    Page<MistakeResponse> search(Long userId, String keyword, Pageable pageable);

    /**
     * 更新错题
     */
    MistakeResponse update(Long id, MistakeRequest request);

    /**
     * 删除错题
     */
    void delete(Long id);

    /**
     * 更新掌握状态
     */
    MistakeResponse updateStatus(Long id, Integer status);

    /**
     * 获取所有学科列表
     */
    List<String> getSubjects(Long userId);
}
