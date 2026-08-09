package com.mistakebook.repository;

import com.mistakebook.entity.PerformanceSummary;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PerformanceSummaryRepository extends JpaRepository<PerformanceSummary, Long> {

    List<PerformanceSummary> findByUserIdOrderByStartDateDesc(Long userId);
}
