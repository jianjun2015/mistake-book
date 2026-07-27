// pages/ai-tech/ai-tech.js
const app = getApp();

Page({
  data: {
    activeTab: 'tech',
    selectedCategory: 'all',
    categories: [
      { key: 'all', name: '全部', color: '#1890ff' },
      { key: 'llm', name: '大语言模型', color: '#1890ff' },
      { key: 'agent', name: 'AI Agent', color: '#722ed1' },
      { key: 'image', name: '图像生成', color: '#eb2f96' },
      { key: 'video', name: '视频生成', color: '#fa8c16' },
      { key: 'coding', name: 'AI编程', color: '#13c2c2' },
    ],
    techList: [],
    filteredList: [],
    hotArticles: [],
    newTech: [],
    lastUpdate: ''
  },

  onLoad() {
    if (!app.checkLogin()) return;
    this.loadTechData();
    this.loadHotArticles();
    this.loadNewTech();
    this.checkAutoRefresh();
  },

  loadTechData() {
    const techList = [
      { id: 1, name: 'GPT-4o', category: 'llm', description: 'OpenAI最新多模态模型', features: ['多模态', '实时语音', '代码生成'] },
      { id: 2, name: 'Claude 3.5', category: 'llm', description: 'Anthropic高性能AI助手', features: ['长上下文', '代码理解', '安全对齐'] },
      { id: 3, name: 'Gemini 1.5', category: 'llm', description: 'Google多模态AI模型', features: ['100万token', '多模态', '代码生成'] },
      { id: 4, name: 'Llama 3.1', category: 'llm', description: 'Meta开源大语言模型', features: ['开源免费', '本地部署', '社区支持'] },
      { id: 5, name: 'DeepSeek-V2', category: 'llm', description: '深度求索MoE模型', features: ['MoE架构', '低成本', '中文优化'] },
      { id: 6, name: 'Qwen2.5', category: 'llm', description: '阿里云通义千问', features: ['中文优化', '工具调用', '多模态'] },
      { id: 7, name: 'AutoGPT', category: 'agent', description: '自主AI代理框架', features: ['任务规划', '自主执行', '工具使用'] },
      { id: 8, name: 'LangChain', category: 'agent', description: 'LLM应用开发框架', features: ['链式调用', '工具集成', '记忆管理'] },
      { id: 9, name: 'CrewAI', category: 'agent', description: '多智能体协作框架', features: ['多角色协作', '任务分配', '流程编排'] },
      { id: 10, name: 'DALL-E 3', category: 'image', description: 'OpenAI文生图模型', features: ['文生图', '风格控制', '高分辨率'] },
      { id: 11, name: 'Midjourney', category: 'image', description: 'AI绘画工具', features: ['艺术风格', '高画质', '风格多样'] },
      { id: 12, name: 'Sora', category: 'video', description: 'OpenAI文生视频模型', features: ['文生视频', '长视频', '高质量'] },
      { id: 13, name: 'Cursor', category: 'coding', description: 'AI代码编辑器', features: ['代码补全', '智能重构', '对话编程'] },
      { id: 14, name: 'GitHub Copilot', category: 'coding', description: 'AI编程助手', features: ['代码补全', '多语言', 'IDE集成'] },
    ];
    this.setData({ 
      techList, 
      filteredList: techList,
      lastUpdate: new Date().toLocaleString('zh-CN')
    });
  },

  loadHotArticles() {
    const articles = [
      { id: 1, title: 'GPT-5即将发布：OpenAI预告重大突破', summary: 'OpenAI宣布GPT-5将在未来几个月内发布，预计将带来更强的推理能力。', category: '大语言模型', date: '2024-01-15', hot: true },
      { id: 2, title: 'Google发布Gemini 2.0', summary: '性能全面超越GPT-4，特别是在代码生成方面。', category: '大语言模型', date: '2024-01-14', hot: true },
      { id: 3, title: 'Meta开源Llama 4', summary: '最强开源模型诞生，完全开源免费。', category: '开源模型', date: '2024-01-13', hot: false },
      { id: 4, title: 'Sora正式开放使用', summary: 'AI视频生成进入新时代，支持60秒视频。', category: '视频生成', date: '2024-01-12', hot: true },
      { id: 5, title: 'Cursor 2.0发布', summary: 'AI编程效率再提升50%。', category: 'AI编程', date: '2024-01-11', hot: false },
    ];
    this.setData({ hotArticles: articles });
  },

  loadNewTech() {
    const tech = [
      { id: 1, name: 'GPT-4o Turbo', company: 'OpenAI', description: '更快更便宜的GPT-4o版本', date: '2024-01-15', isNew: true },
      { id: 2, name: 'Stable Diffusion XL Turbo', company: 'Stability AI', description: '实时图像生成', date: '2024-01-14', isNew: true },
      { id: 3, name: 'Whisper V4', company: 'OpenAI', description: '语音识别准确率提升30%', date: '2024-01-13', isNew: true },
      { id: 4, name: 'DALL-E 4', company: 'OpenAI', description: '图像质量大幅提升', date: '2024-01-12', isNew: true },
      { id: 5, name: 'CodeLlama 70B', company: 'Meta', description: '最强开源代码模型', date: '2024-01-11', isNew: true },
    ];
    this.setData({ newTech: tech });
  },

  checkAutoRefresh() {
    const lastRefresh = wx.getStorageSync('ai_tech_last_refresh');
    const now = Date.now();
    if (!lastRefresh || (now - lastRefresh) > 3 * 60 * 60 * 1000) {
      this.loadTechData();
      this.loadHotArticles();
      this.loadNewTech();
      wx.setStorageSync('ai_tech_last_refresh', now);
    }
  },

  onTabChange(e) {
    this.setData({ activeTab: e.detail.name });
  },

  filterByCategory(e) {
    const category = e.currentTarget.dataset.category;
    const filtered = category === 'all' 
      ? this.data.techList 
      : this.data.techList.filter(t => t.category === category);
    this.setData({ selectedCategory: category, filteredList: filtered });
  },

  refreshData() {
    this.loadTechData();
    this.loadHotArticles();
    this.loadNewTech();
    wx.setStorageSync('ai_tech_last_refresh', Date.now());
    wx.showToast({ title: '数据已刷新', icon: 'success' });
  },

  openLink(e) {
    const url = e.currentTarget.dataset.url;
    if (url) {
      wx.setClipboardData({
        data: url,
        success: () => {
          wx.showToast({ title: '链接已复制，请在浏览器打开', icon: 'none' });
        }
      });
    }
  }
});
