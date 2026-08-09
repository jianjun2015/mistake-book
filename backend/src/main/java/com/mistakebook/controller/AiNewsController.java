package com.mistakebook.controller;

import com.mistakebook.service.AiNewsService;
import com.mistakebook.util.Result;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.*;

@Slf4j
@Tag(name = "AI资讯", description = "AI热点文章和新技术发布")
@RestController
@RequestMapping("/api/ai-news")
@RequiredArgsConstructor
public class AiNewsController {

    private final AiNewsService aiNewsService;

    @Operation(summary = "获取AI热点文章")
    @GetMapping("/hot")
    public Result<List<Map<String, Object>>> getHotArticles() {
        log.info("获取AI热点文章");
        List<Map<String, Object>> articles = aiNewsService.getHotArticles();
        return Result.success(articles);
    }

    @Operation(summary = "获取新技术发布")
    @GetMapping("/new-tech")
    public Result<List<Map<String, Object>>> getNewTech() {
        log.info("获取AI新技术发布");
        List<Map<String, Object>> techList = aiNewsService.getNewTech();
        return Result.success(techList);
    }

    @Operation(summary = "获取更新状态")
    @GetMapping("/status")
    public Result<Map<String, Object>> getUpdateStatus() {
        Map<String, Object> status = new HashMap<>();
        status.put("lastUpdate", aiNewsService.getLastUpdateTime());
        status.put("articleCount", aiNewsService.getHotArticles().size());
        status.put("techCount", aiNewsService.getNewTech().size());
        return Result.success(status);
    }

    @Operation(summary = "手动刷新新闻数据")
    @PostMapping("/refresh")
    public Result<String> refreshNews() {
        log.info("手动触发新闻数据刷新");
        aiNewsService.refreshNewsData();
        return Result.success("刷新成功，更新时间: " + aiNewsService.getLastUpdateTime());
    }
}
