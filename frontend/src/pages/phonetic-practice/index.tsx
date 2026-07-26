import React, { useState } from 'react';
import { Card, Tabs, Button, Space, Radio, message, Select, Modal } from 'antd';
import { SoundOutlined, CheckCircleOutlined, CloseCircleOutlined, DownloadOutlined, EyeOutlined } from '@ant-design/icons';
import MainLayout from '../../components/layout/MainLayout';

// 年级词汇数据
const gradeVocabulary: Record<number, { word: string; phonetic: string }[]> = {
  1: [
    { word: 'cat', phonetic: '/kæt/' }, { word: 'dog', phonetic: '/dɒɡ/' }, { word: 'bed', phonetic: '/bed/' },
    { word: 'red', phonetic: '/red/' }, { word: 'big', phonetic: '/bɪɡ/' }, { word: 'sit', phonetic: '/sɪt/' },
    { word: 'pen', phonetic: '/pen/' }, { word: 'cup', phonetic: '/kʌp/' }, { word: 'map', phonetic: '/mæp/' },
    { word: 'bag', phonetic: '/bæɡ/' }, { word: 'hat', phonetic: '/hæt/' }, { word: 'run', phonetic: '/rʌn/' },
    { word: 'sun', phonetic: '/sʌn/' }, { word: 'fun', phonetic: '/fʌn/' }, { word: 'hot', phonetic: '/hɒt/' },
  ],
  2: [
    { word: 'apple', phonetic: '/ˈæpl/' }, { word: 'book', phonetic: '/bʊk/' }, { word: 'fish', phonetic: '/fɪʃ/' },
    { word: 'bird', phonetic: '/bɜːd/' }, { word: 'tree', phonetic: '/triː/' }, { word: 'cake', phonetic: '/keɪk/' },
    { word: 'like', phonetic: '/laɪk/' }, { word: 'name', phonetic: '/neɪm/' }, { word: 'time', phonetic: '/taɪm/' },
    { word: 'home', phonetic: '/həʊm/' }, { word: 'nice', phonetic: '/naɪs/' }, { word: 'five', phonetic: '/faɪv/' },
    { word: 'nine', phonetic: '/naɪn/' }, { word: 'face', phonetic: '/feɪs/' }, { word: 'rice', phonetic: '/raɪs/' },
  ],
  3: [
    { word: 'student', phonetic: '/ˈstjuːdnt/' }, { word: 'teacher', phonetic: '/ˈtiːtʃə/' }, { word: 'school', phonetic: '/skuːl/' },
    { word: 'friend', phonetic: '/frend/' }, { word: 'brother', phonetic: '/ˈbrʌðə/' }, { word: 'sister', phonetic: '/ˈsɪstə/' },
    { word: 'mother', phonetic: '/ˈmʌðə/' }, { word: 'father', phonetic: '/ˈfɑːðə/' }, { word: 'morning', phonetic: '/ˈmɔːnɪŋ/' },
    { word: 'evening', phonetic: '/ˈiːvnɪŋ/' }, { word: 'window', phonetic: '/ˈwɪndəʊ/' }, { word: 'yellow', phonetic: '/ˈjeləʊ/' },
    { word: 'animal', phonetic: '/ˈænɪml/' }, { word: 'flower', phonetic: '/ˈflaʊə/' }, { word: 'water', phonetic: '/ˈwɔːtə/' },
  ],
  4: [
    { word: 'beautiful', phonetic: '/ˈbjuːtɪfl/' }, { word: 'elephant', phonetic: '/ˈelɪfənt/' }, { word: 'important', phonetic: '/ɪmˈpɔːtnt/' },
    { word: 'different', phonetic: '/ˈdɪfrənt/' }, { word: 'together', phonetic: '/təˈɡeðə/' }, { word: 'remember', phonetic: '/rɪˈmembə/' },
    { word: 'dangerous', phonetic: '/ˈdeɪndʒərəs/' }, { word: 'mountain', phonetic: '/ˈmaʊntɪn/' }, { word: 'question', phonetic: '/ˈkwestʃən/' },
    { word: 'country', phonetic: '/ˈkʌntri/' }, { word: 'hundred', phonetic: '/ˈhʌndrəd/' }, { word: 'holiday', phonetic: '/ˈhɒlədeɪ/' },
    { word: 'picture', phonetic: '/ˈpɪktʃə/' }, { word: 'weather', phonetic: '/ˈweðə/' }, { word: 'medicine', phonetic: '/ˈmedsn/' },
  ],
  5: [
    { word: 'temperature', phonetic: '/ˈtemprətʃə/' }, { word: 'experience', phonetic: '/ɪkˈspɪəriəns/' }, { word: 'environment', phonetic: '/ɪnˈvaɪrənmənt/' },
    { word: 'experiment', phonetic: '/ɪkˈsperɪmənt/' }, { word: 'education', phonetic: '/ˌedʒuˈkeɪʃn/' }, { word: 'information', phonetic: '/ˌɪnfəˈmeɪʃn/' },
    { word: 'communication', phonetic: '/kəˌmjuːnɪˈkeɪʃn/' }, { word: 'opportunity', phonetic: '/ˌɒpəˈtjuːnɪti/' }, { word: 'independence', phonetic: '/ˌɪndɪˈpendəns/' },
    { word: 'responsibility', phonetic: '/rɪˌspɒnsəˈbɪlɪti/' }, { word: 'technology', phonetic: '/tekˈnɒlədʒi/' }, { word: 'dictionary', phonetic: '/ˈdɪkʃənri/' },
    { word: 'pronunciation', phonetic: '/prəˌnʌnsiˈeɪʃn/' }, { word: 'vocabulary', phonetic: '/vəˈkæbjələri/' }, { word: 'imagination', phonetic: '/ɪˌmædʒɪˈneɪʃn/' },
  ],
};

