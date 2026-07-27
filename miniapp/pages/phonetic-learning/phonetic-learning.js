// pages/phonetic-learning/phonetic-learning.js
const app = getApp();

Page({
  data: {
    activeTab: 'learn',
    selectedType: 'all',
    phonetics: [],
    filteredPhonetics: [],
    playingWord: null
  },

  onLoad() {
    if (!app.checkLogin()) return;
    this.loadPhonetics();
  },

  loadPhonetics() {
    const phonetics = [
      { symbol: '/iː/', type: '长元音', words: ['see', 'tea', 'bee'], description: '舌尖抵下齿，嘴唇扁平' },
      { symbol: '/ɪ/', type: '短元音', words: ['sit', 'big', 'hit'], description: '舌尖抵下齿，嘴唇微开' },
      { symbol: '/e/', type: '短元音', words: ['bed', 'red', 'get'], description: '嘴型半开' },
      { symbol: '/æ/', type: '短元音', words: ['cat', 'bad', 'map'], description: '嘴巴张大' },
      { symbol: '/ɑː/', type: '长元音', words: ['car', 'father', 'star'], description: '口张大' },
      { symbol: '/ɒ/', type: '短元音', words: ['hot', 'dog', 'box'], description: '双唇稍圆' },
      { symbol: '/ɔː/', type: '长元音', words: ['all', 'four', 'door'], description: '双唇收圆' },
      { symbol: '/ʊ/', type: '短元音', words: ['put', 'good', 'book'], description: '双唇收圆' },
      { symbol: '/uː/', type: '长元音', words: ['too', 'blue', 'food'], description: '双唇收圆突出' },
      { symbol: '/ʌ/', type: '短元音', words: ['cup', 'bus', 'fun'], description: '嘴唇半开' },
      { symbol: '/ɜː/', type: '长元音', words: ['bird', 'her', 'word'], description: '嘴唇扁平' },
      { symbol: '/ə/', type: '短元音', words: ['about', 'again', 'teacher'], description: '嘴唇自然' },
      { symbol: '/p/', type: '爆破音', words: ['pen', 'map', 'happy'], description: '双唇闭合' },
      { symbol: '/b/', type: '爆破音', words: ['bad', 'job', 'web'], description: '双唇闭合' },
      { symbol: '/t/', type: '爆破音', words: ['tea', 'sit', 'cat'], description: '舌尖抵上齿龈' },
      { symbol: '/d/', type: '爆破音', words: ['day', 'dog', 'bed'], description: '舌尖抵上齿龈' },
      { symbol: '/k/', type: '爆破音', words: ['key', 'back', 'cat'], description: '舌后部抵软腭' },
      { symbol: '/g/', type: '爆破音', words: ['go', 'bag', 'big'], description: '舌后部抵软腭' },
      { symbol: '/f/', type: '摩擦音', words: ['fat', 'off', 'life'], description: '上齿咬下唇' },
      { symbol: '/v/', type: '摩擦音', words: ['very', 'have', 'five'], description: '上齿咬下唇' },
      { symbol: '/θ/', type: '摩擦音', words: ['think', 'bath', 'three'], description: '舌尖抵上齿' },
      { symbol: '/ð/', type: '摩擦音', words: ['this', 'that', 'the'], description: '舌尖抵上齿' },
      { symbol: '/s/', type: '摩擦音', words: ['see', 'miss', 'yes'], description: '舌尖接近上齿龈' },
      { symbol: '/z/', type: '摩擦音', words: ['zoo', 'has', 'his'], description: '舌尖接近上齿龈' },
      { symbol: '/ʃ/', type: '摩擦音', words: ['she', 'fish', 'ship'], description: '舌前部接近硬腭' },
      { symbol: '/ʒ/', type: '摩擦音', words: ['measure', 'vision', 'pleasure'], description: '舌前部接近硬腭' },
      { symbol: '/h/', type: '摩擦音', words: ['hat', 'hot', 'he'], description: '气流从声门出' },
      { symbol: '/r/', type: '摩擦音', words: ['red', 'car', 'run'], description: '舌尖卷起' },
      { symbol: '/tʃ/', type: '破擦音', words: ['cheese', 'catch', 'teacher'], description: '舌尖抵上齿龈后部' },
      { symbol: '/dʒ/', type: '破擦音', words: ['job', 'juice', 'age'], description: '舌尖抵上齿龈后部' },
      { symbol: '/m/', type: '鼻音', words: ['man', 'map', 'him'], description: '双唇闭合' },
      { symbol: '/n/', type: '鼻音', words: ['no', 'ten', 'in'], description: '舌尖抵上齿龈' },
      { symbol: '/ŋ/', type: '鼻音', words: ['sing', 'long', 'king'], description: '舌后部抵软腭' },
      { symbol: '/l/', type: '边音', words: ['let', 'all', 'help'], description: '舌尖抵上齿龈' },
      { symbol: '/w/', type: '半元音', words: ['wet', 'how', 'we'], description: '双唇收圆' },
      { symbol: '/j/', type: '半元音', words: ['yes', 'you', 'year'], description: '舌前部向硬腭抬起' },
    ];
    this.setData({ phonetics, filteredPhonetics: phonetics });
  },

  filterByType(e) {
    const type = e.currentTarget.dataset.type;
    const filtered = type === 'all' 
      ? this.data.phonetics 
      : this.data.phonetics.filter(p => p.type === type);
    this.setData({ selectedType: type, filteredPhonetics: filtered });
  },

  playWord(e) {
    const word = e.currentTarget.dataset.word;
    this.setData({ playingWord: word });
    // 使用小程序内置TTS（需要基础库支持）
    wx.showToast({ title: `播放: ${word}`, icon: 'none' });
    setTimeout(() => this.setData({ playingWord: null }), 1500);
  },

  onTabChange(e) {
    this.setData({ activeTab: e.detail.name });
  }
});
