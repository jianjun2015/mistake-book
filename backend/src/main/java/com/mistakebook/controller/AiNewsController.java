package com.mistakebook.controller;

import com.mistakebook.util.Result;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDateTime;
import java.util.*;

@Slf4j
@Tag(name = "AI资讯", description = "AI热点文章和新技术发布")
@RestController
@RequestMapping("/api/ai-news")
@RequiredArgsConstructor
public class AiNewsController {

    @Operation(summary = "获取AI热点文章")
    @GetMapping("/hot")
    public Result<List<Map<String, Object>>> getHotArticles() {
        log.info("获取AI热点文章");
        
        List<Map<String, Object>> articles = new ArrayList<>();
        
        // 模拟最新的AI热点文章数据
        articles.add(createArticle(
            "GPT-5即将发布：OpenAI预告重大突破",
            "OpenAI宣布GPT-5将在未来几个月内发布，预计将带来更强的推理能力和多模态支持。",
            "大语言模型",
            "2024-01-15",
            "https://openai.com"
        ));
        articles.add(createArticle(
            "Google发布Gemini 2.0：性能全面超越GPT-4",
            "Google DeepMind发布Gemini 2.0，在多项基准测试中超越GPT-4，特别是在代码生成和数学推理方面。",
            "大语言模型",
            "2024-01-14",
            "https://gemini.google.com"
        ));
        articles.add(createArticle(
            "Meta开源Llama 4：最强开源模型诞生",
            "Meta发布Llama 4模型，完全开源免费，在多项测试中接近GPT-4水平。",
            "开源模型",
            "2024-01-13",
            "https://llama.meta.com"
        ));
        articles.add(createArticle(
            "Sora正式开放：AI视频生成进入新时代",
            "OpenAI宣布Sora正式向所有用户开放，支持生成最长60秒的高质量视频。",
            "视频生成",
            "2024-01-12",
            "https://openai.com/sora"
        ));
        articles.add(createArticle(
            "Cursor发布2.0版本：AI编程效率再提升",
            "Cursor发布2.0版本，新增多文件编辑、智能重构等功能，编程效率提升50%。",
            "AI编程",
            "2024-01-11",
            "https://cursor.sh"
        ));
        articles.add(createArticle(
            "Claude 4发布：Anthropic最强模型",
            "Anthropic发布Claude 4，在长文本理解和代码生成方面有重大突破。",
            "大语言模型",
            "2024-01-10",
            "https://claude.ai"
        ));
        articles.add(createArticle(
            "Midjourney V7发布：图像质量再升级",
            "Midjourney发布V7版本，图像质量和细节表现大幅提升，支持更复杂的提示词。",
            "图像生成",
            "2024-01-09",
            "https://midjourney.com"
        ));
        articles.add(createArticle(
            "LangChain 3.0发布：Agent开发更简单",
            "LangChain发布3.0版本，简化Agent开发流程，新增可视化编排工具。",
            "AI Agent",
            "2024-01-08",
            "https://langchain.com"
        ));
        
        return Result.success(articles);
    }

    @Operation(summary = "获取新技术发布")
    @GetMapping("/new-tech")
    public Result<List<Map<String, Object>>> getNewTech() {
        log.info("获取AI新技术发布");
        
        List<Map<String, Object>> techList = new ArrayList<>();
        
        techList.add(createTech(
            "GPT-4o Turbo",
            "OpenAI",
            "更快、更便宜的GPT-4o版本，支持128K上下文",
            "2024-01-15"
        ));
        techList.add(createTech(
            "Stable Diffusion XL Turbo",
            "Stability AI",
            "实时图像生成，1秒内生成高质量图片",
            "2024-01-14"
        ));
        techList.add(createTech(
            "Whisper V4",
            "OpenAI",
            "语音识别准确率提升30%，支持100+语言",
            "2024-01-13"
        ));
        techList.add(createTech(
            "DALL-E 4",
            "OpenAI",
            "图像生成质量大幅提升，支持更精确的控制",
            "2024-01-12"
        ));
        techList.add(createTech(
            "CodeLlama 70B",
            "Meta",
            "最强开源代码模型，支持100+编程语言",
            "2024-01-11"
        ));
        techList.add(createTech(
            "Gemini Pro Vision",
            "Google",
            "多模态理解能力大幅提升，支持视频分析",
            "2024-01-10"
        ));
        
        return Result.success(techList);
    }

    private Map<String, Object> createArticle(String title, String summary, String category, String date, String source) {
        Map<String, Object> article = new HashMap<>();
        article.put("id", UUID.randomUUID().toString());
        article.put("title", title);
        article.put("summary", summary);
        article.put("category", category);
        article.put("date", date);
        article.put("source", source);
        article.put("hot", Math.random() > 0.5);
        return article;
    }

    private Map<String, Object> createTech(String name, String company, String description, String date) {
        Map<String, Object> tech = new HashMap<>();
        tech.put("id", UUID.randomUUID().toString());
        tech.put("name", name);
        tech.put("company", company);
        tech.put("description", description);
        tech.put("date", date);
        tech.put("isNew", true);
        return tech;
    }
}
