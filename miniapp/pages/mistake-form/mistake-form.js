// pages/mistake-form/mistake-form.js
const { get, post, put, upload } = require('../../utils/request');
const { BASE_URL } = require('../../utils/request');
const app = getApp();

Page({
  data: {
    id: null,
    isEdit: false,
    loading: false,
    pageLoading: false,
    title: '',
    content: '',
    subject: '',
    difficulty: 3,
    correctAnswer: '',
    wrongReason: '',
    tags: '',
    images: [],
    subjectOptions: [
      { value: 'MATH', label: '数学' },
      { value: 'PHYSICS', label: '物理' },
      { value: 'CHEMISTRY', label: '化学' },
      { value: 'BIOLOGY', label: '生物' },
      { value: 'ENGLISH', label: '英语' },
      { value: 'CHINESE', label: '语文' }
    ],
    subjectIndex: -1,
    difficultyOptions: [1, 2, 3, 4, 5],
    difficultyIndex: 2
  },

  onLoad(options) {
    if (!app.checkLogin()) return;
    
    if (options.id) {
      this.setData({ id: options.id, isEdit: true });
      wx.setNavigationBarTitle({ title: '编辑错题' });
      this.loadMistake();
    }
  },

  async loadMistake() {
    this.setData({ pageLoading: true });
    try {
      const res = await get(`/api/mistakes/${this.data.id}`);
      const mistake = res.data;
      
      // 找到学科索引
      const subjectIndex = this.data.subjectOptions.findIndex(s => s.value === mistake.subject);
      
      // 处理图片
      const images = (mistake.images || []).map(img => ({
        id: img.id,
        url: img.imageUrl,
        fullUrl: `${BASE_URL}${img.imageUrl}`
      }));

      this.setData({
        title: mistake.title || '',
        content: mistake.content || '',
        subject: mistake.subject || '',
        subjectIndex: subjectIndex >= 0 ? subjectIndex : -1,
        difficulty: mistake.difficulty || 3,
        difficultyIndex: (mistake.difficulty || 3) - 1,
        correctAnswer: mistake.correctAnswer || '',
        wrongReason: mistake.wrongReason || '',
        tags: (mistake.tags || []).join(','),
        images,
        pageLoading: false
      });
    } catch (err) {
      console.error('加载错题失败', err);
      this.setData({ pageLoading: false });
    }
  },

  onTitleInput(e) { this.setData({ title: e.detail.value }); },
  onContentInput(e) { this.setData({ content: e.detail.value }); },
  onSubjectChange(e) { this.setData({ subjectIndex: e.detail.value }); },
  onDifficultyChange(e) { this.setData({ difficultyIndex: e.detail.value }); },
  onCorrectAnswerInput(e) { this.setData({ correctAnswer: e.detail.value }); },
  onWrongReasonInput(e) { this.setData({ wrongReason: e.detail.value }); },
  onTagsInput(e) { this.setData({ tags: e.detail.value }); },

  chooseImage() {
    const remaining = 5 - this.data.images.length;
    if (remaining <= 0) {
      wx.showToast({ title: '最多上传5张图片', icon: 'none' });
      return;
    }

    wx.chooseImage({
      count: remaining,
      sizeType: ['compressed'],
      sourceType: ['album', 'camera'],
      success: async (res) => {
        const tempFiles = res.tempFilePaths;
        
        for (const filePath of tempFiles) {
          try {
            wx.showLoading({ title: '上传中...' });
            const uploadRes = await upload('/api/images/upload', filePath);
            
            this.setData({
              images: [...this.data.images, {
                id: uploadRes.data.id,
                url: uploadRes.data.imageUrl,
                fullUrl: `${BASE_URL}${uploadRes.data.imageUrl}`
              }]
            });
          } catch (err) {
            console.error('上传失败', err);
          } finally {
            wx.hideLoading();
          }
        }
      }
    });
  },

  removeImage(e) {
    const index = e.currentTarget.dataset.index;
    const images = [...this.data.images];
    images.splice(index, 1);
    this.setData({ images });
  },

  async handleSubmit() {
    const { title, content, subjectIndex, difficultyIndex, correctAnswer, wrongReason, tags, images, subjectOptions, isEdit, id } = this.data;

    if (!content) {
      wx.showToast({ title: '请输入题目内容', icon: 'none' });
      return;
    }
    if (subjectIndex === -1) {
      wx.showToast({ title: '请选择学科', icon: 'none' });
      return;
    }

    this.setData({ loading: true });

    try {
      const submitData = {
        title,
        content,
        subject: subjectOptions[subjectIndex].value,
        difficulty: difficultyIndex + 1,
        correctAnswer,
        wrongReason,
        tags,
        images: images.map(img => img.url)
      };

      if (isEdit) {
        await put(`/api/mistakes/${id}`, submitData);
        wx.showToast({ title: '更新成功', icon: 'success' });
      } else {
        await post('/api/mistakes', submitData);
        wx.showToast({ title: '添加成功', icon: 'success' });
      }

      setTimeout(() => {
        wx.navigateBack();
      }, 1000);
    } catch (err) {
      console.error('提交失败', err);
    } finally {
      this.setData({ loading: false });
    }
  }
});
