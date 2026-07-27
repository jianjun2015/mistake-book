// pages/phonetic-practice/phonetic-practice.js
const app = getApp();

Page({
  data: {
    activeTab: 'practice',
    grade: 3,
    questions: [],
    currentQuestion: 0,
    selectedAnswer: null,
    showResult: false,
    score: 0
  },

  onLoad() {
    if (!app.checkLogin()) return;
    this.generateQuestions();
  },

  onTabChange(e) {
    this.setData({ activeTab: e.detail.name });
  },

  onGradeChange(e) {
    const grade = Number(e.detail.value) + 3;
    this.setData({ grade });
    this.generateQuestions();
  },

  generateQuestions() {
    const questions = [
      { question: '/iː/ 对应的单词是？', options: ['see', 'sit', 'bed', 'cat'], answer: 0 },
      { question: '/æ/ 对应的单词是？', options: ['car', 'cat', 'cup', 'bird'], answer: 1 },
      { question: '/θ/ 对应的单词是？', options: ['this', 'think', 'she', 'zoo'], answer: 1 },
      { question: '/ʃ/ 对应的单词是？', options: ['see', 'zoo', 'she', 'think'], answer: 2 },
      { question: '/ŋ/ 对应的单词是？', options: ['no', 'sing', 'let', 'red'], answer: 1 },
    ];
    // 打乱顺序
    const shuffled = questions.sort(() => Math.random() - 0.5);
    this.setData({ questions: shuffled, currentQuestion: 0, score: 0, selectedAnswer: null, showResult: false });
  },

  selectAnswer(e) {
    if (this.data.showResult) return;
    this.setData({ selectedAnswer: e.currentTarget.dataset.index });
  },

  submitAnswer() {
    if (this.data.selectedAnswer === null) {
      wx.showToast({ title: '请选择答案', icon: 'none' });
      return;
    }
    const isCorrect = this.data.selectedAnswer === this.data.questions[this.data.currentQuestion].answer;
    if (isCorrect) {
      this.setData({ score: this.data.score + 1 });
      wx.showToast({ title: '回答正确！', icon: 'success' });
    } else {
      wx.showToast({ title: '回答错误！', icon: 'error' });
    }
    this.setData({ showResult: true });
  },

  nextQuestion() {
    const next = this.data.currentQuestion + 1;
    if (next >= this.data.questions.length) {
      wx.showModal({
        title: '练习完成',
        content: `得分：${this.data.score}/${this.data.questions.length}`,
        showCancel: false,
        success: () => this.generateQuestions()
      });
    } else {
      this.setData({
        currentQuestion: next,
        selectedAnswer: null,
        showResult: false
      });
    }
  }
});
