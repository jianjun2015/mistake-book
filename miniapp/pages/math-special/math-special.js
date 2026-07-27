// pages/math-special/math-special.js
const app = getApp();

Page({
  data: {
    grade: 3,
    activeTab: 'thinking',
    thinkingProblems: [],
    calcProblems: [],
    showAnswer: {}
  },

  onLoad() {
    if (!app.checkLogin()) return;
    this.loadThinkingProblems();
    this.loadCalcProblems();
  },

  onGradeChange(e) {
    this.setData({ grade: Number(e.detail.value) + 3 });
    this.loadThinkingProblems();
    this.loadCalcProblems();
  },

  onTabChange(e) {
    this.setData({ activeTab: e.detail.name });
  },

  loadThinkingProblems() {
    const problems = [
      { category: '找规律', items: ['2,5,8,11,__,__', '1,4,9,16,__,__', '1,2,4,7,11,__'] },
      { category: '和差问题', items: ['两数和20差4', '甲乙共有45元'] },
      { category: '年龄问题', items: ['哥15弟10几年后和45', '爸40儿10几年前5倍'] },
      { category: '植树问题', items: ['100米5米间隔两端都种', '圆坛50米5米间隔'] },
      { category: '鸡兔同笼', items: ['鸡兔20只脚56只', '5元10元共8张60元'] },
    ];
    this.setData({ thinkingProblems: problems });
  },

  loadCalcProblems() {
    const problems = [
      { category: '四则混合运算', items: ['125+375×2', '(240-180)÷4', '36×5+120÷4'] },
      { category: '竖式计算', items: ['345×6', '1568÷4', '456+789'] },
      { category: '巧算', items: ['99×7', '25×36', '125×8'] },
    ];
    this.setData({ calcProblems: problems });
  },

  toggleAnswer(e) {
    const { id } = e.currentTarget.dataset;
    this.setData({
      [`showAnswer.${id}`]: !this.data.showAnswer[id]
    });
  },

  refreshCalc() {
    this.loadCalcProblems();
    wx.showToast({ title: '题目已刷新', icon: 'success' });
  }
});
