// pages/register/register.js
const { post } = require('../../utils/request');

Page({
  data: {
    username: '',
    password: '',
    confirmPassword: '',
    grade: '',
    gender: '',
    loading: false,
    gradeOptions: [
      { value: 1, label: '一年级' },
      { value: 2, label: '二年级' },
      { value: 3, label: '三年级' },
      { value: 4, label: '四年级' },
      { value: 5, label: '五年级' },
      { value: 6, label: '六年级' },
      { value: 7, label: '初一' },
      { value: 8, label: '初二' },
      { value: 9, label: '初三' },
      { value: 10, label: '高一' },
      { value: 11, label: '高二' },
      { value: 12, label: '高三' }
    ],
    genderOptions: [
      { value: 1, label: '男' },
      { value: 2, label: '女' }
    ],
    gradeIndex: -1,
    genderIndex: -1
  },

  onUsernameInput(e) {
    this.setData({ username: e.detail.value });
  },

  onPasswordInput(e) {
    this.setData({ password: e.detail.value });
  },

  onConfirmPasswordInput(e) {
    this.setData({ confirmPassword: e.detail.value });
  },

  onGradeChange(e) {
    this.setData({ gradeIndex: e.detail.value });
  },

  onGenderChange(e) {
    this.setData({ genderIndex: e.detail.value });
  },

  async handleRegister() {
    const { username, password, confirmPassword, gradeIndex, genderIndex, gradeOptions, genderOptions } = this.data;
    
    if (!username) {
      wx.showToast({ title: '请输入用户名', icon: 'none' });
      return;
    }
    if (username.length < 3) {
      wx.showToast({ title: '用户名至少3个字符', icon: 'none' });
      return;
    }
    if (!password) {
      wx.showToast({ title: '请输入密码', icon: 'none' });
      return;
    }
    if (password.length < 6) {
      wx.showToast({ title: '密码至少6个字符', icon: 'none' });
      return;
    }
    if (password !== confirmPassword) {
      wx.showToast({ title: '两次密码不一致', icon: 'none' });
      return;
    }
    if (gradeIndex === -1) {
      wx.showToast({ title: '请选择年级', icon: 'none' });
      return;
    }
    if (genderIndex === -1) {
      wx.showToast({ title: '请选择性别', icon: 'none' });
      return;
    }

    this.setData({ loading: true });

    try {
      // 密码 Base64 编码
      const encodedPassword = wx.arrayBufferToBase64(
        new TextEncoder().encode(password).buffer
      );

      await post('/api/auth/register', {
        username,
        password: encodedPassword,
        grade: gradeOptions[gradeIndex].value,
        gender: genderOptions[genderIndex].value
      });

      wx.showToast({ title: '注册成功', icon: 'success' });
      
      setTimeout(() => {
        wx.navigateBack();
      }, 1000);
    } catch (err) {
      console.error('注册失败', err);
    } finally {
      this.setData({ loading: false });
    }
  }
});
