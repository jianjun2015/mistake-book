package com.mistakebook.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import jakarta.annotation.PostConstruct;
import org.springframework.http.*;
import org.springframework.http.client.SimpleClientHttpRequestFactory;

import javax.xml.parsers.DocumentBuilderFactory;
import org.w3c.dom.*;
import java.io.StringReader;
import java.net.InetSocketAddress;
import java.net.Proxy;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.concurrent.CopyOnWriteArrayList;
import org.xml.sax.InputSource;
import org.springframework.web.client.RestTemplate;

@Slf4j
@Service
public class AiNewsService {

    private final RestTemplate restTemplate;

    // 缓存的新闻数据
    private List<Map<String, Object>> cachedHotArticles = new CopyOnWriteArrayList<>();
    private List<Map<String, Object>> cachedNewTech = new CopyOnWriteArrayList<>();
    private LocalDateTime lastUpdateTime = null;

    // 是否使用代理（根据环境配置）
    private static final boolean USE_PROXY = false;
    private static final String PROXY_HOST = "127.0.0.1";
    private static final int PROXY_PORT = 7890;

    // RSS源列表（AI相关）- 使用 Bing News RSS 作为替代
    private static final String[] AI_NEWS_RSS = {
        "https://www.bing.com/news/search?q=AI+artificial+intelligence&qft=sortbydate%3d%221%22&form=YFNR",
        "https://www.bing.com/news/search?q=ChatGPT+GPT+Claude+Gemini&qft=sortbydate%3d%221%22&form=YFNR",
        "https://www.bing.com/news/search?q=LLM+large+language+model&qft=sortbydate%3d%221%22&form=YFNR"
    };

    // 技术发布相关RSS
    private static final String[] TECH_RELEASE_RSS = {
        "https://www.bing.com/news/search?q=AI+launch+release+new+model&qft=sortbydate%3d%221%22&form=YFNR",
        "https://www.bing.com/news/search?q=OpenAI+Google+DeepMind+Meta+AI&qft=sortbydate%3d%221%22&form=YFNR"
    };

    public AiNewsService() {
        // 配置 RestTemplate 超时
        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(5000);  // 5秒连接超时
        factory.setReadTimeout(10000);    // 10秒读取超时

        // 如果需要代理
        if (USE_PROXY) {
            Proxy proxy = new Proxy(Proxy.Type.HTTP, new InetSocketAddress(PROXY_HOST, PROXY_PORT));
            factory.setProxy(proxy);
        }

        this.restTemplate = new RestTemplate(factory);
    }

