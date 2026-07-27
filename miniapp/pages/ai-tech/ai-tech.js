// pages/ai-tech/ai-tech.js
const app = getApp();

Page({
  data: {
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
    lastUpdate: ''
  },

  onLoad() {
    if (!app.checkLogin()) return;
    this.loadTechData();
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
      { id: 10, name: 'Dify', category: 'agent', description: 'LLM应用开发平台', features: ['可视化编排', 'RAG支持', '插件系统'] },
      { id: 11, name: 'DALL-E 3', category: 'image', description: 'OpenAI文生图模型', features: ['文生图', '风格控制', '高分辨率'] },
      { id: 12, name: 'Midjourney', category: 'image', description: 'AI绘画工具', features: ['艺术风格', '高画质', '风格多样'] },
      { id: 13, name: 'Stable Diffusion', category: 'image', description: '开源图像生成模型', features: ['开源免费', '本地部署', '插件丰富'] },
      { id: 14, name: 'Sora', category: 'video', description: 'OpenAI文生视频模型', features: ['文生视频', '长视频', '高质量'] },
      { id: 15, name: 'Runway Gen-3', category: 'video', description: 'AI视频生成工具', features: ['文生视频', '图生视频', '视频编辑'] },
      { id: 16, name: 'Cursor', category: 'coding', description: 'AI代码编辑器', features: ['代码补全', '智能重构', '对话编程'] },
      { id: 17, name: 'GitHub Copilot', category: 'coding', description: 'AI编程助手', features: ['代码补全', '多语言', 'IDE集成'] },
    ];
    this.setData({ 
      techList, 
      filteredList: techList,
      lastUpdate: new Date().toLocaleString('zh-CN')
    });
  },

  checkAutoRefresh() {
    const lastRefresh = wx.getStorageSync('ai_tech_last_refresh');
    const now = Date.now();
    if (!lastRefresh || (now - lastRefresh) > 3 * 60 * 60 * 1000) {
      this.loadTechData();
      wx.setStorageSync('ai_tech_last_refresh', now);
    }
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
