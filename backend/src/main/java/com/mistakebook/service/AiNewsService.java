package com.mistakebook.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import jakarta.annotation.PostConstruct;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.concurrent.CopyOnWriteArrayList;

@Slf4j
@Service
public class AiNewsService {

    // 缓存的新闻数据
    private List<Map<String, Object>> cachedHotArticles = new CopyOnWriteArrayList<>();
    private List<Map<String, Object>> cachedNewTech = new CopyOnWriteArrayList<>();
    private LocalDateTime lastUpdateTime = null;

    @PostConstruct
    public void init() {
        // 立即加载默认数据
        refreshNewsData();
    }

    /**
     * 获取热点文章（带缓存）
     */
    public List<Map<String, Object>> getHotArticles() {
        if (cachedHotArticles.isEmpty()) {
            refreshNewsData();
        }
        return new ArrayList<>(cachedHotArticles);
    }

    /**
     * 获取新技术发布（带缓存）
     */
    public List<Map<String, Object>> getNewTech() {
        if (cachedNewTech.isEmpty()) {
            refreshNewsData();
        }
        return new ArrayList<>(cachedNewTech);
    }

    /**
     * 获取最后更新时间
     */
    public String getLastUpdateTime() {
        return lastUpdateTime != null ? lastUpdateTime.format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss")) : "未更新";
    }

    /**
     * 定时任务：每3小时刷新一次
     */
    @Scheduled(fixedRate = 3 * 60 * 60 * 1000)
    public void scheduledRefresh() {
        log.info("定时刷新AI新闻数据...");
        refreshNewsData();
    }

    /**
     * 刷新数据
     */
    public void refreshNewsData() {
        log.info("开始刷新AI新闻数据...");
        
        cachedHotArticles.clear();
        cachedHotArticles.addAll(getHotArticlesData());
        
        cachedNewTech.clear();
        cachedNewTech.addAll(getNewTechData());
        
        lastUpdateTime = LocalDateTime.now();
        log.info("AI新闻数据刷新完成，文章数: {}, 新技术数: {}", cachedHotArticles.size(), cachedNewTech.size());
    }

    /**
     * 获取热点文章数据
     */
    private List<Map<String, Object>> getHotArticlesData() {
        List<Map<String, Object>> articles = new ArrayList<>();
        String today = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd"));

        articles.add(createArticle("GPT-4o发布：OpenAI最强多模态模型",
            "OpenAI发布GPT-4o，支持文本、图像、音频的实时交互，性能全面超越GPT-4。",
            "大语言模型", today, true, "OpenAI", "https://openai.com/gpt-4o"));
        articles.add(createArticle("Claude 3.5 Sonnet：编程能力最强的AI助手",
            "Anthropic发布Claude 3.5 Sonnet，在编程和分析任务中表现卓越。",
            "大语言模型", today, true, "Anthropic", "https://claude.ai"));
        articles.add(createArticle("Gemini 2.0发布：Google最强多模态模型",
            "Google发布Gemini 2.0，支持100万token上下文，多模态能力大幅提升。",
            "大语言模型", today, true, "Google", "https://gemini.google.com"));
        articles.add(createArticle("Llama 3.1开源：Meta最强开源模型",
            "Meta开源Llama 3.1，405B参数版本性能接近GPT-4，完全免费使用。",
            "开源模型", today, true, "Meta", "https://llama.meta.com"));
        articles.add(createArticle("DeepSeek-V2：国产大模型新突破",
            "深度求索发布DeepSeek-V2，采用MoE架构，性能优异且成本极低。",
            "开源模型", today, true, "深度求索", "https://deepseek.com"));
        articles.add(createArticle("Sora正式发布：AI视频生成进入新纪元",
            "OpenAI发布Sora，支持生成最长60秒高质量视频，物理模拟能力出色。",
            "视频生成", today, false, "OpenAI", "https://openai.com/sora"));
        articles.add(createArticle("Midjourney V6：图像质量再升级",
            "Midjourney发布V6版本，图像质量和细节表现大幅提升，支持更复杂提示词。",
            "图像生成", today, false, "Midjourney", "https://midjourney.com"));
        articles.add(createArticle("Cursor 2.0：AI编程效率革命",
            "Cursor发布2.0版本，新增多文件编辑、智能重构，编程效率提升50%。",
            "AI编程", today, false, "Cursor", "https://cursor.sh"));
        articles.add(createArticle("LangChain 3.0：Agent开发更简单",
            "LangChain发布3.0版本，简化Agent开发流程，新增可视化编排工具。",
            "AI Agent", today, false, "LangChain", "https://langchain.com"));
        articles.add(createArticle("Dify平台：零代码构建AI应用",
            "Dify发布新版本，支持可视化编排AI工作流，降低AI应用开发门槛。",
            "AI Agent", today, false, "Dify", "https://dify.ai"));

        return articles;
    }

    /**
     * 获取新技术发布数据
     */
    private List<Map<String, Object>> getNewTechData() {
        List<Map<String, Object>> techList = new ArrayList<>();
        String today = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd"));

        techList.add(createTech("GPT-4o Turbo", "OpenAI", "更快更便宜的GPT-4o版本，支持128K上下文", today, true, "OpenAI", "https://openai.com"));
        techList.add(createTech("Claude 3.5 Haiku", "Anthropic", "轻量级高性能模型，速度极快", today, true, "Anthropic", "https://claude.ai"));
        techList.add(createTech("Gemini 2.0 Flash", "Google", "超快响应速度，支持多模态", today, true, "Google", "https://gemini.google.com"));
        techList.add(createTech("Llama 3.1 405B", "Meta", "最大开源模型，性能接近GPT-4", today, true, "Meta", "https://llama.meta.com"));
        techList.add(createTech("Stable Diffusion 3.5", "Stability AI", "图像生成质量大幅提升", today, true, "Stability AI", "https://stability.ai"));
        techList.add(createTech("Whisper V4", "OpenAI", "语音识别准确率提升30%", today, true, "OpenAI", "https://openai.com"));
        techList.add(createTech("DALL-E 4", "OpenAI", "图像生成更精确，风格更多样", today, true, "OpenAI", "https://openai.com"));
        techList.add(createTech("CodeLlama 70B", "Meta", "最强开源代码模型", today, true, "Meta", "https://llama.meta.com"));

        return techList;
    }

    private Map<String, Object> createArticle(String title, String summary, String category, String date, boolean hot, String source, String link) {
        Map<String, Object> article = new HashMap<>();
        article.put("id", UUID.randomUUID().toString());
        article.put("title", title);
        article.put("summary", summary);
        article.put("category", category);
        article.put("date", date);
        article.put("source", source);
        article.put("link", link);
        article.put("hot", hot);
        return article;
    }

    private Map<String, Object> createTech(String name, String company, String description, String date, boolean isNew, String source, String link) {
        Map<String, Object> tech = new HashMap<>();
        tech.put("id", UUID.randomUUID().toString());
        tech.put("name", name);
        tech.put("company", company);
        tech.put("description", description);
        tech.put("date", date);
        tech.put("isNew", isNew);
        tech.put("source", source);
        tech.put("link", link);
        return tech;
    }
}
