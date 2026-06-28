package com.mistakebook.repository;

import com.mistakebook.entity.KnowledgeDoubt;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface KnowledgeDoubtRepository extends JpaRepository<KnowledgeDoubt, Long> {

    Optional<KnowledgeDoubt> findByUserIdAndSemesterKeyAndSubjectKey(Long userId, String semesterKey, String subjectKey);
}
