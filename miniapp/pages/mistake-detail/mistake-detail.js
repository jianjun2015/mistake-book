// pages/mistake-detail/mistake-detail.js
const { get, del } = require('../../utils/request');
const { BASE_URL } = require('../../utils/request');
const app = getApp();

Page({
  data: {
    id: null,
    mistake: null,
    loading: true
  },

  onLoad(options) {
    if (!app.checkLogin()) return;
    this.setData({ id: options.id });
    this.loadMistake();
  },

  async loadMistake() {
    this.setData({ loading: true });
    try {
      const res = await get(`/api/mistakes/${this.data.id}`);
      const mistake = res.data;
      
      // 处理图片 URL
      if (mistake.images) {
        mistake.images = mistake.images.map(img => ({
          ...img,
          fullUrl: `${BASE_URL}${img.imageUrl}`
        }));
      }

      this.setData({ mistake, loading: false });
    } catch (err) {
      console.error('加载错题详情失败', err);
      this.setData({ loading: false });
    }
  },

  goEdit() {
    wx.navigateTo({ url: `/pages/mistake-form/mistake-form?id=${this.data.id}` });
  },

  async handleDelete() {
    wx.showModal({
      title: '确认删除',
      content: '确定要删除这道错题吗？',
      success: async (res) => {
        if (res.confirm) {
          try {
            await del(`/api/mistakes/${this.data.id}`);
            wx.showToast({ title: '删除成功', icon: 'success' });
            setTimeout(() => wx.navigateBack(), 1000);
          } catch (err) {
            console.error('删除失败', err);
          }
        }
      }
    });
  },

  async handleStatusChange(e) {
    const status = e.currentTarget.dataset.status;
    try {
      await get(`/api/mistakes/${this.data.id}/status`, { status });
      wx.showToast({ title: '状态更新成功', icon: 'success' });
      this.loadMistake();
    } catch (err) {
      console.error('状态更新失败', err);
    }
  },

  previewImage(e) {
    const url = e.currentTarget.dataset.url;
    const urls = this.data.mistake.images.map(img => img.fullUrl);
    wx.previewImage({ current: url, urls });
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
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
  }
});
