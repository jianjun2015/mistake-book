package com.mistakebook.repository;

import com.mistakebook.entity.PerformanceRecord;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface PerformanceRecordRepository extends JpaRepository<PerformanceRecord, Long> {

    List<PerformanceRecord> findByUserIdAndType(Long userId, String type);

    List<PerformanceRecord> findByUserIdAndRecordDateBetween(Long userId, LocalDate startDate, LocalDate endDate);

    List<PerformanceRecord> findByUserIdAndCategoryIdAndRecordDateBetween(Long userId, Long categoryId, LocalDate startDate, LocalDate endDate);

    List<PerformanceRecord> findByUserIdAndTypeAndRecordDateBetween(Long userId, String type, LocalDate startDate, LocalDate endDate);
}
