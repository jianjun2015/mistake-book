import React, { useState, useEffect } from 'react';
import { Card, Tabs, Button, Space, Radio, message, Tag } from 'antd';
import { SoundOutlined, CheckCircleOutlined, CloseCircleOutlined, PauseCircleOutlined } from '@ant-design/icons';
import MainLayout from '../../components/layout/MainLayout';

// 48个国际音标
// sound: 用于发音的文本（使用能体现该音标的单词或音节）
// word: 例词
const phonetics = [
  // ============ 长元音（5个）============
  { symbol: '/iː/', example: 'see, tea', type: '长元音', description: '舌尖抵下齿，舌前部向硬腭抬起，嘴唇扁平', word: 'see', sound: 'see' },
  { symbol: '/ɑː/', example: 'car, father', type: '长元音', description: '口张大，舌身平放后缩，舌尖离开下齿', word: 'car', sound: 'father' },
  { symbol: '/ɔː/', example: 'all, four', type: '长元音', description: '双唇收圆并突出，舌后部抬起', word: 'all', sound: 'all' },
  { symbol: '/uː/', example: 'too, blue', type: '长元音', description: '双唇收圆，突出，舌后部抬起', word: 'too', sound: 'blue' },
  { symbol: '/ɜː/', example: 'bird, her', type: '长元音', description: '舌身平放，中部稍抬起，嘴唇扁平', word: 'bird', sound: 'bird' },
  
  // ============ 短元音（7个）============
  { symbol: '/ɪ/', example: 'sit, big', type: '短元音', description: '舌尖抵下齿，舌前部稍抬起，嘴唇微开', word: 'sit', sound: 'sit' },
  { symbol: '/e/', example: 'bed, red', type: '短元音', description: '舌尖抵下齿，舌前部稍抬起，嘴型半开', word: 'bed', sound: 'bed' },
  { symbol: '/æ/', example: 'cat, bad', type: '短元音', description: '舌尖抵下齿，舌前部最低，嘴巴张大', word: 'cat', sound: 'cat' },
  { symbol: '/ɒ/', example: 'hot, dog', type: '短元音', description: '口张大，舌身后缩，双唇稍圆', word: 'hot', sound: 'hot' },
  { symbol: '/ʊ/', example: 'put, good', type: '短元音', description: '双唇收圆，稍突出，舌后部稍抬起', word: 'put', sound: 'put' },
  { symbol: '/ʌ/', example: 'cup, bus', type: '短元音', description: '舌后部稍抬起，嘴唇半开', word: 'cup', sound: 'cup' },
  { symbol: '/ə/', example: 'about, again', type: '短元音', description: '舌身平放，中部稍抬起，嘴唇自然', word: 'about', sound: 'about' },
  
  // ============ 双元音（8个）============
  { symbol: '/eɪ/', example: 'day, make', type: '双元音', description: '由 /e/ 滑向 /ɪ/，口型由半开到扁平', word: 'day', sound: 'day' },
  { symbol: '/aɪ/', example: 'my, time', type: '双元音', description: '由 /a/ 滑向 /ɪ/，口型由大到扁平', word: 'my', sound: 'my' },
  { symbol: '/ɔɪ/', example: 'boy, oil', type: '双元音', description: '由 /ɔ/ 滑向 /ɪ/，口型由圆到扁平', word: 'boy', sound: 'boy' },
  { symbol: '/aʊ/', example: 'how, out', type: '双元音', description: '由 /a/ 滑向 /ʊ/，口型由大到圆', word: 'how', sound: 'how' },
  { symbol: '/əʊ/', example: 'go, home', type: '双元音', description: '由 /ə/ 滑向 /ʊ/，口型由自然到圆', word: 'go', sound: 'go' },
  { symbol: '/ɪə/', example: 'ear, near', type: '双元音', description: '由 /ɪ/ 滑向 /ə/，口型由微开到自然', word: 'ear', sound: 'ear' },
  { symbol: '/eə/', example: 'air, care', type: '双元音', description: '由 /e/ 滑向 /ə/，口型由半开到自然', word: 'air', sound: 'air' },
  { symbol: '/ʊə/', example: 'tour, poor', type: '双元音', description: '由 /ʊ/ 滑向 /ə/，口型由圆到自然', word: 'tour', sound: 'tour' },
  
  // ============ 爆破音（6个）============
  { symbol: '/p/', example: 'pen, map', type: '爆破音', description: '双唇闭合，气流冲开，清辅音', word: 'pen', sound: 'pen' },
  { symbol: '/b/', example: 'bad, job', type: '爆破音', description: '双唇闭合，气流冲开，声带振动，浊辅音', word: 'bad', sound: 'bad' },
  { symbol: '/t/', example: 'tea, sit', type: '爆破音', description: '舌尖抵上齿龈，气流冲开，清辅音', word: 'tea', sound: 'tea' },
  { symbol: '/d/', example: 'day, dog', type: '爆破音', description: '舌尖抵上齿龈，气流冲开，声带振动，浊辅音', word: 'day', sound: 'day' },
  { symbol: '/k/', example: 'key, back', type: '爆破音', description: '舌后部抵软腭，气流冲开，清辅音', word: 'key', sound: 'key' },
  { symbol: '/g/', example: 'go, bag', type: '爆破音', description: '舌后部抵软腭，气流冲开，声带振动，浊辅音', word: 'go', sound: 'go' },
  
  // ============ 摩擦音（10个）============
  { symbol: '/f/', example: 'fat, off', type: '摩擦音', description: '上齿咬下唇，气流摩擦，清辅音', word: 'fat', sound: 'fat' },
  { symbol: '/v/', example: 'very, have', type: '摩擦音', description: '上齿咬下唇，气流摩擦，声带振动，浊辅音', word: 'very', sound: 'very' },
  { symbol: '/θ/', example: 'think, bath', type: '摩擦音', description: '舌尖抵上齿，气流摩擦，清辅音', word: 'think', sound: 'think' },
  { symbol: '/ð/', example: 'this, that', type: '摩擦音', description: '舌尖抵上齿，气流摩擦，声带振动，浊辅音', word: 'this', sound: 'this' },
  { symbol: '/s/', example: 'see, miss', type: '摩擦音', description: '舌尖接近上齿龈，气流摩擦，清辅音', word: 'see', sound: 'see' },
  { symbol: '/z/', example: 'zoo, has', type: '摩擦音', description: '舌尖接近上齿龈，气流摩擦，声带振动，浊辅音', word: 'zoo', sound: 'zoo' },
  { symbol: '/ʃ/', example: 'she, fish', type: '摩擦音', description: '舌前部接近硬腭，气流摩擦，清辅音', word: 'she', sound: 'she' },
  { symbol: '/ʒ/', example: 'measure', type: '摩擦音', description: '舌前部接近硬腭，气流摩擦，声带振动，浊辅音', word: 'measure', sound: 'measure' },
  { symbol: '/h/', example: 'hat, hot', type: '摩擦音', description: '气流从声门摩擦而出，清辅音', word: 'hat', sound: 'hat' },
  { symbol: '/r/', example: 'red, car', type: '摩擦音', description: '舌尖向上齿龈后部卷起，浊辅音', word: 'red', sound: 'red' },
  
  // ============ 破擦音（6个）============
  { symbol: '/tʃ/', example: 'cheese, catch', type: '破擦音', description: '舌尖抵上齿龈后部，气流冲开摩擦，清辅音', word: 'cheese', sound: 'cheese' },
  { symbol: '/dʒ/', example: 'job, juice', type: '破擦音', description: '舌尖抵上齿龈后部，气流冲开摩擦，声带振动，浊辅音', word: 'job', sound: 'job' },
  { symbol: '/tr/', example: 'tree, try', type: '破擦音', description: '舌尖抵上齿龈后部卷起，气流冲开，清辅音', word: 'tree', sound: 'tree' },
  { symbol: '/dr/', example: 'drink, drive', type: '破擦音', description: '舌尖抵上齿龈后部卷起，气流冲开，声带振动，浊辅音', word: 'drink', sound: 'drink' },
  { symbol: '/ts/', example: 'cats, hats', type: '破擦音', description: '舌尖抵上齿龈，气流冲开摩擦，清辅音', word: 'cats', sound: 'cats' },
  { symbol: '/dz/', example: 'beds, hands', type: '破擦音', description: '舌尖抵上齿龈，气流冲开摩擦，声带振动，浊辅音', word: 'beds', sound: 'beds' },
  
  // ============ 鼻音（3个）============
  { symbol: '/m/', example: 'man, map', type: '鼻音', description: '双唇闭合，气流从鼻腔出，浊辅音', word: 'man', sound: 'man' },
  { symbol: '/n/', example: 'no, ten', type: '鼻音', description: '舌尖抵上齿龈，气流从鼻腔出，浊辅音', word: 'no', sound: 'no' },
  { symbol: '/ŋ/', example: 'sing, long', type: '鼻音', description: '舌后部抵软腭，气流从鼻腔出，浊辅音', word: 'sing', sound: 'sing' },
  
  // ============ 边音（1个）============
  { symbol: '/l/', example: 'let, all', type: '边音', description: '舌尖抵上齿龈，气流从舌侧出，浊辅音', word: 'let', sound: 'let' },
  
  // ============ 半元音（2个）============
  { symbol: '/w/', example: 'wet, how', type: '半元音', description: '双唇收圆，突出，舌后部抬起，浊辅音', word: 'wet', sound: 'wet' },
  { symbol: '/j/', example: 'yes, you', type: '半元音', description: '舌前部向硬腭抬起，浊辅音', word: 'yes', sound: 'yes' },
];

