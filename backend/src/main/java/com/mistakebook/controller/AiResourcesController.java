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
import java.time.format.DateTimeFormatter;
import java.util.*;

@Slf4j
@Tag(name = "AI资源", description = "AI Skills和Plugins")
@RestController
@RequestMapping("/api/ai-resources")
@RequiredArgsConstructor
public class AiResourcesController {

    @Operation(summary = "获取 Top50 Skills")
    @GetMapping("/skills")
    public Result<List<Map<String, Object>>> getTopSkills() {
        log.info("获取 Top50 Skills");
        List<Map<String, Object>> skills = new ArrayList<>();

        // AI Skills 数据
        skills.add(createSkill("Code Interpreter", "OpenAI", "代码执行和数据分析", "rising", 4.9, 50000, "OpenAI", "https://platform.openai.com"));
        skills.add(createSkill("Web Browsing", "OpenAI", "网页浏览和信息检索", "rising", 4.8, 45000, "OpenAI", "https://platform.openai.com"));
        skills.add(createSkill("DALL-E", "OpenAI", "AI图像生成", "popular", 4.7, 40000, "OpenAI", "https://openai.com/dall-e"));
        skills.add(createSkill("Advanced Data Analysis", "OpenAI", "高级数据分析", "rising", 4.8, 38000, "OpenAI", "https://platform.openai.com"));
        skills.add(createSkill("Document Parser", "Community", "文档解析和提取", "popular", 4.6, 35000, "Community", "https://github.com"));
        skills.add(createSkill("Code Review", "Community", "代码审查和优化", "rising", 4.7, 32000, "Community", "https://github.com"));
        skills.add(createSkill("Math Solver", "Community", "数学问题求解", "popular", 4.5, 30000, "Community", "https://github.com"));
        skills.add(createSkill("Text Summarizer", "Community", "文本摘要生成", "popular", 4.4, 28000, "Community", "https://github.com"));
        skills.add(createSkill("Image Generator", "Stability AI", "图像生成", "rising", 4.6, 26000, "Stability AI", "https://stability.ai"));
        skills.add(createSkill("Video Generator", "Runway", "视频生成", "rising", 4.5, 24000, "Runway", "https://runwayml.com"));
        skills.add(createSkill("Voice Clone", "ElevenLabs", "语音克隆", "rising", 4.4, 22000, "ElevenLabs", "https://elevenlabs.io"));
        skills.add(createSkill("PDF Reader", "Community", "PDF文档读取", "popular", 4.3, 20000, "Community", "https://github.com"));
        skills.add(createSkill("Excel Processor", "Community", "Excel处理", "popular", 4.2, 18000, "Community", "https://github.com"));
        skills.add(createSkill("Web Scraper", "Community", "网页数据抓取", "popular", 4.3, 16000, "Community", "https://github.com"));
        skills.add(createSkill("API Caller", "Community", "API调用工具", "popular", 4.1, 15000, "Community", "https://github.com"));
        skills.add(createSkill("Database Query", "Community", "数据库查询", "popular", 4.2, 14000, "Community", "https://github.com"));
        skills.add(createSkill("Email Sender", "Community", "邮件发送", "popular", 4.0, 13000, "Community", "https://github.com"));
        skills.add(createSkill("File Manager", "Community", "文件管理", "popular", 4.1, 12000, "Community", "https://github.com"));
        skills.add(createSkill("Calendar Manager", "Community", "日程管理", "rising", 4.2, 11000, "Community", "https://github.com"));
        skills.add(createSkill("Translation", "Community", "多语言翻译", "popular", 4.3, 10000, "Community", "https://github.com"));
        skills.add(createSkill("Chart Generator", "Community", "图表生成", "popular", 4.2, 9500, "Community", "https://github.com"));
        skills.add(createSkill("Markdown Editor", "Community", "Markdown编辑", "popular", 4.1, 9000, "Community", "https://github.com"));
        skills.add(createSkill("JSON Formatter", "Community", "JSON格式化", "popular", 4.0, 8500, "Community", "https://github.com"));
        skills.add(createSkill("Regex Helper", "Community", "正则表达式助手", "popular", 4.1, 8000, "Community", "https://github.com"));
        skills.add(createSkill("Color Picker", "Community", "颜色选择器", "popular", 3.9, 7500, "Community", "https://github.com"));
        skills.add(createSkill("Unit Converter", "Community", "单位换算", "popular", 4.0, 7000, "Community", "https://github.com"));
        skills.add(createSkill("QR Generator", "Community", "二维码生成", "popular", 3.9, 6500, "Community", "https://github.com"));
        skills.add(createSkill("Password Generator", "Community", "密码生成器", "popular", 4.0, 6000, "Community", "https://github.com"));
        skills.add(createSkill("Base64 Encoder", "Community", "Base64编解码", "popular", 3.8, 5500, "Community", "https://github.com"));
        skills.add(createSkill("Hash Calculator", "Community", "哈希计算器", "popular", 3.9, 5000, "Community", "https://github.com"));

        return Result.success(skills);
    }

