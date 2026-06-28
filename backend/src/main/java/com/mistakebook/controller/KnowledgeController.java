package com.mistakebook.controller;

import com.mistakebook.entity.KnowledgeDoubt;
import com.mistakebook.repository.KnowledgeDoubtRepository;
import com.mistakebook.util.Result;
import com.mistakebook.util.UserContext;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.*;

import java.util.Optional;

@Slf4j
@Tag(name = "知识疑难点", description = "知识疑难点管理接口")
@RestController
@RequestMapping("/api/knowledge")
@RequiredArgsConstructor
public class KnowledgeController {

    private final KnowledgeDoubtRepository knowledgeDoubtRepository;

    @Operation(summary = "获取疑难点")
    @GetMapping("/doubt")
    public Result<KnowledgeDoubt> getDoubt(
            @RequestParam String semesterKey,
            @RequestParam String subjectKey) {
        Long userId = UserContext.getCurrentUserId();
        log.info("获取疑难点: userId={}, semester={}, subject={}", userId, semesterKey, subjectKey);

        Optional<KnowledgeDoubt> doubt = knowledgeDoubtRepository
                .findByUserIdAndSemesterKeyAndSubjectKey(userId, semesterKey, subjectKey);

        if (doubt.isPresent()) {
            return Result.success(doubt.get());
        } else {
            // 返回空对象
            KnowledgeDoubt empty = new KnowledgeDoubt();
            empty.setUserId(userId);
            empty.setSemesterKey(semesterKey);
            empty.setSubjectKey(subjectKey);
            empty.setContent("");
            return Result.success(empty);
        }
    }

    @Operation(summary = "保存疑难点")
    @PostMapping("/doubt")
    public Result<KnowledgeDoubt> saveDoubt(@RequestBody SaveDoubtRequest request) {
        Long userId = UserContext.getCurrentUserId();
        log.info("保存疑难点: userId={}, semester={}, subject={}", userId, request.getSemesterKey(), request.getSubjectKey());

        Optional<KnowledgeDoubt> existing = knowledgeDoubtRepository
                .findByUserIdAndSemesterKeyAndSubjectKey(userId, request.getSemesterKey(), request.getSubjectKey());

        KnowledgeDoubt doubt;
        if (existing.isPresent()) {
            doubt = existing.get();
            doubt.setContent(request.getContent());
        } else {
            doubt = new KnowledgeDoubt();
            doubt.setUserId(userId);
            doubt.setSemesterKey(request.getSemesterKey());
            doubt.setSubjectKey(request.getSubjectKey());
            doubt.setContent(request.getContent());
        }

        KnowledgeDoubt saved = knowledgeDoubtRepository.save(doubt);
        log.info("疑难点保存成功: id={}", saved.getId());
        return Result.success("保存成功", saved);
    }

    /**
     * 保存疑难点请求
     */
    @lombok.Data
    public static class SaveDoubtRequest {
        private String semesterKey;
        private String subjectKey;
        private String content;
    }
}
