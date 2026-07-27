// pages/learning-methods/learning-methods.js
const app = getApp();

Page({
  data: {
    subject: 'chinese',
    grade: '三年级',
    methods: []
  },

  onLoad() {
    if (!app.checkLogin()) return;
    this.loadMethods();
  },

  onSubjectChange(e) {
    this.setData({ subject: e.currentTarget.dataset.subject });
    this.loadMethods();
  },

  onGradeChange(e) {
    const grades = ['三年级', '四年级'];
    this.setData({ grade: grades[e.detail.value] });
    this.loadMethods();
  },

  loadMethods() {
    const allMethods = {
      chinese: [
        {
          title: '阅读理解三步法',
          difficulty: 'easy',
          steps: ['通读全文，了解大意', '精读题目，带着问题阅读', '定位答案，提取关键信息'],
          source: '《小学语文阅读理解训练》',
          result: '正确率从60%提升到85%'
        },
        {
          title: '作文五感写作法',
          difficulty: 'medium',
          steps: ['确定主题', '用五感观察：视觉、听觉、嗅觉、触觉、味觉', '组织语言', '添加感受'],
          source: '《小学生作文指导》',
          result: '作文分数从70分提升到90分'
        },
        {
          title: '古诗词记忆法',
          difficulty: 'easy',
          steps: ['理解诗意', '画面联想', '反复朗读', '默写巩固'],
          source: '《古诗词学习方法》',
          result: '记忆效率提升3倍'
        },
      ],
      math: [
        {
          title: '错题本学习法',
          difficulty: 'easy',
          steps: ['记录错题', '分析错因', '重做错题', '定期复习'],
          source: '《高效学习方法》',
          result: '成绩从75分提升到92分'
        },
        {
          title: '画图解题法',
          difficulty: 'medium',
          steps: ['理解题意', '画出示意图', '标注数据', '列式计算'],
          source: '《数学解题技巧》',
          result: '应用题正确率从50%提升到85%'
        },
        {
          title: '口算速算法',
          difficulty: 'easy',
          steps: ['凑十法', '拆分法', '估算练习', '限时练习'],
          source: '《口算速算技巧》',
          result: '口算速度提升3倍'
        },
      ],
      english: [
        {
          title: '自然拼读法',
          difficulty: 'easy',
          steps: ['学习字母音', '学习元音', '学习辅音组合', '拼读练习'],
          source: '《Phonics自然拼读》',
          result: '单词记忆效率提升3倍'
        },
        {
          title: '情境学习法',
          difficulty: 'easy',
          steps: ['创设情境', '角色扮演', '实物对照', '情景对话'],
          source: '《情境英语学习法》',
          result: '口语表达能力显著提升'
        },
        {
          title: '单词卡片法',
          difficulty: 'easy',
          steps: ['制作卡片', '分类整理', '间隔复习', '自测巩固'],
          source: '《单词记忆法》',
          result: '一个月掌握200个单词'
        },
      ],
    };

    this.setData({ methods: allMethods[this.data.subject] || [] });
  }
});
