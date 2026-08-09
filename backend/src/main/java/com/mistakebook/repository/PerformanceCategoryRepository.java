package com.mistakebook.repository;

import com.mistakebook.entity.PerformanceCategory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PerformanceCategoryRepository extends JpaRepository<PerformanceCategory, Long> {

    List<PerformanceCategory> findByUserIdAndTypeOrderBySortOrder(Long userId, String type);

    List<PerformanceCategory> findByUserIdOrderBySortOrder(Long userId);
}
