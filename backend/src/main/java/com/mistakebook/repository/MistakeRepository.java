package com.mistakebook.repository;

import com.mistakebook.entity.Mistake;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface MistakeRepository extends JpaRepository<Mistake, Long> {

    Page<Mistake> findByUserIdOrderByCreateTimeDesc(Long userId, Pageable pageable);

    Page<Mistake> findByUserIdAndSubjectOrderByCreateTimeDesc(Long userId, String subject, Pageable pageable);

    @Query("SELECT m FROM Mistake m WHERE m.userId = :userId AND " +
           "(m.content LIKE %:keyword% OR m.title LIKE %:keyword%)")
    Page<Mistake> searchByKeyword(@Param("userId") Long userId,
                                  @Param("keyword") String keyword,
                                  Pageable pageable);

    @Query("SELECT DISTINCT m.subject FROM Mistake m WHERE m.userId = :userId")
    List<String> findSubjectsByUserId(@Param("userId") Long userId);
}
