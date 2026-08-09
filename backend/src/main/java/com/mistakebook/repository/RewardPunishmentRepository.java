package com.mistakebook.repository;

import com.mistakebook.entity.RewardPunishment;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;

/**
 * 奖惩记录数据访问层
 */
public interface RewardPunishmentRepository extends JpaRepository<RewardPunishment, Long> {

    /**
     * 按用户和日期范围查询记录（按日期倒序）
     */
    List<RewardPunishment> findByUserIdAndRecordDateBetweenOrderByRecordDateDesc(Long userId, LocalDate start, LocalDate end);

    /**
     * 按用户和分类查询记录
     */
    List<RewardPunishment> findByUserIdAndCategory(Long userId, String category);
}