// 音标分类统计
const phoneticTypes = [
  { type: '长元音', count: 5, color: '#1890ff' },
  { type: '短元音', count: 7, color: '#2f54eb' },
  { type: '双元音', count: 8, color: '#722ed1' },
  { type: '爆破音', count: 6, color: '#eb2f96' },
  { type: '摩擦音', count: 10, color: '#fa8c16' },
  { type: '破擦音', count: 6, color: '#13c2c2' },
  { type: '鼻音', count: 3, color: '#52c41a' },
  { type: '边音', count: 1, color: '#2f54eb' },
  { type: '半元音', count: 2, color: '#f5222d' },
];

// 练习题
const practiceQuestions = [
  { question: '/iː/ 对应的单词是？', options: ['see', 'sit', 'bed', 'cat'], answer: 0 },
  { question: '/æ/ 对应的单词是？', options: ['car', 'cat', 'cup', 'bird'], answer: 1 },
  { question: '/θ/ 对应的单词是？', options: ['this', 'think', 'she', 'zoo'], answer: 1 },
  { question: '/ʃ/ 对应的单词是？', options: ['see', 'zoo', 'she', 'think'], answer: 2 },
  { question: '/ŋ/ 对应的单词是？', options: ['no', 'sing', 'let', 'red'], answer: 1 },
  { question: '/aɪ/ 对应的单词是？', options: ['day', 'my', 'boy', 'go'], answer: 1 },
  { question: '/əʊ/ 对应的单词是？', options: ['how', 'go', 'day', 'ear'], answer: 1 },
  { question: '/ð/ 对应的单词是？', options: ['think', 'this', 'she', 'see'], answer: 1 },
  { question: '/tʃ/ 对应的单词是？', options: ['cat', 'cheese', 'ship', 'job'], answer: 1 },
  { question: '/dr/ 对应的单词是？', options: ['tree', 'drink', 'cats', 'beds'], answer: 1 },
];

