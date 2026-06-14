package com.mistakebook.repository;

import com.mistakebook.entity.StudyLog;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface StudyLogRepository extends MongoRepository<StudyLog, String> {

    List<StudyLog> findByUserIdOrderByCreateTimeDesc(Long userId);
}