    @Operation(summary = "获取 DSH 插件")
    @GetMapping("/plugins")
    public Result<List<Map<String, Object>>> getPlugins() {
        log.info("获取 DSH 插件");
        List<Map<String, Object>> plugins = new ArrayList<>();

        // DeepSeek Harness 插件数据
        plugins.add(createPlugin("DeepSeek Chat", "DeepSeek", "智能对话与问答", "popular", 4.9, 50000, "DeepSeek", "https://chat.deepseek.com"));
        plugins.add(createPlugin("DeepSeek Coder", "DeepSeek", "代码生成与补全", "popular", 4.8, 45000, "DeepSeek", "https://coder.deepseek.com"));
        plugins.add(createPlugin("DeepSeek Math", "DeepSeek", "数学推理与计算", "rising", 4.7, 35000, "DeepSeek", "https://deepseek.com"));
        plugins.add(createPlugin("RAG Pipeline", "DeepSeek", "检索增强生成流水线", "popular", 4.6, 30000, "DeepSeek", "https://github.com/deepseek-ai"));
        plugins.add(createPlugin("Vector Store", "DeepSeek", "向量数据库集成", "rising", 4.5, 28000, "DeepSeek", "https://github.com/deepseek-ai"));
        plugins.add(createPlugin("Prompt Engineer", "DeepSeek", "提示词工程工具", "popular", 4.5, 25000, "DeepSeek", "https://deepseek.com"));
        plugins.add(createPlugin("Model Fine-tune", "DeepSeek", "模型微调工具", "rising", 4.4, 22000, "DeepSeek", "https://platform.deepseek.com"));
        plugins.add(createPlugin("Agent Builder", "DeepSeek", "AI Agent构建器", "popular", 4.4, 20000, "DeepSeek", "https://github.com/deepseek-ai"));
        plugins.add(createPlugin("Data Processor", "DeepSeek", "数据预处理工具", "popular", 4.3, 18000, "DeepSeek", "https://github.com/deepseek-ai"));
        plugins.add(createPlugin("Model Evaluator", "DeepSeek", "模型评估工具", "rising", 4.3, 16000, "DeepSeek", "https://platform.deepseek.com"));
        plugins.add(createPlugin("API Gateway", "DeepSeek", "API网关与负载均衡", "popular", 4.2, 15000, "DeepSeek", "https://platform.deepseek.com"));
        plugins.add(createPlugin("Cache Manager", "DeepSeek", "模型缓存管理", "popular", 4.2, 14000, "DeepSeek", "https://github.com/deepseek-ai"));
        plugins.add(createPlugin("Batch Processor", "DeepSeek", "批量推理处理", "rising", 4.1, 12000, "DeepSeek", "https://platform.deepseek.com"));
        plugins.add(createPlugin("Stream Handler", "DeepSeek", "流式响应处理", "popular", 4.1, 11000, "DeepSeek", "https://github.com/deepseek-ai"));
        plugins.add(createPlugin("Token Counter", "DeepSeek", "Token计数器", "popular", 4.0, 10000, "DeepSeek", "https://github.com/deepseek-ai"));
        plugins.add(createPlugin("Cost Calculator", "DeepSeek", "API调用成本计算", "popular", 4.0, 9500, "DeepSeek", "https://platform.deepseek.com"));
        plugins.add(createPlugin("Log Analyzer", "DeepSeek", "调用日志分析", "rising", 3.9, 9000, "DeepSeek", "https://platform.deepseek.com"));
        plugins.add(createPlugin("Rate Limiter", "DeepSeek", "请求限流工具", "popular", 3.9, 8500, "DeepSeek", "https://github.com/deepseek-ai"));
        plugins.add(createPlugin("Error Handler", "DeepSeek", "错误处理与重试", "popular", 3.8, 8000, "DeepSeek", "https://github.com/deepseek-ai"));
        plugins.add(createPlugin("Monitor Dashboard", "DeepSeek", "监控与告警面板", "rising", 3.8, 7500, "DeepSeek", "https://platform.deepseek.com"));

        return Result.success(plugins);
    }

    private Map<String, Object> createSkill(String name, String company, String description, String trend, double rating, int usage, String source, String link) {
        Map<String, Object> skill = new HashMap<>();
        skill.put("id", UUID.randomUUID().toString());
        skill.put("name", name);
        skill.put("company", company);
        skill.put("description", description);
        skill.put("trend", trend);
        skill.put("rating", rating);
        skill.put("usage", usage);
        skill.put("date", LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd")));
        skill.put("source", source);
        skill.put("link", link);
        return skill;
    }

    private Map<String, Object> createPlugin(String name, String company, String description, String trend, double rating, int usage, String source, String link) {
        Map<String, Object> plugin = new HashMap<>();
        plugin.put("id", UUID.randomUUID().toString());
        plugin.put("name", name);
        plugin.put("company", company);
        plugin.put("description", description);
        plugin.put("trend", trend);
        plugin.put("rating", rating);
        plugin.put("usage", usage);
        plugin.put("date", LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd")));
        plugin.put("source", source);
        plugin.put("link", link);
        return plugin;
    }
}
