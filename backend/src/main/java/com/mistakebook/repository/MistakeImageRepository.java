package com.mistakebook.repository;

import com.mistakebook.entity.MistakeImage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface MistakeImageRepository extends JpaRepository<MistakeImage, Long> {

    List<MistakeImage> findByMistakeIdOrderBySortOrderAsc(Long mistakeId);

    void deleteByMistakeId(Long mistakeId);
}
