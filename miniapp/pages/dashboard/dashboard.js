// pages/dashboard/dashboard.js
const { get } = require('../../utils/request');
const app = getApp();

Page({
  data: {
    userInfo: null,
    stats: {
      total: 0,
      mastered: 0,
      halfMastered: 0,
      notMastered: 0
    },
    recentMistakes: [],
    loading: true
  },

  onLoad() {
    if (!app.checkLogin()) return;
    this.loadDashboard();
  },

  onShow() {
    if (app.getToken()) {
      this.loadDashboard();
    }
  },

  async loadDashboard() {
    this.setData({ loading: true });
    
    try {
      // 获取用户信息
      const userInfo = app.globalData.userInfo;
      this.setData({ userInfo });

      // 获取错题统计
      const listRes = await get('/api/mistakes', { page: 1, size: 1000 });
      const mistakes = listRes.data.content || [];
      
      const stats = {
        total: listRes.data.totalElements || 0,
        mastered: mistakes.filter(m => m.status === 2).length,
        halfMastered: mistakes.filter(m => m.status === 1).length,
        notMastered: mistakes.filter(m => m.status === 0).length
      };

      // 获取最近错题
      const recentMistakes = mistakes.slice(0, 5);

      this.setData({
        stats,
        recentMistakes,
        loading: false
      });
    } catch (err) {
      console.error('加载首页失败', err);
      this.setData({ loading: false });
    }
  },

  goMistakeList() {
    wx.switchTab({ url: '/pages/mistake-list/mistake-list' });
  },

  goAddMistake() {
    wx.switchTab({ url: '/pages/mistake-form/mistake-form' });
  },

  goDetail(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({ url: `/pages/mistake-detail/mistake-detail?id=${id}` });
  },

  handleLogout() {
    wx.showModal({
      title: '确认退出',
      content: '确定要退出登录吗？',
      success(res) {
        if (res.confirm) {
          app.logout();
        }
      }
    });
  },

  getSubjectName(subject) {
    const map = {
      'MATH': '数学', 'PHYSICS': '物理', 'CHEMISTRY': '化学',
      'BIOLOGY': '生物', 'ENGLISH': '英语', 'CHINESE': '语文'
    };
    return map[subject] || subject;
  },

  getStatusName(status) {
    const map = { 0: '未掌握', 1: '半掌握', 2: '已掌握' };
    return map[status] || '未知';
  },

  formatTime(time) {
    if (!time) return '';
    const date = new Date(time);
    return `${date.getMonth() + 1}/${date.getDate()}`;
  }
});
