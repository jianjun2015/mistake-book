package com.mistakebook.controller;

import com.mistakebook.dto.MistakeRequest;
import com.mistakebook.dto.MistakeResponse;
import com.mistakebook.service.MistakeService;
import com.mistakebook.util.Result;
import com.mistakebook.util.UserContext;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * 错题管理控制器
 */
@Slf4j
@Tag(name = "错题管理", description = "错题CRUD、搜索、状态管理接口")
@RestController
@RequestMapping("/api/mistakes")
public class MistakeController {

    private final MistakeService mistakeService;

    public MistakeController(MistakeService mistakeService) {
        this.mistakeService = mistakeService;
    }

    @Operation(summary = "创建错题")
    @PostMapping
    public Result<MistakeResponse> create(@RequestBody MistakeRequest request) {
        Long userId = UserContext.getCurrentUserId();
        log.info("创建错题请求: userId={}, title={}, subject={}, images={}", 
                userId, request.getTitle(), request.getSubject(), 
                request.getImages() != null ? request.getImages().size() : 0);
        try {
            MistakeResponse data = mistakeService.create(userId, request);
            log.info("创建错题成功: id={}, title={}", data.getId(), data.getTitle());
            return Result.success("错题创建成功", data);
        } catch (Exception e) {
            log.error("创建错题失败: userId={}, title={}", userId, request.getTitle(), e);
            throw e;
        }
    }

    @Operation(summary = "获取错题详情")
    @GetMapping("/{id}")
    public Result<MistakeResponse> getById(@PathVariable Long id) {
        log.info("获取错题详情: id={}", id);
        MistakeResponse data = mistakeService.getById(id);
        log.debug("错题详情: id={}, title={}, images={}", id, data.getTitle(), data.getImages().size());
        return Result.success(data);
    }

    @Operation(summary = "分页获取错题列表")
    @GetMapping
    public Result<Page<MistakeResponse>> getList(
            @Parameter(description = "页码，从1开始") @RequestParam(defaultValue = "1") int page,
            @Parameter(description = "每页条数") @RequestParam(defaultValue = "10") int size) {
        Long userId = UserContext.getCurrentUserId();
        log.info("获取错题列表: userId={}, page={}, size={}", userId, page, size);
        Pageable pageable = PageRequest.of(page - 1, size, Sort.by(Sort.Direction.DESC, "createTime"));
        Page<MistakeResponse> data = mistakeService.getList(userId, pageable);
        log.info("错题列表返回: total={}, currentPage={}", data.getTotalElements(), data.getNumber() + 1);
        return Result.success(data);
    }

    @Operation(summary = "按学科筛选")
    @GetMapping("/subject/{subject}")
    public Result<Page<MistakeResponse>> getBySubject(
            @PathVariable String subject,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "10") int size) {
        Long userId = UserContext.getCurrentUserId();
        log.info("按学科筛选: userId={}, subject={}, page={}, size={}", userId, subject, page, size);
        Pageable pageable = PageRequest.of(page - 1, size, Sort.by(Sort.Direction.DESC, "createTime"));
        Page<MistakeResponse> data = mistakeService.getBySubject(userId, subject, pageable);
        log.info("学科筛选结果: subject={}, total={}", subject, data.getTotalElements());
        return Result.success(data);
    }

    @Operation(summary = "搜索错题")
    @GetMapping("/search")
    public Result<Page<MistakeResponse>> search(
            @RequestParam String keyword,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "10") int size) {
        Long userId = UserContext.getCurrentUserId();
        log.info("搜索错题: userId={}, keyword={}, page={}, size={}", userId, keyword, page, size);
        Pageable pageable = PageRequest.of(page - 1, size, Sort.by(Sort.Direction.DESC, "createTime"));
        Page<MistakeResponse> data = mistakeService.search(userId, keyword, pageable);
        log.info("搜索结果: keyword={}, total={}", keyword, data.getTotalElements());
        return Result.success(data);
    }

    @Operation(summary = "更新错题")
    @PutMapping("/{id}")
    public Result<MistakeResponse> update(
            @PathVariable Long id,
            @RequestBody MistakeRequest request) {
        log.info("更新错题: id={}, title={}", id, request.getTitle());
        try {
            MistakeResponse data = mistakeService.update(id, request);
            log.info("更新错题成功: id={}", id);
            return Result.success("错题更新成功", data);
        } catch (Exception e) {
            log.error("更新错题失败: id={}", id, e);
            throw e;
        }
    }

    @Operation(summary = "删除错题")
    @DeleteMapping("/{id}")
    public Result<Void> delete(@PathVariable Long id) {
        log.info("删除错题: id={}", id);
        try {
            mistakeService.delete(id);
            log.info("删除错题成功: id={}", id);
            return Result.success("错题删除成功", null);
        } catch (Exception e) {
            log.error("删除错题失败: id={}", id, e);
            throw e;
        }
    }

    @Operation(summary = "更新掌握状态")
    @PutMapping("/{id}/status")
    public Result<MistakeResponse> updateStatus(
            @PathVariable Long id,
            @RequestParam Integer status) {
        log.info("更新掌握状态: id={}, status={}", id, status);
        try {
            MistakeResponse data = mistakeService.updateStatus(id, status);
            log.info("更新状态成功: id={}, newStatus={}", id, status);
            return Result.success("状态更新成功", data);
        } catch (Exception e) {
            log.error("更新状态失败: id={}, status={}", id, status, e);
            throw e;
        }
    }

    @Operation(summary = "获取学科列表")
    @GetMapping("/subjects")
    public Result<List<String>> getSubjects() {
        Long userId = UserContext.getCurrentUserId();
        log.info("获取学科列表: userId={}", userId);
        List<String> data = mistakeService.getSubjects(userId);
        log.info("学科列表: count={}", data.size());
        return Result.success(data);
    }
}
