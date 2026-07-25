import React, { useState } from 'react';
import { Card, Tabs, Button, Space, Radio, message, Tag } from 'antd';
import { SoundOutlined, CheckCircleOutlined, CloseCircleOutlined } from '@ant-design/icons';
import MainLayout from '../../components/layout/MainLayout';

// 英标数据
const phonetics = [
  // 元音
  { symbol: '/iː/', example: 'see, tea', type: '元音', description: '长元音，舌尖抵下齿，舌前部向硬腭抬起', speakText: 'ee' },
  { symbol: '/ɪ/', example: 'sit, big', type: '元音', description: '短元音，舌尖抵下齿，舌前部稍抬起', speakText: 'i' },
  { symbol: '/e/', example: 'bed, red', type: '元音', description: '短元音，舌尖抵下齿，舌前部稍抬起', speakText: 'e' },
  { symbol: '/æ/', example: 'cat, bad', type: '元音', description: '短元音，舌尖抵下齿，舌前部最低', speakText: 'a' },
  { symbol: '/ɑː/', example: 'car, father', type: '元音', description: '长元音，口张大，舌身平放后缩', speakText: 'ah' },
  { symbol: '/ɒ/', example: 'hot, dog', type: '元音', description: '短元音，口张大，舌身后缩', speakText: 'o' },
  { symbol: '/ɔː/', example: 'all, four', type: '元音', description: '长元音，双唇收圆并突出', speakText: 'aw' },
  { symbol: '/ʊ/', example: 'put, good', type: '元音', description: '短元音，双唇收圆，稍突出', speakText: 'u' },
  { symbol: '/uː/', example: 'too, blue', type: '元音', description: '长元音，双唇收圆，突出', speakText: 'oo' },
  { symbol: '/ʌ/', example: 'cup, bus', type: '元音', description: '短元音，舌后部稍抬起', speakText: 'uh' },
  { symbol: '/ɜː/', example: 'bird, her', type: '元音', description: '长元音，舌身平放，中部稍抬起', speakText: 'er' },
  { symbol: '/ə/', example: 'about, again', type: '元音', description: '短元音，舌身平放，中部稍抬起', speakText: 'uh' },
  // 双元音
  { symbol: '/eɪ/', example: 'day, make', type: '双元音', description: '由 /e/ 滑向 /ɪ/', speakText: 'ay' },
  { symbol: '/aɪ/', example: 'my, time', type: '双元音', description: '由 /a/ 滑向 /ɪ/', speakText: 'eye' },
  { symbol: '/ɔɪ/', example: 'boy, oil', type: '双元音', description: '由 /ɔ/ 滑向 /ɪ/', speakText: 'oy' },
  { symbol: '/aʊ/', example: 'how, out', type: '双元音', description: '由 /a/ 滑向 /ʊ/', speakText: 'ow' },
  { symbol: '/əʊ/', example: 'go, home', type: '双元音', description: '由 /ə/ 滑向 /ʊ/', speakText: 'oh' },
  { symbol: '/ɪə/', example: 'ear, near', type: '双元音', description: '由 /ɪ/ 滑向 /ə/', speakText: 'eer' },
  { symbol: '/eə/', example: 'air, care', type: '双元音', description: '由 /e/ 滑向 /ə/', speakText: 'air' },
  { symbol: '/ʊə/', example: 'tour, poor', type: '双元音', description: '由 /ʊ/ 滑向 /ə/', speakText: 'oor' },
  // 辅音
  { symbol: '/p/', example: 'pen, map', type: '辅音', description: '双唇闭合，气流冲开', speakText: 'p' },
  { symbol: '/b/', example: 'bad, job', type: '辅音', description: '双唇闭合，气流冲开，声带振动', speakText: 'b' },
  { symbol: '/t/', example: 'tea, sit', type: '辅音', description: '舌尖抵上齿龈，气流冲开', speakText: 't' },
  { symbol: '/d/', example: 'day, dog', type: '辅音', description: '舌尖抵上齿龈，气流冲开，声带振动', speakText: 'd' },
  { symbol: '/k/', example: 'key, back', type: '辅音', description: '舌后部抵软腭，气流冲开', speakText: 'k' },
  { symbol: '/g/', example: 'go, bag', type: '辅音', description: '舌后部抵软腭，气流冲开，声带振动', speakText: 'g' },
  { symbol: '/f/', example: 'fat, off', type: '辅音', description: '上齿咬下唇，气流摩擦', speakText: 'f' },
  { symbol: '/v/', example: 'very, have', type: '辅音', description: '上齿咬下唇，气流摩擦，声带振动', speakText: 'v' },
  { symbol: '/θ/', example: 'think, bath', type: '辅音', description: '舌尖抵上齿，气流摩擦', speakText: 'th' },
  { symbol: '/ð/', example: 'this, that', type: '辅音', description: '舌尖抵上齿，气流摩擦，声带振动', speakText: 'the' },
  { symbol: '/s/', example: 'see, miss', type: '辅音', description: '舌尖接近上齿龈，气流摩擦', speakText: 's' },
  { symbol: '/z/', example: 'zoo, has', type: '辅音', description: '舌尖接近上齿龈，气流摩擦，声带振动', speakText: 'z' },
  { symbol: '/ʃ/', example: 'she, fish', type: '辅音', description: '舌前部接近硬腭，气流摩擦', speakText: 'sh' },
  { symbol: '/ʒ/', example: 'measure', type: '辅音', description: '舌前部接近硬腭，气流摩擦，声带振动', speakText: 'zh' },
  { symbol: '/h/', example: 'hat, hot', type: '辅音', description: '气流从声门摩擦而出', speakText: 'h' },
  { symbol: '/m/', example: 'man, map', type: '辅音', description: '双唇闭合，气流从鼻腔出', speakText: 'm' },
  { symbol: '/n/', example: 'no, ten', type: '辅音', description: '舌尖抵上齿龈，气流从鼻腔出', speakText: 'n' },
  { symbol: '/ŋ/', example: 'sing, long', type: '辅音', description: '舌后部抵软腭，气流从鼻腔出', speakText: 'ng' },
  { symbol: '/l/', example: 'let, all', type: '辅音', description: '舌尖抵上齿龈，气流从舌侧出', speakText: 'l' },
  { symbol: '/r/', example: 'red, car', type: '辅音', description: '舌尖向上齿龈后部卷起', speakText: 'r' },
  { symbol: '/j/', example: 'yes, you', type: '辅音', description: '舌前部向硬腭抬起', speakText: 'y' },
  { symbol: '/w/', example: 'wet, how', type: '辅音', description: '双唇收圆，突出', speakText: 'w' },
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
  { question: '/ʒ/ 对应的单词是？', options: ['zoo', 'she', 'measure', 'see'], answer: 2 },
  { question: '/ʊə/ 对应的单词是？', options: ['ear', 'air', 'tour', 'day'], answer: 2 },
];

