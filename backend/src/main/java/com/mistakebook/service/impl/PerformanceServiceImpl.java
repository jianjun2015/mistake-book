package com.mistakebook.service.impl;

import com.mistakebook.entity.PerformanceCategory;
import com.mistakebook.entity.PerformanceRecord;
import com.mistakebook.entity.PerformanceSummary;
import com.mistakebook.repository.PerformanceCategoryRepository;
import com.mistakebook.repository.PerformanceRecordRepository;
import com.mistakebook.repository.PerformanceSummaryRepository;
import com.mistakebook.service.PerformanceService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;

/**
 * 表现记录服务实现
 */
@Slf4j
@Service
public class PerformanceServiceImpl implements PerformanceService {

    private final PerformanceCategoryRepository categoryRepository;
    private final PerformanceRecordRepository recordRepository;
    private final PerformanceSummaryRepository summaryRepository;

    public PerformanceServiceImpl(PerformanceCategoryRepository categoryRepository,
                                  PerformanceRecordRepository recordRepository,
                                  PerformanceSummaryRepository summaryRepository) {
        this.categoryRepository = categoryRepository;
        this.recordRepository = recordRepository;
        this.summaryRepository = summaryRepository;
    }

    @Override
    public List<PerformanceCategory> getCategories(Long userId, String type) {
        log.info("获取表现分类: userId={}, type={}", userId, type);
        if (type != null && !type.isEmpty()) {
            return categoryRepository.findByUserIdAndTypeOrderBySortOrder(userId, type);
        }
        return categoryRepository.findByUserIdOrderBySortOrder(userId);
    }

    @Override
    @Transactional
    public PerformanceCategory addCategory(Long userId, PerformanceCategory category) {
        log.info("添加表现分类: userId={}, name={}, type={}", userId, category.getName(), category.getType());
        category.setUserId(userId);
        if (category.getMaxScore() == null) {
            category.setMaxScore(10);
        }
        if (category.getSortOrder() == null) {
            category.setSortOrder(0);
        }
        return categoryRepository.save(category);
    }

