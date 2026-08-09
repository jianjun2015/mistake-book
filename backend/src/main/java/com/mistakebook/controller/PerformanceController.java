package com.mistakebook.controller;

import com.mistakebook.entity.PerformanceCategory;
import com.mistakebook.entity.PerformanceRecord;
import com.mistakebook.entity.PerformanceSummary;
import com.mistakebook.service.PerformanceService;
import com.mistakebook.util.Result;
import com.mistakebook.util.UserContext;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.extern.slf4j.Slf4j;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

/**
 * 表现记录管理控制器
 */
@Slf4j
@Tag(name = "表现记录管理", description = "表现分类、记录、总结CRUD接口")
@RestController
@RequestMapping("/api/performance")
public class PerformanceController {

    private final PerformanceService performanceService;

    public PerformanceController(PerformanceService performanceService) {
        this.performanceService = performanceService;
    }

    // ==================== 分类管理 ====================

    @Operation(summary = "获取表现分类列表")
    @GetMapping("/categories")
    public Result<List<PerformanceCategory>> getCategories(
            @Parameter(description = "类型：EXAM/LEARNING/DAILY") @RequestParam(required = false) String type) {
        Long userId = UserContext.getCurrentUserId();
        log.info("获取表现分类: userId={}, type={}", userId, type);
        List<PerformanceCategory> data = performanceService.getCategories(userId, type);
        return Result.success(data);
    }

    @Operation(summary = "添加表现分类")
    @PostMapping("/categories")
    public Result<PerformanceCategory> addCategory(@RequestBody PerformanceCategory category) {
        Long userId = UserContext.getCurrentUserId();
        log.info("添加表现分类: userId={}, name={}, type={}", userId, category.getName(), category.getType());
        try {
            PerformanceCategory data = performanceService.addCategory(userId, category);
            log.info("添加表现分类成功: id={}", data.getId());
            return Result.success("分类添加成功", data);
        } catch (Exception e) {
            log.error("添加表现分类失败: userId={}", userId, e);
            throw e;
        }
    }

    @Operation(summary = "更新表现分类")
    @PutMapping("/categories/{id}")
    public Result<PerformanceCategory> updateCategory(
            @PathVariable Long id,
            @RequestBody PerformanceCategory category) {
        log.info("更新表现分类: id={}", id);
        try {
            PerformanceCategory data = performanceService.updateCategory(id, category);
            log.info("更新表现分类成功: id={}", id);
            return Result.success("分类更新成功", data);
        } catch (Exception e) {
            log.error("更新表现分类失败: id={}", id, e);
            throw e;
        }
    }

    @Operation(summary = "删除表现分类")
    @DeleteMapping("/categories/{id}")
    public Result<Void> deleteCategory(@PathVariable Long id) {
        log.info("删除表现分类: id={}", id);
        try {
            performanceService.deleteCategory(id);
            log.info("删除表现分类成功: id={}", id);
            return Result.success("分类删除成功", null);
        } catch (Exception e) {
            log.error("删除表现分类失败: id={}", id, e);
            throw e;
        }
    }

    // ==================== 记录管理 ====================

    @Operation(summary = "获取表现记录列表")
    @GetMapping("/records")
    public Result<List<PerformanceRecord>> getRecords(
            @Parameter(description = "类型：EXAM/LEARNING/DAILY") @RequestParam(required = false) String type,
            @Parameter(description = "开始日期") @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate start,
            @Parameter(description = "结束日期") @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate end) {
        Long userId = UserContext.getCurrentUserId();
        log.info("获取表现记录: userId={}, type={}, start={}, end={}", userId, type, start, end);
        List<PerformanceRecord> data = performanceService.getRecords(userId, type, start, end);
        return Result.success(data);
    }

    @Operation(summary = "添加表现记录")
    @PostMapping("/records")
    public Result<PerformanceRecord> addRecord(@RequestBody PerformanceRecord record) {
        Long userId = UserContext.getCurrentUserId();
        log.info("添加表现记录: userId={}, title={}, type={}", userId, record.getTitle(), record.getType());
        try {
            PerformanceRecord data = performanceService.addRecord(userId, record);
            log.info("添加表现记录成功: id={}", data.getId());
            return Result.success("记录添加成功", data);
        } catch (Exception e) {
            log.error("添加表现记录失败: userId={}", userId, e);
            throw e;
        }
    }

    @Operation(summary = "更新表现记录")
    @PutMapping("/records/{id}")
    public Result<PerformanceRecord> updateRecord(
            @PathVariable Long id,
            @RequestBody PerformanceRecord record) {
        log.info("更新表现记录: id={}", id);
        try {
            PerformanceRecord data = performanceService.updateRecord(id, record);
            log.info("更新表现记录成功: id={}", id);
            return Result.success("记录更新成功", data);
        } catch (Exception e) {
            log.error("更新表现记录失败: id={}", id, e);
            throw e;
        }
    }

    @Operation(summary = "删除表现记录")
    @DeleteMapping("/records/{id}")
    public Result<Void> deleteRecord(@PathVariable Long id) {
        log.info("删除表现记录: id={}", id);
        try {
            performanceService.deleteRecord(id);
            log.info("删除表现记录成功: id={}", id);
            return Result.success("记录删除成功", null);
        } catch (Exception e) {
            log.error("删除表现记录失败: id={}", id, e);
            throw e;
        }
    }

    // ==================== 总结管理 ====================

    @Operation(summary = "获取表现总结列表")
    @GetMapping("/summaries")
    public Result<List<PerformanceSummary>> getSummaries() {
        Long userId = UserContext.getCurrentUserId();
        log.info("获取表现总结: userId={}", userId);
        List<PerformanceSummary> data = performanceService.getSummaries(userId);
        return Result.success(data);
    }

    @Operation(summary = "生成表现总结")
    @PostMapping("/summaries/generate")
    public Result<PerformanceSummary> generateSummary(
            @Parameter(description = "周期名称") @RequestParam String periodName,
            @Parameter(description = "开始日期") @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @Parameter(description = "结束日期") @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        Long userId = UserContext.getCurrentUserId();
        log.info("生成表现总结: userId={}, periodName={}, start={}, end={}", userId, periodName, startDate, endDate);
        try {
            PerformanceSummary data = performanceService.generateSummary(userId, periodName, startDate, endDate);
            log.info("生成表现总结成功: id={}", data.getId());
            return Result.success("总结生成成功", data);
        } catch (Exception e) {
            log.error("生成表现总结失败: userId={}", userId, e);
            throw e;
        }
    }

    @Operation(summary = "更新表现总结")
    @PutMapping("/summaries/{id}")
    public Result<PerformanceSummary> updateSummary(
            @PathVariable Long id,
            @RequestBody SummaryUpdateRequest request) {
        log.info("更新表现总结: id={}", id);
        try {
            PerformanceSummary data = performanceService.updateSummary(id,
                    request.getStudentSummary(),
                    request.getImprovementPlan(),
                    request.getParentComment());
            log.info("更新表现总结成功: id={}", id);
            return Result.success("总结更新成功", data);
        } catch (Exception e) {
            log.error("更新表现总结失败: id={}", id, e);
            throw e;
        }
    }

    /**
     * 总结更新请求体
     */
    @lombok.Data
    public static class SummaryUpdateRequest {
        private String studentSummary;
        private String improvementPlan;
        private String parentComment;
    }
}