// 随机打乱数组
const shuffle = <T,>(arr: T[]): T[] => {
  const shuffled = [...arr];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

// 生成随机题目（30题）
const generateQuestions = (grade: number) => {
  const vocabulary = gradeVocabulary[grade] || gradeVocabulary[3];
  const questions: { question: string; options: string[]; answer: number }[] = [];
  
  // 题型1：根据音标选单词（8题）
  for (let i = 0; i < 8; i++) {
    const correct = vocabulary[Math.floor(Math.random() * vocabulary.length)];
    const wrongOptions = shuffle(vocabulary.filter(v => v.word !== correct.word)).slice(0, 3).map(v => v.word);
    const options = shuffle([...wrongOptions, correct.word]);
    questions.push({
      question: `${correct.phonetic} 对应的单词是？`,
      options,
      answer: options.indexOf(correct.word),
    });
  }
  
  // 题型2：根据单词选音标（8题）
  for (let i = 0; i < 8; i++) {
    const correct = vocabulary[Math.floor(Math.random() * vocabulary.length)];
    const wrongOptions = shuffle(vocabulary.filter(v => v.phonetic !== correct.phonetic)).slice(0, 3).map(v => v.phonetic);
    const options = shuffle([...wrongOptions, correct.phonetic]);
    questions.push({
      question: `"${correct.word}" 的音标是？`,
      options,
      answer: options.indexOf(correct.phonetic),
    });
  }
  
  // 题型3：选择正确的音标（7题）
  for (let i = 0; i < 7; i++) {
    const correct = vocabulary[Math.floor(Math.random() * vocabulary.length)];
    const wrongPhonetic = shuffle(vocabulary.filter(v => v.phonetic !== correct.phonetic))[0]?.phonetic || '/xxx/';
    const options = shuffle([correct.phonetic, wrongPhonetic]);
    questions.push({
      question: `${correct.word} 的正确音标是？`,
      options,
      answer: options.indexOf(correct.phonetic),
    });
  }
  
  // 题型4：找出划线部分发音不同的单词（4题）
  const differentSoundSets = [
    { words: ['cat', 'hat', 'car', 'map'], answer: 2 },
    { words: ['bed', 'red', 'he', 'pen'], answer: 2 },
    { words: ['sit', 'big', 'like', 'hit'], answer: 2 },
    { words: ['hot', 'dog', 'go', 'not'], answer: 2 },
    { words: ['cup', 'bus', 'use', 'but'], answer: 2 },
    { words: ['how', 'now', 'go', 'cow'], answer: 2 },
    { words: ['tea', 'read', 'bread', 'eat'], answer: 2 },
    { words: ['food', 'moon', 'book', 'too'], answer: 2 },
    { words: ['think', 'this', 'three', 'thank'], answer: 1 },
    { words: ['see', 'sit', 'she', 'sun'], answer: 2 },
  ];
  
  shuffle(differentSoundSets).slice(0, 4).forEach(set => {
    questions.push({
      question: `找出划线部分发音不同的单词`,
      options: set.words,
      answer: set.answer,
    });
  });
  
  // 题型5：判断发音是否相同（3题）
  const soundPairs = [
    { w1: 'cat', w2: 'hat', same: true },
    { w1: 'dog', w2: 'hot', same: true },
    { w1: 'see', w2: 'tea', same: true },
    { w1: 'cat', w2: 'car', same: false },
    { w1: 'bed', w2: 'he', same: false },
    { w1: 'sit', w2: 'like', same: false },
    { w1: 'hot', w2: 'go', same: false },
    { w1: 'cup', w2: 'use', same: false },
  ];
  
  shuffle(soundPairs).slice(0, 3).forEach(pair => {
    questions.push({
      question: `"${pair.w1}" 和 "${pair.w2}" 中元音发音相同吗？`,
      options: ['相同', '不同'],
      answer: pair.same ? 0 : 1,
    });
  });
  
  return shuffle(questions).slice(0, 30);
};

// 试卷生成
const generateExamPaper = (grade: number) => {
  const vocabulary = gradeVocabulary[grade] || gradeVocabulary[3];
  const gradeNames: Record<number, string> = { 1: '一年级', 2: '二年级', 3: '三年级', 4: '四年级', 5: '五年级' };
  
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>${gradeNames[grade]}英语音标试卷</title>
  <style>
    body { font-family: 'SimSun', serif; padding: 40px; line-height: 2; }
    h1 { text-align: center; border-bottom: 2px solid #333; padding-bottom: 10px; }
    .info { display: flex; justify-content: space-between; margin: 20px 0; }
    .section { margin: 30px 0; }
    .section h2 { border-bottom: 1px solid #666; padding-bottom: 5px; }
    .question { margin: 15px 0; }
    .blank { display: inline-block; width: 150px; border-bottom: 1px solid #333; }
    .answer-section { margin-top: 50px; border-top: 2px solid #333; padding-top: 20px; page-break-before: always; }
    .two-col { display: flex; gap: 40px; }
    .two-col > div { flex: 1; }
  </style>
</head>
<body>
  <h1>${gradeNames[grade]}英语音标练习试卷</h1>
  <div class="info">
    <span>姓名：_____________</span>
    <span>班级：_____________</span>
    <span>日期：_____________</span>
    <span>得分：_____________</span>
  </div>
  
  <div class="section">
    <h2>一、看音标，写单词（每题2分，共20分）</h2>
    ${shuffle(vocabulary).slice(0, 10).map((v, i) => `<div class="question">${i + 1}. ${v.phonetic} = <span class="blank"></span></div>`).join('\n    ')}
  </div>
  
  <div class="section">
    <h2>二、选择正确的音标（每题2分，共20分）</h2>
    ${shuffle(vocabulary).slice(0, 10).map((v, i) => {
      const wrong = shuffle(vocabulary.filter(w => w.phonetic !== v.phonetic))[0]?.phonetic || '/xxx/';
      const opts = shuffle([v.phonetic, wrong]);
      return `<div class="question">${i + 1}. ${v.word} ( ) A. ${opts[0]}  B. ${opts[1]}</div>`;
    }).join('\n    ')}
  </div>
  
  <div class="section">
    <h2>三、找出划线部分发音不同的单词（每题2分，共20分）</h2>
    <div class="two-col">
      <div>
        <div class="question">1. a. c<u>a</u>t  b. h<u>a</u>t  c. c<u>a</u>r  d. m<u>a</u>p ( )</div>
        <div class="question">2. a. b<u>e</u>d  b. r<u>e</u>d  c. h<u>e</u>  d. p<u>e</u>n ( )</div>
        <div class="question">3. a. s<u>i</u>t  b. b<u>i</u>g  c. l<u>i</u>ke  d. h<u>i</u>t ( )</div>
        <div class="question">4. a. h<u>o</u>t  b. d<u>o</u>g  c. g<u>o</u>  d. n<u>o</u>t ( )</div>
        <div class="question">5. a. c<u>u</u>p  b. b<u>u</u>s  c. <u>u</u>se  d. b<u>u</u>t ( )</div>
      </div>
      <div>
        <div class="question">6. a. h<u>ow</u>  b. n<u>ow</u>  c. g<u>o</u>  d. c<u>ow</u> ( )</div>
        <div class="question">7. a. t<u>ea</u>  b. r<u>ea</u>d  c. br<u>ea</u>d  d. e<u>a</u>t ( )</div>
        <div class="question">8. a. f<u>oo</u>d  b. m<u>oo</u>n  c. b<u>oo</u>k  d. t<u>oo</u> ( )</div>
        <div class="question">9. a. <u>th</u>ink  b. <u>th</u>is  c. <u>th</u>ree  d. <u>th</u>ank ( )</div>
        <div class="question">10. a. <u>s</u>ee  b. <u>s</u>it  c. <u>sh</u>e  d. <u>s</u>un ( )</div>
      </div>
    </div>
  </div>
  
  <div class="section">
    <h2>四、判断发音是否相同（每题2分，共20分）</h2>
    <p>相同写 T，不同写 F</p>
    ${shuffle([
      { w1: 'cat', w2: 'hat', a: 'T' }, { w1: 'dog', w2: 'hot', a: 'T' },
      { w1: 'see', w2: 'tea', a: 'T' }, { w1: 'my', w2: 'time', a: 'T' },
      { w1: 'go', w2: 'home', a: 'T' }, { w1: 'cat', w2: 'car', a: 'F' },
      { w1: 'bed', w2: 'he', a: 'F' }, { w1: 'sit', w2: 'like', a: 'F' },
      { w1: 'hot', w2: 'go', a: 'F' }, { w1: 'cup', w2: 'use', a: 'F' },
    ]).slice(0, 10).map((q, i) => `<div class="question">${i + 1}. ${q.w1} 和 ${q.w2} ( )</div>`).join('\n    ')}
  </div>
  
  <div class="section">
    <h2>五、连线题（每题2分，共20分）</h2>
    <div class="two-col">
      <div>
        ${shuffle(vocabulary).slice(0, 5).map((v, i) => `<div class="question">${i + 1}. ${v.word}</div>`).join('\n        ')}
      </div>
      <div>
        ${shuffle(vocabulary).slice(0, 5).map((v, i) => `<div class="question">${String.fromCharCode(65 + i)}. ${v.phonetic}</div>`).join('\n        ')}
      </div>
    </div>
  </div>
  
  <div class="answer-section">
    <h2>参考答案</h2>
    <p><strong>三、找出划线部分发音不同的单词</strong></p>
    <p>1. c  2. c  3. c  4. c  5. c  6. c  7. c  8. c  9. b  10. c</p>
    <p><strong>四、判断发音是否相同</strong></p>
    <p>根据单词发音判断即可</p>
  </div>
</body>
</html>`;
};

const PhoneticPracticePage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>('practice');
  const [grade, setGrade] = useState<number>(3);
  const [questions, setQuestions] = useState(() => generateQuestions(3));
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [score, setScore] = useState(0);
  const [playingWord, setPlayingWord] = useState<string | null>(null);
  const [showExamModal, setShowExamModal] = useState(false);
  const [examHtml, setExamHtml] = useState('');

  // 重新生成题目
  const regenerateQuestions = (newGrade: number) => {
    setGrade(newGrade);
    setQuestions(generateQuestions(newGrade));
    setCurrentQuestion(0);
    setSelectedAnswer(null);
    setShowResult(false);
    setScore(0);
  };

  // 生成试卷
  const handleGenerateExam = () => {
    setExamHtml(generateExamPaper(grade));
    setShowExamModal(true);
  };

  // 下载 PDF
  const handleDownloadPdf = () => {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(examHtml);
      printWindow.document.close();
      printWindow.onload = () => printWindow.print();
    }
  };

  // 播放发音
  const playSound = (word: string) => {
    if (playingWord === word) { setPlayingWord(null); return; }
    setPlayingWord(word);
    const audio = new Audio(`https://dict.youdao.com/dictvoice?audio=${encodeURIComponent(word)}&type=1`);
    audio.onended = () => setPlayingWord(null);
    audio.onerror = () => setPlayingWord(null);
    audio.play().catch(() => setPlayingWord(null));
  };

  // 选择答案
  const handleAnswer = (index: number) => {
    if (showResult) return;
    setSelectedAnswer(index);
  };

  // 提交答案
  const handleSubmit = () => {
    if (selectedAnswer === null) { message.warning('请选择一个答案'); return; }
    setShowResult(true);
    if (selectedAnswer === questions[currentQuestion].answer) {
      setScore(score + 1);
      message.success('回答正确！');
    } else {
      message.error('回答错误！');
    }
  };

  // 下一题
  const handleNext = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
      setSelectedAnswer(null);
      setShowResult(false);
    } else {
      Modal.success({
        title: '练习完成',
        content: `得分：${score}/${questions.length}`,
        onOk: () => {
          // 重新生成题目
          setQuestions(generateQuestions(grade));
          setCurrentQuestion(0);
          setSelectedAnswer(null);
          setShowResult(false);
          setScore(0);
        },
      });
    }
  };

  // 英标练习 Tab
  const practiceTab = (
    <div>
      <Card style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Space>
            <span>选择年级：</span>
            <Select value={grade} onChange={regenerateQuestions} style={{ width: 120 }}>
              <Select.Option value={1}>一年级</Select.Option>
              <Select.Option value={2}>二年级</Select.Option>
              <Select.Option value={3}>三年级</Select.Option>
              <Select.Option value={4}>四年级</Select.Option>
              <Select.Option value={5}>五年级</Select.Option>
            </Select>
            <Button onClick={() => regenerateQuestions(grade)}>重新生成</Button>
          </Space>
          <span>得分: {score}/{questions.length}</span>
        </div>
      </Card>

      <Card>
        <div style={{ marginBottom: 16, color: '#999' }}>
          当前进度: {currentQuestion + 1} / {questions.length}
        </div>
        
        <h3 style={{ marginBottom: 24 }}>{questions[currentQuestion].question}</h3>
        
        <Radio.Group value={selectedAnswer} onChange={(e) => handleAnswer(e.target.value)} style={{ width: '100%' }}>
          <Space direction="vertical" style={{ width: '100%' }}>
            {questions[currentQuestion].options.map((option, index) => (
              <Radio key={index} value={index} style={{
                display: 'block', padding: '12px 16px', width: '100%',
                border: `1px solid ${showResult ? index === questions[currentQuestion].answer ? '#52c41a' : index === selectedAnswer ? '#ff4d4f' : '#d9d9d9' : selectedAnswer === index ? '#1890ff' : '#d9d9d9'}`,
                borderRadius: 8,
                background: showResult ? index === questions[currentQuestion].answer ? '#f6ffed' : index === selectedAnswer ? '#fff1f0' : '#fff' : selectedAnswer === index ? '#e6f7ff' : '#fff',
                cursor: showResult ? 'default' : 'pointer',
              }}>
                <Space>
                  {showResult && index === questions[currentQuestion].answer && <CheckCircleOutlined style={{ color: '#52c41a' }} />}
                  {showResult && index === selectedAnswer && index !== questions[currentQuestion].answer && <CloseCircleOutlined style={{ color: '#ff4d4f' }} />}
                  {option}
                  {!showResult && (
                    <Button type="text" size="small" icon={<SoundOutlined />} onClick={(e) => { e.stopPropagation(); playSound(option.replace(/[^a-zA-Z]/g, '')); }} style={{ marginLeft: 8 }} />
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
              {currentQuestion < questions.length - 1 ? '下一题' : '完成'}
            </Button>
          )}
        </div>
      </Card>
    </div>
  );

  // 试卷练习 Tab
  const examTab = (
    <div>
      <Card>
        <h3 style={{ marginBottom: 24 }}>试卷生成</h3>
        <Space direction="vertical" style={{ width: '100%' }} size="large">
          <div>
            <span style={{ marginRight: 16 }}>选择年级：</span>
            <Select value={grade} onChange={setGrade} style={{ width: 120 }}>
              <Select.Option value={1}>一年级</Select.Option>
              <Select.Option value={2}>二年级</Select.Option>
              <Select.Option value={3}>三年级</Select.Option>
              <Select.Option value={4}>四年级</Select.Option>
              <Select.Option value={5}>五年级</Select.Option>
            </Select>
          </div>
          <div>
            <p style={{ color: '#666', marginBottom: 16 }}>试卷内容：看音标写单词、选择正确音标、发音辨别、连线题</p>
            <p style={{ color: '#999', fontSize: 12 }}>词汇范围：限定为该年级教材词汇，不会超纲</p>
          </div>
          <Space>
            <Button type="primary" icon={<EyeOutlined />} onClick={handleGenerateExam}>在线预览</Button>
            <Button icon={<DownloadOutlined />} onClick={() => { handleGenerateExam(); setTimeout(handleDownloadPdf, 500); }}>下载 PDF</Button>
          </Space>
        </Space>
      </Card>

      <Modal
        title="试卷预览"
        open={showExamModal}
        onCancel={() => setShowExamModal(false)}
        width={900}
        footer={[
          <Button key="close" onClick={() => setShowExamModal(false)}>关闭</Button>,
          <Button key="download" type="primary" icon={<DownloadOutlined />} onClick={handleDownloadPdf}>下载 PDF</Button>,
        ]}
      >
        <div dangerouslySetInnerHTML={{ __html: examHtml }} style={{ maxHeight: '60vh', overflow: 'auto' }} />
      </Modal>
    </div>
  );

  const tabItems = [
    { key: 'practice', label: '✏️ 英标练习', children: practiceTab },
    { key: 'exam', label: '📋 试卷练习', children: examTab },
  ];

  return (
    <MainLayout>
      <div style={{ padding: 24 }}>
        <h2 style={{ marginBottom: 24 }}>🔤 英标练习</h2>
        <Tabs activeKey={activeTab} onChange={setActiveTab} items={tabItems} size="large" />
      </div>
    </MainLayout>
  );
};

export default PhoneticPracticePage;