// 全局音频对象
let currentAudio: HTMLAudioElement | null = null;

const playSound = (text: string, onEnd?: () => void) => {
  if (currentAudio) {
    currentAudio.pause();
    currentAudio.src = '';
    currentAudio = null;
  }
  const audio = new Audio();
  audio.src = `https://dict.youdao.com/dictvoice?audio=${encodeURIComponent(text)}&type=1`;
  currentAudio = audio;
  audio.onended = () => { currentAudio = null; onEnd?.(); };
  audio.onerror = () => { currentAudio = null; onEnd?.(); };
  audio.play().catch(() => { currentAudio = null; onEnd?.(); });
};

const stopSound = () => {
  if (currentAudio) { currentAudio.pause(); currentAudio.src = ''; currentAudio = null; }
};

const PhoneticLearningPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>('learn');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [score, setScore] = useState(0);
  const [playingId, setPlayingId] = useState<string | null>(null);

  const filteredPhonetics = selectedType === 'all' 
    ? phonetics 
    : phonetics.filter(p => p.type === selectedType);

  const handlePlay = (text: string, id: string) => {
    if (playingId === id) { stopSound(); setPlayingId(null); }
    else { setPlayingId(id); playSound(text, () => setPlayingId(null)); }
  };

  useEffect(() => { return () => { stopSound(); }; }, []);

  const handleAnswer = (index: number) => {
    if (showResult) return;
    setSelectedAnswer(index);
  };

  const handleSubmit = () => {
    if (selectedAnswer === null) { message.warning('请选择一个答案'); return; }
    setShowResult(true);
    if (selectedAnswer === practiceQuestions[currentQuestion].answer) {
      setScore(score + 1);
      message.success('回答正确！');
    } else { message.error('回答错误！'); }
  };

  const handleNext = () => {
    if (currentQuestion < practiceQuestions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
      setSelectedAnswer(null);
      setShowResult(false);
    } else {
      message.success(`练习完成！得分：${score}/${practiceQuestions.length}`);
      setCurrentQuestion(0); setSelectedAnswer(null); setShowResult(false); setScore(0);
    }
  };

  // 认识音标 Tab
  const learnTab = (
    <div>
      {/* 音标统计 */}
      <Card style={{ marginBottom: 16 }}>
        <h3 style={{ marginBottom: 12 }}>📊 音标统计（共 48 个）</h3>
        <div style={{ marginBottom: 8 }}>
          <Tag color="#1890ff" style={{ fontSize: 14, padding: '4px 12px' }}>元音: 20个</Tag>
          <Tag color="#eb2f96" style={{ fontSize: 14, padding: '4px 12px' }}>辅音: 28个</Tag>
        </div>
        <Space wrap>
          {phoneticTypes.map(pt => (
            <Tag key={pt.type} color={pt.color} style={{ fontSize: 13, padding: '2px 10px' }}>
              {pt.type}: {pt.count}
            </Tag>
          ))}
        </Space>
      </Card>

      {/* 筛选按钮 */}
      <div style={{ marginBottom: 16 }}>
        <Space wrap>
          <Button type={selectedType === 'all' ? 'primary' : 'default'} onClick={() => setSelectedType('all')}>全部 (48)</Button>
          <Button type={selectedType === '长元音' ? 'primary' : 'default'} onClick={() => setSelectedType('长元音')}>长元音 (5)</Button>
          <Button type={selectedType === '短元音' ? 'primary' : 'default'} onClick={() => setSelectedType('短元音')}>短元音 (7)</Button>
          <Button type={selectedType === '双元音' ? 'primary' : 'default'} onClick={() => setSelectedType('双元音')}>双元音 (8)</Button>
          <Button type={selectedType === '爆破音' ? 'primary' : 'default'} onClick={() => setSelectedType('爆破音')}>爆破音 (6)</Button>
          <Button type={selectedType === '摩擦音' ? 'primary' : 'default'} onClick={() => setSelectedType('摩擦音')}>摩擦音 (10)</Button>
          <Button type={selectedType === '破擦音' ? 'primary' : 'default'} onClick={() => setSelectedType('破擦音')}>破擦音 (6)</Button>
          <Button type={selectedType === '鼻音' ? 'primary' : 'default'} onClick={() => setSelectedType('鼻音')}>鼻音 (3)</Button>
          <Button type={selectedType === '边音' ? 'primary' : 'default'} onClick={() => setSelectedType('边音')}>边音 (1)</Button>
          <Button type={selectedType === '半元音' ? 'primary' : 'default'} onClick={() => setSelectedType('半元音')}>半元音 (2)</Button>
        </Space>
      </div>

      {/* 音标卡片 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
        {filteredPhonetics.map((phonetic, index) => {
          const typeInfo = phoneticTypes.find(pt => pt.type === phonetic.type);
          const soundId = `sound-${index}`;
          return (
            <Card key={index} size="small" hoverable>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 32, fontWeight: 'bold', color: '#1890ff', marginBottom: 8 }}>
                    {phonetic.symbol}
                  </div>
                  <Tag color={typeInfo?.color || '#999'}>{phonetic.type}</Tag>
                  <div style={{ marginTop: 8, color: '#333', fontSize: 14 }}>
                    <strong>例词:</strong> {phonetic.example}
                  </div>
                  <div style={{ marginTop: 4, color: '#666', fontSize: 13 }}>
                    {phonetic.description}
                  </div>
                </div>
                <Button 
                  type={playingId === soundId ? 'primary' : 'default'}
                  icon={playingId === soundId ? <PauseCircleOutlined /> : <SoundOutlined />} 
                  onClick={() => handlePlay(phonetic.sound, soundId)}
                  style={{ minWidth: 60 }}
                  title={`点击听发音: ${phonetic.sound}`}
                >
                  发音
                </Button>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );

  // 音标练习 Tab
  const practiceTab = (
    <div>
      <Card style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>当前进度: {currentQuestion + 1} / {practiceQuestions.length}</span>
          <span>得分: {score}</span>
        </div>
      </Card>

      <Card>
        <h3 style={{ marginBottom: 24 }}>{practiceQuestions[currentQuestion].question}</h3>
        <Radio.Group value={selectedAnswer} onChange={(e) => handleAnswer(e.target.value)} style={{ width: '100%' }}>
          <Space direction="vertical" style={{ width: '100%' }}>
            {practiceQuestions[currentQuestion].options.map((option, index) => (
              <Radio key={index} value={index} style={{
                display: 'block', padding: '12px 16px', width: '100%',
                border: `1px solid ${showResult ? index === practiceQuestions[currentQuestion].answer ? '#52c41a' : index === selectedAnswer ? '#ff4d4f' : '#d9d9d9' : selectedAnswer === index ? '#1890ff' : '#d9d9d9'}`,
                borderRadius: 8,
                background: showResult ? index === practiceQuestions[currentQuestion].answer ? '#f6ffed' : index === selectedAnswer ? '#fff1f0' : '#fff' : selectedAnswer === index ? '#e6f7ff' : '#fff',
                cursor: showResult ? 'default' : 'pointer',
              }}>
                <Space>
                  {showResult && index === practiceQuestions[currentQuestion].answer && <CheckCircleOutlined style={{ color: '#52c41a' }} />}
                  {showResult && index === selectedAnswer && index !== practiceQuestions[currentQuestion].answer && <CloseCircleOutlined style={{ color: '#ff4d4f' }} />}
                  {option}
                  {!showResult && (
                    <Button type="text" size="small" icon={<SoundOutlined />} onClick={(e) => { e.stopPropagation(); playSound(option); }} style={{ marginLeft: 8 }} />
                  )}
                </Space>
              </Radio>
            ))}
          </Space>
        </Radio.Group>
        <div style={{ marginTop: 24, textAlign: 'center' }}>
          {!showResult ? (
            <Button type="primary" size="large" onClick={handleSubmit}>提交答案</Button>
          ) : (
            <Button type="primary" size="large" onClick={handleNext}>
              {currentQuestion < practiceQuestions.length - 1 ? '下一题' : '重新开始'}
            </Button>
          )}
        </div>
      </Card>
    </div>
  );

  const tabItems = [
    { key: 'learn', label: '📖 认识音标', children: learnTab },
    { key: 'practice', label: '✏️ 音标练习', children: practiceTab },
  ];

  return (
    <MainLayout>
      <div style={{ padding: 24 }}>
        <h2 style={{ marginBottom: 24 }}>🔤 音标学习</h2>
        <Tabs activeKey={activeTab} onChange={setActiveTab} items={tabItems} size="large" />
      </div>
    </MainLayout>
  );
};

export default PhoneticLearningPage;
