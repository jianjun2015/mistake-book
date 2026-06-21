// app.js
App({
  globalData: {
    userInfo: null,
    token: null,
    baseUrl: 'https://ty66666.cloud' // 生产环境
    // baseUrl: 'http://localhost:9999' // 开发环境
  },

  onLaunch() {
    // 检查登录状态
    const token = wx.getStorageSync('token');
    const userInfo = wx.getStorageSync('userInfo');
    if (token && userInfo) {
      this.globalData.token = token;
      this.globalData.userInfo = userInfo;
    }
  },

  // 检查登录状态
  checkLogin() {
    const token = this.globalData.token;
    if (!token) {
      wx.redirectTo({ url: '/pages/login/login' });
      return false;
    }
    return true;
  },

  // 获取 token
  getToken() {
    return this.globalData.token || wx.getStorageSync('token');
  },

  // 设置 token
  setToken(token) {
    this.globalData.token = token;
    wx.setStorageSync('token', token);
  },

  // 设置用户信息
  setUserInfo(userInfo) {
    this.globalData.userInfo = userInfo;
    wx.setStorageSync('userInfo', userInfo);
  },

  // 退出登录
  logout() {
    this.globalData.token = null;
    this.globalData.userInfo = null;
    wx.removeStorageSync('token');
    wx.removeStorageSync('userInfo');
    wx.redirectTo({ url: '/pages/login/login' });
  }
});