    @PostConstruct
    public void init() {
        // 异步初始化，不阻塞启动
        new Thread(() -> {
            try {
                Thread.sleep(3000); // 延迟3秒，等待服务完全启动
                refreshNewsData();
            } catch (Exception e) {
                log.error("初始化新闻数据失败", e);
            }
        }).start();
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
     * 定时任务：每2小时刷新一次新闻数据
     */
    @Scheduled(fixedRate = 2 * 60 * 60 * 1000) // 2小时
    public void scheduledRefresh() {
        log.info("定时刷新AI新闻数据...");
        refreshNewsData();
    }

    /**
     * 手动触发刷新
     */
    public void refreshNewsData() {
        log.info("开始刷新AI新闻数据...");

        List<Map<String, Object>> newArticles = new ArrayList<>();
        List<Map<String, Object>> newTech = new ArrayList<>();

        try {
            // 尝试从RSS源获取新闻（快速失败）
            for (String rssUrl : AI_NEWS_RSS) {
                try {
                    List<Map<String, Object>> fetched = fetchFromRSS(rssUrl);
                    newArticles.addAll(fetched);
                    if (newArticles.size() >= 10) break;
                } catch (Exception e) {
                    log.warn("从RSS获取新闻失败: {}", e.getMessage());
                }
            }

            // 获取技术发布信息
            for (String rssUrl : TECH_RELEASE_RSS) {
                try {
                    List<Map<String, Object>> fetched = fetchFromRSS(rssUrl);
                    newTech.addAll(fetched);
                    if (newTech.size() >= 8) break;
                } catch (Exception e) {
                    log.warn("从RSS获取技术信息失败: {}", e.getMessage());
                }
            }
        } catch (Exception e) {
            log.warn("RSS获取过程异常: {}", e.getMessage());
        }

        // 如果RSS获取失败或数据不足，使用备用数据
        if (newArticles.isEmpty()) {
            log.info("使用备用文章数据");
            newArticles = getFallbackArticles();
        }

        if (newTech.isEmpty()) {
            newTech = getFallbackTech();
        }

        // 更新缓存
        cachedHotArticles.clear();
        cachedHotArticles.addAll(newArticles.subList(0, Math.min(10, newArticles.size())));

        cachedNewTech.clear();
        cachedNewTech.addAll(newTech.subList(0, Math.min(8, newTech.size())));

        lastUpdateTime = LocalDateTime.now();
        log.info("AI新闻数据刷新完成，文章数: {}, 新技术数: {}", cachedHotArticles.size(), cachedNewTech.size());
    }

    /**
     * 从RSS源解析新闻
     */
    private List<Map<String, Object>> fetchFromRSS(String rssUrl) {
        List<Map<String, Object>> articles = new ArrayList<>();

        try {
            HttpHeaders headers = new HttpHeaders();
            headers.set("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36");
            HttpEntity<String> entity = new HttpEntity<>(headers);

            ResponseEntity<String> response = restTemplate.exchange(
                rssUrl,
                HttpMethod.GET,
                entity,
                String.class
            );

            if (response.getStatusCode() == HttpStatus.OK && response.getBody() != null) {
                articles = parseRSSFeed(response.getBody());
            }
        } catch (Exception e) {
            log.error("获取RSS失败: {}", rssUrl, e);
        }

        return articles;
    }

    /**
     * 解析RSS XML
     */
    private List<Map<String, Object>> parseRSSFeed(String xmlContent) {
        List<Map<String, Object>> articles = new ArrayList<>();

        try {
            DocumentBuilderFactory factory = DocumentBuilderFactory.newInstance();
            factory.setFeature("http://apache.org/xml/features/disallow-doctype-decl", true);
            Document doc = factory.newDocumentBuilder().parse(
                new InputSource(new StringReader(xmlContent))
            );

            NodeList items = doc.getElementsByTagName("item");

            for (int i = 0; i < Math.min(items.getLength(), 15); i++) {
                Element item = (Element) items.item(i);

                String title = getElementText(item, "title");
                String link = getElementText(item, "link");
                String pubDate = getElementText(item, "pubDate");
                String description = getElementText(item, "description");

                // 清理HTML标签
                if (description != null) {
                    description = description.replaceAll("<[^>]*>", "").trim();
                    if (description.length() > 150) {
                        description = description.substring(0, 150) + "...";
                    }
                }

                // 解析日期
                String formattedDate = formatDate(pubDate);

                // 分类判断
                String category = categorizeArticle(title, description);

                Map<String, Object> article = new HashMap<>();
                article.put("id", UUID.randomUUID().toString());
                article.put("title", title);
                article.put("summary", description);
                article.put("category", category);
                article.put("date", formattedDate);
                article.put("source", link);
                article.put("hot", i < 5); // 前5条标记为热门

                articles.add(article);
            }
        } catch (Exception e) {
            log.error("解析RSS失败", e);
        }

        return articles;
    }

    private String getElementText(Element parent, String tagName) {
        NodeList nodes = parent.getElementsByTagName(tagName);
        if (nodes.getLength() > 0) {
            return nodes.item(0).getTextContent().trim();
        }
        return "";
    }

    /**
     * 格式化日期
     */
    private String formatDate(String rssDate) {
        try {
            // RSS日期格式: "Sat, 09 Aug 2026 12:00:00 GMT"
            if (rssDate != null && !rssDate.isEmpty()) {
                // 简化处理，返回日期部分
                String[] parts = rssDate.split(" ");
                if (parts.length >= 4) {
                    return parts[3] + "-" + getMonth(parts[2]) + "-" + parts[1];
                }
            }
        } catch (Exception e) {
            log.warn("日期解析失败: {}", rssDate);
        }
        return LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd"));
    }

    private String getMonth(String month) {
        Map<String, String> months = new HashMap<>();
        months.put("Jan", "01"); months.put("Feb", "02"); months.put("Mar", "03");
        months.put("Apr", "04"); months.put("May", "05"); months.put("Jun", "06");
        months.put("Jul", "07"); months.put("Aug", "08"); months.put("Sep", "09");
        months.put("Oct", "10"); months.put("Nov", "11"); months.put("Dec", "12");
        return months.getOrDefault(month, "01");
    }

    /**
     * 根据标题和描述分类文章
     */
    private String categorizeArticle(String title, String description) {
        String text = (title + " " + description).toLowerCase();

        if (text.contains("gpt") || text.contains("claude") || text.contains("gemini") || text.contains("llm") || text.contains("language model")) {
            return "大语言模型";
        } else if (text.contains("image") || text.contains("video") || text.contains("stable diffusion") || text.contains("midjourney") || text.contains("dall-e")) {
            return "图像/视频生成";
        } else if (text.contains("robot") || text.contains("autonomous") || text.contains("self-driving")) {
            return "机器人/自动驾驶";
        } else if (text.contains("chip") || text.contains("nvidia") || text.contains("gpu") || text.contains("hardware")) {
            return "AI芯片/硬件";
        } else if (text.contains("startup") || text.contains("funding") || text.contains("billion") || text.contains("investment")) {
            return "AI创业/融资";
        } else if (text.contains("open source") || text.contains("open-source") || text.contains("hugging face")) {
            return "开源模型";
        } else if (text.contains("code") || text.contains("coding") || text.contains("copilot") || text.contains("cursor")) {
            return "AI编程";
        } else if (text.contains("health") || text.contains("medical") || text.contains("drug")) {
            return "AI医疗";
        } else {
            return "AI前沿技术";
        }
    }

    /**
     * 备用数据（当RSS获取失败时使用）
     */
    private List<Map<String, Object>> getFallbackArticles() {
        List<Map<String, Object>> articles = new ArrayList<>();
        String today = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd"));

        articles.add(createFallbackArticle("AI技术持续突破，多模态能力成为新焦点",
            "各大AI公司纷纷推出多模态模型，支持文本、图像、视频的统一理解和生成。",
            "大语言模型", today));
        articles.add(createFallbackArticle("开源大模型生态蓬勃发展",
            "越来越多的开源大模型发布，推动AI技术民主化，降低企业应用门槛。",
            "开源模型", today));
        articles.add(createFallbackArticle("AI Agent技术成为新热点",
            "能够自主执行复杂任务的AI Agent技术受到广泛关注，多家公司推出相关产品。",
            "AI Agent", today));
        articles.add(createFallbackArticle("AI在医疗领域取得重大进展",
            "AI辅助诊断、药物研发等应用不断突破，为医疗行业带来变革。",
            "AI医疗", today));
        articles.add(createFallbackArticle("AI编程助手大幅提升开发效率",
            "新一代AI编程工具支持更复杂的代码生成和重构，开发者生产力显著提升。",
            "AI编程", today));

        return articles;
    }

    private List<Map<String, Object>> getFallbackTech() {
        List<Map<String, Object>> techList = new ArrayList<>();
        String today = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd"));

        techList.add(createFallbackTech("GPT-4o", "OpenAI", "最新的多模态大模型，支持文本、图像、音频理解", today));
        techList.add(createFallbackTech("Claude 3.5 Sonnet", "Anthropic", "性能出色的语言模型，在编程和分析任务中表现优异", today));
        techList.add(createFallbackTech("Gemini 1.5 Pro", "Google", "支持超长上下文的多模态模型", today));
        techList.add(createFallbackTech("Llama 3.1", "Meta", "最新开源大模型，性能接近闭源模型", today));
        techList.add(createFallbackTech("Stable Diffusion 3", "Stability AI", "新一代图像生成模型，质量大幅提升", today));

        return techList;
    }

    private Map<String, Object> createFallbackArticle(String title, String summary, String category, String date) {
        Map<String, Object> article = new HashMap<>();
        article.put("id", UUID.randomUUID().toString());
        article.put("title", title);
        article.put("summary", summary);
        article.put("category", category);
        article.put("date", date);
        article.put("source", "#");
        article.put("hot", true);
        return article;
    }

    private Map<String, Object> createFallbackTech(String name, String company, String description, String date) {
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
