package com.mistakebook.service;

import com.mistakebook.entity.PerformanceCategory;
import com.mistakebook.entity.PerformanceRecord;
import com.mistakebook.entity.PerformanceSummary;

import java.time.LocalDate;
import java.util.List;

/**
 * 表现记录服务接口
 */
public interface PerformanceService {

    /**
     * 获取分类列表
     */
    List<PerformanceCategory> getCategories(Long userId, String type);

    /**
     * 添加分类
     */
    PerformanceCategory addCategory(Long userId, PerformanceCategory category);

    /**
     * 更新分类
     */
    PerformanceCategory updateCategory(Long id, PerformanceCategory category);

    /**
     * 删除分类
     */
    void deleteCategory(Long id);

    /**
     * 获取记录列表
     */
    List<PerformanceRecord> getRecords(Long userId, String type, LocalDate startDate, LocalDate endDate);

    /**
     * 添加记录
     */
    PerformanceRecord addRecord(Long userId, PerformanceRecord record);

    /**
     * 更新记录
     */
    PerformanceRecord updateRecord(Long id, PerformanceRecord record);

    /**
     * 删除记录
     */
    void deleteRecord(Long id);

    /**
     * 获取总结列表
     */
    List<PerformanceSummary> getSummaries(Long userId);

    /**
     * 生成总结
     */
    PerformanceSummary generateSummary(Long userId, String periodName, LocalDate startDate, LocalDate endDate);

    /**
     * 更新总结
     */
    PerformanceSummary updateSummary(Long id, String studentSummary, String improvementPlan, String parentComment);
}