// 播放发音函数
const speakText = (text: string) => {
  if ('speechSynthesis' in window) {
    // 停止之前的播放
    window.speechSynthesis.cancel();
    
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-US';
    utterance.rate = 0.8; // 语速稍慢
    utterance.pitch = 1;
    window.speechSynthesis.speak(utterance);
  } else {
    message.warning('您的浏览器不支持语音合成');
  }
};

const PhoneticLearningPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>('learn');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [score, setScore] = useState(0);

  // 过滤英标
  const filteredPhonetics = selectedType === 'all' 
    ? phonetics 
    : phonetics.filter(p => p.type === selectedType);

  // 选择答案
  const handleAnswer = (index: number) => {
    if (showResult) return;
    setSelectedAnswer(index);
  };

  // 提交答案
  const handleSubmit = () => {
    if (selectedAnswer === null) {
      message.warning('请选择一个答案');
      return;
    }
    setShowResult(true);
    if (selectedAnswer === practiceQuestions[currentQuestion].answer) {
      setScore(score + 1);
      message.success('回答正确！');
    } else {
      message.error('回答错误！');
    }
  };

  // 下一题
  const handleNext = () => {
    if (currentQuestion < practiceQuestions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
      setSelectedAnswer(null);
      setShowResult(false);
    } else {
      message.success(`练习完成！得分：${score}/${practiceQuestions.length}`);
      setCurrentQuestion(0);
      setSelectedAnswer(null);
      setShowResult(false);
      setScore(0);
    }
  };

  // 认识英标 Tab
  const learnTab = (
    <div>
      <div style={{ marginBottom: 16 }}>
        <Space>
          <Button type={selectedType === 'all' ? 'primary' : 'default'} onClick={() => setSelectedType('all')}>全部</Button>
          <Button type={selectedType === '元音' ? 'primary' : 'default'} onClick={() => setSelectedType('元音')}>元音</Button>
          <Button type={selectedType === '双元音' ? 'primary' : 'default'} onClick={() => setSelectedType('双元音')}>双元音</Button>
          <Button type={selectedType === '辅音' ? 'primary' : 'default'} onClick={() => setSelectedType('辅音')}>辅音</Button>
        </Space>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
        {filteredPhonetics.map((phonetic, index) => (
          <Card key={index} size="small" hoverable>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div style={{ fontSize: 28, fontWeight: 'bold', color: '#1890ff', marginBottom: 8 }}>
                  {phonetic.symbol}
                </div>
                <Tag color={
                  phonetic.type === '元音' ? 'blue' : 
                  phonetic.type === '双元音' ? 'purple' : 'green'
                }>
                  {phonetic.type}
                </Tag>
                <div style={{ marginTop: 8, color: '#666', fontSize: 14 }}>
                  例词: {phonetic.example}
                </div>
                <div style={{ marginTop: 4, color: '#999', fontSize: 12 }}>
                  {phonetic.description}
                </div>
              </div>
              <Button 
                type="text" 
                icon={<SoundOutlined />} 
                onClick={() => speakText(phonetic.speakText)}
                style={{ color: '#1890ff' }}
                title="点击播放发音"
              />
            </div>
          </Card>
        ))}
      </div>
    </div>
  );

  // 英标练习 Tab
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
        
        <Radio.Group 
          value={selectedAnswer} 
          onChange={(e) => handleAnswer(e.target.value)}
          style={{ width: '100%' }}
        >
          <Space direction="vertical" style={{ width: '100%' }}>
            {practiceQuestions[currentQuestion].options.map((option, index) => (
              <Radio 
                key={index} 
                value={index}
                style={{
                  display: 'block',
                  padding: '12px 16px',
                  border: `1px solid ${
                    showResult 
                      ? index === practiceQuestions[currentQuestion].answer 
                        ? '#52c41a' 
                        : index === selectedAnswer 
                          ? '#ff4d4f' 
                          : '#d9d9d9'
                      : selectedAnswer === index 
                        ? '#1890ff' 
                        : '#d9d9d9'
                  }`,
                  borderRadius: 8,
                  background: showResult 
                    ? index === practiceQuestions[currentQuestion].answer 
                      ? '#f6ffed' 
                      : index === selectedAnswer 
                        ? '#fff1f0' 
                        : '#fff'
                    : selectedAnswer === index 
                      ? '#e6f7ff' 
                      : '#fff',
                  width: '100%',
                }}
              >
                <Space>
                  {showResult && index === practiceQuestions[currentQuestion].answer && (
                    <CheckCircleOutlined style={{ color: '#52c41a' }} />
                  )}
                  {showResult && index === selectedAnswer && index !== practiceQuestions[currentQuestion].answer && (
                    <CloseCircleOutlined style={{ color: '#ff4d4f' }} />
                  )}
                  {option}
                </Space>
              </Radio>
            ))}
          </Space>
        </Radio.Group>

        <div style={{ marginTop: 24, textAlign: 'center' }}>
          {!showResult ? (
            <Button type="primary" size="large" onClick={handleSubmit}>
              提交答案
            </Button>
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
    {
      key: 'learn',
      label: '📖 认识英标',
      children: learnTab,
    },
    {
      key: 'practice',
      label: '✏️ 英标练习',
      children: practiceTab,
    },
  ];

  return (
    <MainLayout>
      <div style={{ padding: 24 }}>
        <h2 style={{ marginBottom: 24 }}>🔤 英标学习</h2>
        
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={tabItems}
          size="large"
        />
      </div>
    </MainLayout>
  );
};

export default PhoneticLearningPage;
