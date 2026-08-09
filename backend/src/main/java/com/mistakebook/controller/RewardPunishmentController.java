package com.mistakebook.controller;

import com.mistakebook.entity.RewardPunishment;
import com.mistakebook.repository.RewardPunishmentRepository;
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
 * 奖惩记录管理控制器
 *
 * 子分类选项：
 * - REWARD: 学习进步, 优秀作业, 课堂表现, 竞赛获奖, 好人好事, 其他奖励
 * - PUNISHMENT: 作业未完成, 课堂违纪, 考试作弊, 行为不当, 其他惩罚
 */
@Slf4j
@Tag(name = "奖惩记录管理", description = "奖惩记录CRUD接口")
@RestController
@RequestMapping("/api/reward-punishment")
public class RewardPunishmentController {

    private final RewardPunishmentRepository rewardPunishmentRepository;

    public RewardPunishmentController(RewardPunishmentRepository rewardPunishmentRepository) {
        this.rewardPunishmentRepository = rewardPunishmentRepository;
    }

    @Operation(summary = "按日期范围获取奖惩记录")
    @GetMapping("/records")
    public Result<List<RewardPunishment>> getRecords(
            @Parameter(description = "开始日期") @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate start,
            @Parameter(description = "结束日期") @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate end) {
        Long userId = UserContext.getCurrentUserId();
        log.info("获取奖惩记录: userId={}, start={}, end={}", userId, start, end);
        List<RewardPunishment> data = rewardPunishmentRepository
                .findByUserIdAndRecordDateBetweenOrderByRecordDateDesc(userId, start, end);
        return Result.success(data);
    }

    @Operation(summary = "添加奖惩记录")
    @PostMapping("/records")
    public Result<RewardPunishment> addRecord(@RequestBody RewardPunishment record) {
        Long userId = UserContext.getCurrentUserId();
        log.info("添加奖惩记录: userId={}, category={}, subCategory={}", userId, record.getCategory(), record.getSubCategory());
        try {
            record.setId(null);
            record.setUserId(userId);
            RewardPunishment data = rewardPunishmentRepository.save(record);
            log.info("添加奖惩记录成功: id={}", data.getId());
            return Result.success("记录添加成功", data);
        } catch (Exception e) {
            log.error("添加奖惩记录失败: userId={}", userId, e);
            throw e;
        }
    }

    @Operation(summary = "更新奖惩记录")
    @PutMapping("/records/{id}")
    public Result<RewardPunishment> updateRecord(
            @PathVariable Long id,
            @RequestBody RewardPunishment record) {
        log.info("更新奖惩记录: id={}", id);
        try {
            RewardPunishment existing = rewardPunishmentRepository.findById(id)
                    .orElseThrow(() -> new RuntimeException("记录不存在: " + id));
            existing.setGrade(record.getGrade());
            existing.setCategory(record.getCategory());
            existing.setSubCategory(record.getSubCategory());
            existing.setDetail(record.getDetail());
            existing.setCompleted(record.getCompleted());
            existing.setRecordDate(record.getRecordDate());
            existing.setRemark(record.getRemark());
            RewardPunishment data = rewardPunishmentRepository.save(existing);
            log.info("更新奖惩记录成功: id={}", id);
            return Result.success("记录更新成功", data);
        } catch (Exception e) {
            log.error("更新奖惩记录失败: id={}", id, e);
            throw e;
        }
    }

    @Operation(summary = "切换奖惩完成状态")
    @PutMapping("/records/{id}/completed")
    public Result<RewardPunishment> toggleCompleted(@PathVariable Long id) {
        log.info("切换完成状态: id={}", id);
        try {
            RewardPunishment existing = rewardPunishmentRepository.findById(id)
                    .orElseThrow(() -> new RuntimeException("记录不存在: " + id));
            existing.setCompleted(!Boolean.TRUE.equals(existing.getCompleted()));
            RewardPunishment data = rewardPunishmentRepository.save(existing);
            log.info("切换完成状态成功: id={}, completed={}", id, data.getCompleted());
            return Result.success("状态更新成功", data);
        } catch (Exception e) {
            log.error("切换完成状态失败: id={}", id, e);
            throw e;
        }
    }

    @Operation(summary = "删除奖惩记录")
    @DeleteMapping("/records/{id}")
    public Result<Void> deleteRecord(@PathVariable Long id) {
        log.info("删除奖惩记录: id={}", id);
        try {
            rewardPunishmentRepository.deleteById(id);
            log.info("删除奖惩记录成功: id={}", id);
            return Result.success("记录删除成功", null);
        } catch (Exception e) {
            log.error("删除奖惩记录失败: id={}", id, e);
            throw e;
        }
    }
}
