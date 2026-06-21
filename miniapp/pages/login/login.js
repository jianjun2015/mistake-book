// pages/login/login.js
const { post } = require('../../utils/request');
const app = getApp();

Page({
  data: {
    username: '',
    password: '',
    loading: false
  },

  onLoad() {
    // 检查是否已登录
    if (app.getToken()) {
      wx.switchTab({ url: '/pages/dashboard/dashboard' });
    }
  },

  onUsernameInput(e) {
    this.setData({ username: e.detail.value });
  },

  onPasswordInput(e) {
    this.setData({ password: e.detail.value });
  },

  async handleLogin() {
    const { username, password } = this.data;
    
    if (!username) {
      wx.showToast({ title: '请输入用户名', icon: 'none' });
      return;
    }
    if (!password) {
      wx.showToast({ title: '请输入密码', icon: 'none' });
      return;
    }

    this.setData({ loading: true });

    try {
      // 密码 Base64 编码
      const encodedPassword = wx.arrayBufferToBase64(
        new TextEncoder().encode(password).buffer
      );

      const res = await post('/api/auth/login', {
        username,
        password: encodedPassword
      });

      app.setToken(res.data.token);
      app.setUserInfo(res.data.user);
      
      wx.showToast({ title: '登录成功', icon: 'success' });
      
      setTimeout(() => {
        wx.switchTab({ url: '/pages/dashboard/dashboard' });
      }, 1000);
    } catch (err) {
      console.error('登录失败', err);
    } finally {
      this.setData({ loading: false });
    }
  },

  goRegister() {
    wx.navigateTo({ url: '/pages/register/register' });
  }
});
