// pages/search/search.js
const { get } = require('../../utils/request');
const app = getApp();

Page({
  data: {
    keyword: '',
    mistakeList: [],
    loading: false,
    searched: false,
    page: 1,
    size: 10,
    total: 0
  },

  onLoad() {
    if (!app.checkLogin()) return;
  },

  onKeywordInput(e) {
    this.setData({ keyword: e.detail.value });
  },

  async handleSearch() {
    const { keyword } = this.data;
    if (!keyword.trim()) {
      wx.showToast({ title: '请输入搜索关键词', icon: 'none' });
      return;
    }

    this.setData({ loading: true, searched: true, page: 1, mistakeList: [] });

    try {
      const res = await get('/api/mistakes/search', {
        keyword: keyword.trim(),
        page: 1,
        size: this.data.size
      });

      this.setData({
        mistakeList: res.data.content,
        total: res.data.totalElements,
        loading: false
      });
    } catch (err) {
      console.error('搜索失败', err);
      this.setData({ loading: false });
    }
  },

  goDetail(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({ url: `/pages/mistake-detail/mistake-detail?id=${id}` });
  },

  getSubjectName(subject) {
    const map = {
      'MATH': '数学', 'PHYSICS': '物理', 'CHEMISTRY': '化学',
      'BIOLOGY': '生物', 'ENGLISH': '英语', 'CHINESE': '语文'
    };
    return map[subject] || subject;
  },

  formatTime(time) {
    if (!time) return '';
    const date = new Date(time);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  }
});
