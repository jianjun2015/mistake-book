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
        skills.add(createSkill("Code Interpreter", "OpenAI", "代码执行和数据分析", "rising", 4.9, 50000));
        skills.add(createSkill("Web Browsing", "OpenAI", "网页浏览和信息检索", "rising", 4.8, 45000));
        skills.add(createSkill("DALL-E", "OpenAI", "AI图像生成", "popular", 4.7, 40000));
        skills.add(createSkill("Advanced Data Analysis", "OpenAI", "高级数据分析", "rising", 4.8, 38000));
        skills.add(createSkill("Document Parser", "Community", "文档解析和提取", "popular", 4.6, 35000));
        skills.add(createSkill("Code Review", "Community", "代码审查和优化", "rising", 4.7, 32000));
        skills.add(createSkill("Math Solver", "Community", "数学问题求解", "popular", 4.5, 30000));
        skills.add(createSkill("Text Summarizer", "Community", "文本摘要生成", "popular", 4.4, 28000));
        skills.add(createSkill("Image Generator", "Stability AI", "图像生成", "rising", 4.6, 26000));
        skills.add(createSkill("Video Generator", "Runway", "视频生成", "rising", 4.5, 24000));
        skills.add(createSkill("Voice Clone", "ElevenLabs", "语音克隆", "rising", 4.4, 22000));
        skills.add(createSkill("PDF Reader", "Community", "PDF文档读取", "popular", 4.3, 20000));
        skills.add(createSkill("Excel Processor", "Community", "Excel处理", "popular", 4.2, 18000));
        skills.add(createSkill("Web Scraper", "Community", "网页数据抓取", "popular", 4.3, 16000));
        skills.add(createSkill("API Caller", "Community", "API调用工具", "popular", 4.1, 15000));
        skills.add(createSkill("Database Query", "Community", "数据库查询", "popular", 4.2, 14000));
        skills.add(createSkill("Email Sender", "Community", "邮件发送", "popular", 4.0, 13000));
        skills.add(createSkill("File Manager", "Community", "文件管理", "popular", 4.1, 12000));
        skills.add(createSkill("Calendar Manager", "Community", "日程管理", "rising", 4.2, 11000));
        skills.add(createSkill("Translation", "Community", "多语言翻译", "popular", 4.3, 10000));
        skills.add(createSkill("Chart Generator", "Community", "图表生成", "popular", 4.2, 9500));
        skills.add(createSkill("Markdown Editor", "Community", "Markdown编辑", "popular", 4.1, 9000));
        skills.add(createSkill("JSON Formatter", "Community", "JSON格式化", "popular", 4.0, 8500));
        skills.add(createSkill("Regex Helper", "Community", "正则表达式助手", "popular", 4.1, 8000));
        skills.add(createSkill("Color Picker", "Community", "颜色选择器", "popular", 3.9, 7500));
        skills.add(createSkill("Unit Converter", "Community", "单位换算", "popular", 4.0, 7000));
        skills.add(createSkill("QR Generator", "Community", "二维码生成", "popular", 3.9, 6500 });
        skills.add(createSkill("Password Generator", "Community", "密码生成器", "popular", 4.0, 6000));
        skills.add(createSkill("Base64 Encoder", "Community", "Base64编解码", "popular", 3.8, 5500));
        skills.add(createSkill("Hash Calculator", "Community", "哈希计算器", "popular", 3.9, 5000));

        return Result.success(skills);
    }

    @Operation(summary = "获取 DSH 插件")
    @GetMapping("/plugins")
    public Result<List<Map<String, Object>>> getPlugins() {
        log.info("获取 DSH 插件");
        List<Map<String, Object>> plugins = new ArrayList<>();

        // DSH Plugins 数据
        plugins.add(createPlugin("Git Integration", "DSH", "Git版本控制集成", "popular", 4.8, 30000));
        plugins.add(createPlugin("Docker Manager", "DSH", "Docker容器管理", "popular", 4.7, 28000));
        plugins.add(createPlugin("K8s Dashboard", "DSH", "Kubernetes管理", "rising", 4.6, 25000));
        plugins.add(createPlugin("Database Client", "DSH", "数据库客户端", "popular", 4.5, 22000));
        plugins.add(createPlugin("Redis Manager", "DSH", "Redis管理工具", "popular", 4.4, 20000));
        plugins.add(createPlugin("API Tester", "DSH", "API测试工具", "popular", 4.5, 18000));
        plugins.add(createPlugin("SSH Terminal", "DSH", "SSH终端", "popular", 4.3, 16000));
        plugins.add(createPlugin("File Explorer", "DSH", "文件浏览器", "popular", 4.2, 15000));
        plugins.add(createPlugin("Log Viewer", "DSH", "日志查看器", "popular", 4.3, 14000));
        plugins.add(createPlugin("Cron Manager", "DSH", "定时任务管理", "popular", 4.1, 13000));
        plugins.add(createPlugin("Nginx Config", "DSH", "Nginx配置管理", "popular", 4.2, 12000));
        plugins.add(createPlugin("SSL Manager", "DSH", "SSL证书管理", "popular", 4.0, 11000));
        plugins.add(createPlugin("Backup Tool", "DSH", "备份工具", "popular", 4.1, 10000));
        plugins.add(createPlugin("Monitor Dashboard", "DSH", "监控面板", "rising", 4.3, 9500));
        plugins.add(createPlugin("Performance Analyzer", "DSH", "性能分析", "rising", 4.2, 9000));
        plugins.add(createPlugin("Code Snippets", "DSH", "代码片段管理", "popular", 4.0, 8500));
        plugins.add(createPlugin("Environment Manager", "DSH", "环境变量管理", "popular", 3.9, 8000));
        plugins.add(createPlugin("Port Manager", "DSH", "端口管理", "popular", 3.8, 7500));
        plugins.add(createPlugin("Process Manager", "DSH", "进程管理", "popular", 4.0, 7000));
        plugins.add(createPlugin("System Info", "DSH", "系统信息", "popular", 3.9, 6500));

        return Result.success(plugins);
    }

    private Map<String, Object> createSkill(String name, String company, String description, String trend, double rating, int usage) {
        Map<String, Object> skill = new HashMap<>();
        skill.put("id", UUID.randomUUID().toString());
        skill.put("name", name);
        skill.put("company", company);
        skill.put("description", description);
        skill.put("trend", trend);
        skill.put("rating", rating);
        skill.put("usage", usage);
        skill.put("date", LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd")));
        return skill;
    }

    private Map<String, Object> createPlugin(String name, String company, String description, String trend, double rating, int usage) {
        Map<String, Object> plugin = new HashMap<>();
        plugin.put("id", UUID.randomUUID().toString());
        plugin.put("name", name);
        plugin.put("company", company);
        plugin.put("description", description);
        plugin.put("trend", trend);
        plugin.put("rating", rating);
        plugin.put("usage", usage);
        plugin.put("date", LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd")));
        return plugin;
    }
}
