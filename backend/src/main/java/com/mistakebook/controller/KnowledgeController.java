package com.mistakebook.controller;

import com.mistakebook.util.RedisService;
import com.mistakebook.util.Result;
import com.mistakebook.util.UserContext;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;
import java.util.concurrent.TimeUnit;

@Slf4j
@Tag(name = "知识疑难点", description = "知识疑难点管理接口")
@RestController
@RequestMapping("/api/knowledge")
@RequiredArgsConstructor
public class KnowledgeController {

    private final RedisService redisService;

    private static final String DOUBT_PREFIX = "knowledge:doubt:";
    private static final long DOUBT_EXPIRE_DAYS = 365; // 保存一年

    /**
     * 生成 Redis key
     */
    private String buildKey(Long userId, String semesterKey, String subjectKey) {
        return DOUBT_PREFIX + userId + ":" + semesterKey + ":" + subjectKey;
    }

    @Operation(summary = "获取疑难点")
    @GetMapping("/doubt")
    public Result<Map<String, Object>> getDoubt(
            @RequestParam String semesterKey,
            @RequestParam String subjectKey) {
        Long userId = UserContext.getCurrentUserId();
        log.info("获取疑难点: userId={}, semester={}, subject={}", userId, semesterKey, subjectKey);

        String key = buildKey(userId, semesterKey, subjectKey);
        Object content = redisService.get(key);

        Map<String, Object> result = new HashMap<>();
        result.put("semesterKey", semesterKey);
        result.put("subjectKey", subjectKey);
        result.put("content", content != null ? content.toString() : "");

        return Result.success(result);
    }

    @Operation(summary = "保存疑难点")
    @PostMapping("/doubt")
    public Result<Map<String, Object>> saveDoubt(@RequestBody SaveDoubtRequest request) {
        Long userId = UserContext.getCurrentUserId();
        log.info("保存疑难点: userId={}, semester={}, subject={}", userId, request.getSemesterKey(), request.getSubjectKey());

        String key = buildKey(userId, request.getSemesterKey(), request.getSubjectKey());
        
        // 保存到 Redis，过期时间 365 天
        redisService.set(key, request.getContent(), DOUBT_EXPIRE_DAYS, TimeUnit.DAYS);

        Map<String, Object> result = new HashMap<>();
        result.put("semesterKey", request.getSemesterKey());
        result.put("subjectKey", request.getSubjectKey());
        result.put("content", request.getContent());

        log.info("疑难点保存成功: key={}", key);
        return Result.success("保存成功", result);
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