    @Override
    @Transactional
    public PerformanceCategory updateCategory(Long id, PerformanceCategory category) {
        log.info("更新表现分类: id={}", id);
        PerformanceCategory existing = categoryRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("分类不存在: " + id));
        if (category.getName() != null) {
            existing.setName(category.getName());
        }
        if (category.getType() != null) {
            existing.setType(category.getType());
        }
        if (category.getMaxScore() != null) {
            existing.setMaxScore(category.getMaxScore());
        }
        if (category.getSortOrder() != null) {
            existing.setSortOrder(category.getSortOrder());
        }
        return categoryRepository.save(existing);
    }

    @Override
    @Transactional
    public void deleteCategory(Long id) {
        log.info("删除表现分类: id={}", id);
        categoryRepository.deleteById(id);
    }

    @Override
    public List<PerformanceRecord> getRecords(Long userId, String type, LocalDate startDate, LocalDate endDate) {
        log.info("获取表现记录: userId={}, type={}, start={}, end={}", userId, type, startDate, endDate);
        List<PerformanceRecord> records;
        if (type != null && !type.isEmpty() && startDate != null && endDate != null) {
            records = recordRepository.findByUserIdAndTypeAndRecordDateBetween(userId, type, startDate, endDate);
        } else if (startDate != null && endDate != null) {
            records = recordRepository.findByUserIdAndRecordDateBetween(userId, startDate, endDate);
        } else if (type != null && !type.isEmpty()) {
            records = recordRepository.findByUserIdAndType(userId, type);
        } else {
            records = recordRepository.findByUserIdAndRecordDateBetween(userId, LocalDate.of(2000, 1, 1), LocalDate.of(2099, 12, 31));
        }
        // 填充分类名称
        populateCategoryNames(records);
        return records;
    }

    /**
     * 为记录列表填充分类名称
     */
    private void populateCategoryNames(List<PerformanceRecord> records) {
        if (records == null || records.isEmpty()) {
            return;
        }
        // 获取所有分类ID
        List<Long> categoryIds = records.stream()
                .map(PerformanceRecord::getCategoryId)
                .filter(id -> id != null)
                .distinct()
                .collect(java.util.stream.Collectors.toList());
        if (categoryIds.isEmpty()) {
            return;
        }
        // 批量查询分类
        Map<Long, String> categoryNameMap = categoryRepository.findAllById(categoryIds)
                .stream()
                .collect(java.util.stream.Collectors.toMap(PerformanceCategory::getId, PerformanceCategory::getName));
        // 填充分类名称
        for (PerformanceRecord record : records) {
            if (record.getCategoryId() != null) {
                record.setCategoryName(categoryNameMap.getOrDefault(record.getCategoryId(), "未知分类"));
            }
        }
    }

    @Override
    @Transactional
    public PerformanceRecord addRecord(Long userId, PerformanceRecord record) {
        log.info("添加表现记录: userId={}, title={}, type={}", userId, record.getTitle(), record.getType());
        record.setUserId(userId);
        return recordRepository.save(record);
    }

    @Override
    @Transactional
    public PerformanceRecord updateRecord(Long id, PerformanceRecord record) {
        log.info("更新表现记录: id={}", id);
        PerformanceRecord existing = recordRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("记录不存在: " + id));
        if (record.getCategoryId() != null) {
            existing.setCategoryId(record.getCategoryId());
        }
        if (record.getType() != null) {
            existing.setType(record.getType());
        }
        if (record.getTitle() != null) {
            existing.setTitle(record.getTitle());
        }
        if (record.getScore() != null) {
            existing.setScore(record.getScore());
        }
        if (record.getRecordDate() != null) {
            existing.setRecordDate(record.getRecordDate());
        }
        if (record.getRemark() != null) {
            existing.setRemark(record.getRemark());
        }
        return recordRepository.save(existing);
    }

    @Override
    @Transactional
    public void deleteRecord(Long id) {
        log.info("删除表现记录: id={}", id);
        recordRepository.deleteById(id);
    }

    @Override
    public List<PerformanceSummary> getSummaries(Long userId) {
        log.info("获取表现总结: userId={}", userId);
        return summaryRepository.findByUserIdOrderByStartDateDesc(userId);
    }

    @Override
    @Transactional
    public PerformanceSummary generateSummary(Long userId, String periodName, LocalDate startDate, LocalDate endDate) {
        log.info("生成表现总结: userId={}, periodName={}, start={}, end={}", userId, periodName, startDate, endDate);

        // 获取各类型记录
        List<PerformanceRecord> examRecords = recordRepository.findByUserIdAndTypeAndRecordDateBetween(userId, "EXAM", startDate, endDate);
        List<PerformanceRecord> learningRecords = recordRepository.findByUserIdAndTypeAndRecordDateBetween(userId, "LEARNING", startDate, endDate);
        List<PerformanceRecord> dailyRecords = recordRepository.findByUserIdAndTypeAndRecordDateBetween(userId, "DAILY", startDate, endDate);

        // 计算平均分
        BigDecimal examAvg = calculateAverage(examRecords);
        BigDecimal learningAvg = calculateAverage(learningRecords);
        BigDecimal dailyAvg = calculateAverage(dailyRecords);

        // 考试满分100，学习/日常满分10，需要归一化到100
        BigDecimal examNormalized = examAvg; // 考试已经是100分制
        BigDecimal learningNormalized = learningAvg.compareTo(BigDecimal.ZERO) > 0
                ? learningAvg.multiply(BigDecimal.TEN).setScale(2, RoundingMode.HALF_UP) : BigDecimal.ZERO;
        BigDecimal dailyNormalized = dailyAvg.compareTo(BigDecimal.ZERO) > 0
                ? dailyAvg.multiply(BigDecimal.TEN).setScale(2, RoundingMode.HALF_UP) : BigDecimal.ZERO;

        // 加权计算总分: 考试40%, 学习30%, 日常30%
        BigDecimal totalScore = BigDecimal.ZERO;
        boolean hasAnyData = false;

        if (examRecords.size() > 0) {
            totalScore = totalScore.add(examNormalized.multiply(new BigDecimal("0.4")));
            hasAnyData = true;
        }
        if (learningRecords.size() > 0) {
            totalScore = totalScore.add(learningNormalized.multiply(new BigDecimal("0.3")));
            hasAnyData = true;
        }
        if (dailyRecords.size() > 0) {
            totalScore = totalScore.add(dailyNormalized.multiply(new BigDecimal("0.3")));
            hasAnyData = true;
        }

        if (!hasAnyData) {
            totalScore = BigDecimal.ZERO;
        }

        totalScore = totalScore.setScale(2, RoundingMode.HALF_UP);

        // 计算等级
        String grade = calculateGrade(totalScore);

        // 创建总结
        PerformanceSummary summary = new PerformanceSummary();
        summary.setUserId(userId);
        summary.setPeriodName(periodName);
        summary.setStartDate(startDate);
        summary.setEndDate(endDate);
        summary.setExamAvg(examAvg);
        summary.setLearningAvg(learningAvg);
        summary.setDailyAvg(dailyAvg);
        summary.setTotalScore(totalScore);
        summary.setGrade(grade);

        return summaryRepository.save(summary);
    }

    @Override
    @Transactional
    public PerformanceSummary updateSummary(Long id, String studentSummary, String improvementPlan, String parentComment) {
        log.info("更新表现总结: id={}", id);
        PerformanceSummary existing = summaryRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("总结不存在: " + id));
        if (studentSummary != null) {
            existing.setStudentSummary(studentSummary);
        }
        if (improvementPlan != null) {
            existing.setImprovementPlan(improvementPlan);
        }
        if (parentComment != null) {
            existing.setParentComment(parentComment);
        }
        return summaryRepository.save(existing);
    }

    /**
     * 计算平均分
     */
    private BigDecimal calculateAverage(List<PerformanceRecord> records) {
        if (records == null || records.isEmpty()) {
            return BigDecimal.ZERO;
        }
        BigDecimal sum = records.stream()
                .map(PerformanceRecord::getScore)
                .filter(score -> score != null)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        long count = records.stream()
                .filter(r -> r.getScore() != null)
                .count();
        if (count == 0) {
            return BigDecimal.ZERO;
        }
        return sum.divide(BigDecimal.valueOf(count), 2, RoundingMode.HALF_UP);
    }

    /**
     * 计算等级
     * A+ >= 90, A >= 80, B >= 70, C >= 60, D >= 50, D- < 50
     */
    private String calculateGrade(BigDecimal score) {
        if (score.compareTo(new BigDecimal("90")) >= 0) {
            return "A+";
        } else if (score.compareTo(new BigDecimal("80")) >= 0) {
            return "A";
        } else if (score.compareTo(new BigDecimal("70")) >= 0) {
            return "B";
        } else if (score.compareTo(new BigDecimal("60")) >= 0) {
            return "C";
        } else if (score.compareTo(new BigDecimal("50")) >= 0) {
            return "D";
        } else {
            return "D-";
        }
    }
}
