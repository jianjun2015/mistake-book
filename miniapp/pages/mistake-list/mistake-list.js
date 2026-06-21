// pages/mistake-list/mistake-list.js
const { get, del } = require('../../utils/request');
const app = getApp();

Page({
  data: {
    mistakeList: [],
    loading: false,
    page: 1,
    size: 10,
    total: 0,
    hasMore: true
  },

  onLoad() {
    if (!app.checkLogin()) return;
    this.loadMistakes();
  },

  onShow() {
    if (app.getToken()) {
      this.refreshList();
    }
  },

  onPullDownRefresh() {
    this.refreshList();
  },

  onReachBottom() {
    if (this.data.hasMore && !this.data.loading) {
      this.loadMore();
    }
  },

  refreshList() {
    this.setData({ page: 1, mistakeList: [] });
    this.loadMistakes();
  },

  async loadMistakes() {
    if (this.data.loading) return;
    
    this.setData({ loading: true });

    try {
      const res = await get('/api/mistakes', {
        page: this.data.page,
        size: this.data.size
      });

      const { content, totalElements } = res.data;
      
      this.setData({
        mistakeList: this.data.page === 1 ? content : [...this.data.mistakeList, ...content],
        total: totalElements,
        hasMore: this.data.mistakeList.length + content.length < totalElements
      });
    } catch (err) {
      console.error('加载错题列表失败', err);
    } finally {
      this.setData({ loading: false });
      wx.stopPullDownRefresh();
    }
  },

  loadMore() {
    this.setData({ page: this.data.page + 1 });
    this.loadMistakes();
  },

  goDetail(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({ url: `/pages/mistake-detail/mistake-detail?id=${id}` });
  },

  goEdit(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({ url: `/pages/mistake-form/mistake-form?id=${id}` });
  },

  async handleDelete(e) {
    const id = e.currentTarget.dataset.id;
    
    wx.showModal({
      title: '确认删除',
      content: '确定要删除这道错题吗？',
      success: async (res) => {
        if (res.confirm) {
          try {
            await del(`/api/mistakes/${id}`);
            wx.showToast({ title: '删除成功', icon: 'success' });
            this.refreshList();
          } catch (err) {
            console.error('删除失败', err);
          }
        }
      }
    });
  },

  async handleStatusChange(e) {
    const { id, status } = e.currentTarget.dataset;
    
    try {
      await get(`/api/mistakes/${id}/status`, { status });
      wx.showToast({ title: '状态更新成功', icon: 'success' });
      this.refreshList();
    } catch (err) {
      console.error('状态更新失败', err);
    }
  },

  getSubjectName(subject) {
    const map = {
      'MATH': '数学',
      'PHYSICS': '物理',
      'CHEMISTRY': '化学',
      'BIOLOGY': '生物',
      'ENGLISH': '英语',
      'CHINESE': '语文'
    };
    return map[subject] || subject;
  },

  getSubjectClass(subject) {
    const map = {
      'MATH': 'tag-math',
      'PHYSICS': 'tag-physics',
      'CHEMISTRY': 'tag-chemistry',
      'BIOLOGY': 'tag-biology',
      'ENGLISH': 'tag-english',
      'CHINESE': 'tag-chinese'
    };
    return map[subject] || '';
  },

  getStatusName(status) {
    const map = { 0: '未掌握', 1: '半掌握', 2: '已掌握' };
    return map[status] || '未知';
  },

  getStatusClass(status) {
    return `status-${status}`;
  },

  formatTime(time) {
    if (!time) return '';
    const date = new Date(time);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  }
});
