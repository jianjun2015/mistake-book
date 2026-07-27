import React, { useState } from 'react';
import { Card, Button, Tag, Space, Collapse, Steps, Alert } from 'antd';
import { BookOutlined, CalculatorOutlined, GlobalOutlined, CheckCircleOutlined, LinkOutlined } from '@ant-design/icons';
import MainLayout from '../../components/layout/MainLayout';

const { Panel } = Collapse;
const { Step } = Steps;

// 学习方法数据结构
interface LearningMethod {
  id: string;
  title: string;
  description: string;
  steps: { title: string; detail: string }[];
  source: string;
  caseStudy: { title: string; result: string };
  tags: string[];
  difficulty: 'easy' | 'medium' | 'hard';
}

// 语文学习方法
const chineseMethods: Record<string, LearningMethod[]> = {
  '三年级': [
    {
      id: 'c3-1',
      title: '阅读理解三步法',
      description: '通过三个步骤快速理解文章内容，提高阅读理解能力。',
      steps: [
        { title: '通读全文', detail: '快速浏览文章，了解大意，标记不认识的字词。' },
        { title: '精读题目', detail: '仔细阅读题目要求，带着问题再次阅读文章。' },
        { title: '定位答案', detail: '在文章中找到相关段落，提取关键信息作答。' },
      ],
      source: '《小学语文阅读理解训练》',
      caseStudy: { title: '三年级小明使用此方法后', result: '阅读理解正确率从60%提升到85%' },
      tags: ['阅读理解', '应试技巧'],
      difficulty: 'easy'
    },
    {
      id: 'c3-2',
      title: '作文五感写作法',
      description: '通过视觉、听觉、嗅觉、触觉、味觉五种感官描写，让作文更生动。',
      steps: [
        { title: '确定主题', detail: '选择一个具体的场景或事物进行描写。' },
        { title: '五感观察', detail: '用眼睛看（颜色、形状）、耳朵听（声音）、鼻子闻（气味）、手摸（质感）、嘴巴尝（味道）。' },
        { title: '组织语言', detail: '将观察到的内容用优美的语言组织成段落。' },
        { title: '添加感受', detail: '在描写中加入自己的感受和想法。' },
      ],
      source: '《小学生作文指导》',
      caseStudy: { title: '使用五感法描写春天', result: '作文分数从70分提升到90分' },
      tags: ['写作', '观察力'],
      difficulty: 'medium'
    },
    {
      id: 'c3-3',
      title: '古诗词记忆法',
      description: '通过理解、联想、画面三步法记忆古诗词。',
      steps: [
        { title: '理解诗意', detail: '先理解每句诗的意思，不要死记硬背。' },
        { title: '画面联想', detail: '将诗句内容想象成一幅画面，形成视觉记忆。' },
        { title: '反复朗读', detail: '大声朗读3-5遍，加深记忆。' },
        { title: '默写巩固', detail: '合上书本默写，检查记忆效果。' },
      ],
      source: '《古诗词学习方法》',
      caseStudy: { title: '使用画面联想法', result: '古诗词记忆效率提升3倍' },
      tags: ['古诗词', '记忆'],
      difficulty: 'easy'
    },
    {
      id: 'c3-4',
      title: '字词积累本',
      description: '建立个人字词积累本，系统化学习新字词。',
      steps: [
        { title: '准备积累本', detail: '准备一个专门的笔记本，分为"好词"和"好句"两部分。' },
        { title: '日常积累', detail: '阅读时遇到好词好句及时记录。' },
        { title: '分类整理', detail: '按描写类型分类：人物描写、景物描写、动作描写等。' },
        { title: '学以致用', detail: '写作时尝试使用积累的好词好句。' },
      ],
      source: '《语文学习方法》',
      caseStudy: { title: '坚持积累3个月', result: '词汇量增加500+，作文更生动' },
      tags: ['词汇', '积累'],
      difficulty: 'easy'
    },
  ],
  '四年级': [
    {
      id: 'c4-1',
      title: '段落分析法',
      description: '通过分析段落结构，理解文章的写作逻辑。',
      steps: [
        { title: '找中心句', detail: '每个段落通常有一个中心句，找到它就能理解段落大意。' },
        { title: '分析结构', detail: '判断是总分、分总、总分总还是并列结构。' },
        { title: '理解作用', detail: '思考这段话在全文中的作用：开头引出、中间展开、结尾总结。' },
      ],
      source: '《阅读理解进阶》',
      caseStudy: { title: '掌握段落分析法', result: '阅读理解从70分提升到90分' },
      tags: ['阅读理解', '分析能力'],
      difficulty: 'medium'
    },
    {
      id: 'c4-2',
      title: '作文提纲法',
      description: '先列提纲再写作，让作文结构清晰、逻辑通顺。',
      steps: [
        { title: '确定主题', detail: '明确作文要表达的中心思想。' },
        { title: '列出要点', detail: '确定要写的几个方面或事件。' },
        { title: '安排顺序', detail: '确定先写什么、再写什么、最后写什么。' },
        { title: '丰富内容', detail: '在每个要点下添加具体细节和描写。' },
      ],
      source: '《小学生作文进阶》',
      caseStudy: { title: '使用提纲法写作文', result: '作文结构更清晰，分数提升15分' },
      tags: ['写作', '结构化'],
      difficulty: 'medium'
    },
    {
      id: 'c4-3',
      title: '文言文入门法',
      description: '通过古今对照法，轻松学习简单的文言文。',
      steps: [
        { title: '通读全文', detail: '先读一遍，了解大意。' },
        { title: '逐句对照', detail: '将文言文逐句翻译成白话文，理解意思。' },
        { title: '积累词汇', detail: '记录常用的文言词汇，如"之"、"乎"、"者"、"也"。' },
        { title: '反复朗读', detail: '通过朗读培养语感。' },
      ],
      source: '《文言文启蒙》',
      caseStudy: { title: '学习《守株待兔》', result: '能够独立翻译简单文言文' },
      tags: ['文言文', '古文'],
      difficulty: 'hard'
    },
    {
      id: 'c4-4',
      title: '修辞手法学习法',
      description: '通过实例学习比喻、拟人、排比等修辞手法。',
      steps: [
        { title: '识别修辞', detail: '在阅读中识别各种修辞手法。' },
        { title: '理解作用', detail: '理解每种修辞手法的表达效果。' },
        { title: '模仿练习', detail: '模仿范文中的修辞手法进行写作练习。' },
        { title: '灵活运用', detail: '在自己的作文中尝试使用修辞手法。' },
      ],
      source: '《修辞手法学习》',
      caseStudy: { title: '学习比喻手法', result: '作文描写更生动，获得老师表扬' },
      tags: ['修辞', '写作'],
      difficulty: 'medium'
    },
  ],
};

// 数学学习方法
const mathMethods: Record<string, LearningMethod[]> = {
  '三年级': [
    {
      id: 'm3-1',
      title: '错题本学习法',
      description: '通过整理错题，找出薄弱点，针对性提高。',
      steps: [
        { title: '记录错题', detail: '将做错的题目完整记录下来，包括原题和错误答案。' },
        { title: '分析错因', detail: '分析错误原因：粗心、概念不清、方法不对。' },
        { title: '重做错题', detail: '隔天重新做一遍错题，确保真正掌握。' },
        { title: '定期复习', detail: '每周复习一次错题，巩固记忆。' },
      ],
      source: '《高效学习方法》',
      caseStudy: { title: '坚持使用错题本', result: '数学成绩从75分提升到92分' },
      tags: ['错题管理', '复习'],
      difficulty: 'easy'
    },
    {
      id: 'm3-2',
      title: '画图解题法',
      description: '通过画图将抽象的数学问题具体化，更容易理解。',
      steps: [
        { title: '理解题意', detail: '仔细读题，理解题目要求什么。' },
        { title: '画出示意图', detail: '根据题意画出线段图、示意图或表格。' },
        { title: '标注数据', detail: '在图上标注已知条件和未知量。' },
        { title: '列式计算', detail: '根据图形关系列出算式并计算。' },
      ],
      source: '《数学解题技巧》',
      caseStudy: { title: '用画图法解应用题', result: '应用题正确率从50%提升到85%' },
      tags: ['解题技巧', '应用题'],
      difficulty: 'medium'
    },
    {
      id: 'm3-3',
      title: '口算速算法',
      description: '通过技巧提高口算速度和准确性。',
      steps: [
        { title: '凑十法', detail: '将数字拆分凑成整十数再计算。如 8+7=8+2+5=15' },
        { title: '拆分法', detail: '将大数拆分成小数计算。如 25×4=25×2×2=200' },
        { title: '估算练习', detail: '先估算结果范围，再精确计算。' },
        { title: '限时练习', detail: '每天进行5分钟限时口算练习。' },
      ],
      source: '《口算速算技巧》',
      caseStudy: { title: '每天练习5分钟', result: '口算速度提升3倍，准确率95%' },
      tags: ['口算', '速算'],
      difficulty: 'easy'
    },
    {
      id: 'm3-4',
      title: '应用题审题法',
      description: '通过仔细审题，避免理解错误导致解题失败。',
      steps: [
        { title: '读题3遍', detail: '第一遍了解大意，第二遍找关键信息，第三遍确认理解。' },
        { title: '圈关键词', detail: '圈出题目中的关键词：一共、还剩、多几、少几等。' },
        { title: '画线段图', detail: '对于数量关系复杂的题目，画线段图帮助理解。' },
        { title: '列式检查', detail: '列出算式后，检查是否符合题意。' },
      ],
      source: '《应用题解题方法》',
      caseStudy: { title: '使用审题法', result: '应用题错误率降低60%' },
      tags: ['应用题', '审题'],
      difficulty: 'easy'
    },
  ],
  '四年级': [
    {
      id: 'm4-1',
      title: '竖式计算规范法',
      description: '规范竖式计算步骤，减少计算错误。',
      steps: [
        { title: '对齐数位', detail: '相同数位对齐，个位对个位，十位对十位。' },
        { title: '从低位算起', detail: '从个位开始计算，逐位向上。' },
        { title: '进位标记', detail: '有进位时在上方标记，避免遗忘。' },
        { title: '验算检查', detail: '计算完成后用逆运算验算。' },
      ],
      source: '《计算能力训练》',
      caseStudy: { title: '规范计算步骤', result: '计算错误率降低80%' },
      tags: ['计算', '规范'],
      difficulty: 'easy'
    },
    {
      id: 'm4-2',
      title: '巧算技巧',
      description: '运用运算律和技巧简化计算过程。',
      steps: [
        { title: '凑整法', detail: '将数字凑成整十、整百再计算。如 99×7=(100-1)×7=693' },
        { title: '交换律', detail: '利用加法和乘法交换律调整计算顺序。' },
        { title: '结合律', detail: '利用结合律将容易计算的数先结合。如 25×4=100' },
        { title: '分配律', detail: '利用乘法分配律简化计算。如 25×(40+4)=25×40+25×4' },
      ],
      source: '《巧算技巧》',
      caseStudy: { title: '掌握巧算技巧', result: '计算速度提升2倍' },
      tags: ['巧算', '运算律'],
      difficulty: 'medium'
    },
    {
      id: 'm4-3',
      title: '几何图形认知法',
      description: '通过动手操作理解几何图形的性质。',
      steps: [
        { title: '观察实物', detail: '观察生活中的几何图形：窗户是长方形，车轮是圆形。' },
        { title: '动手画图', detail: '用尺子和圆规画出各种几何图形。' },
        { title: '测量验证', detail: '测量图形的边长、角度，验证性质。' },
        { title: '总结规律', detail: '总结各种图形的特征和公式。' },
      ],
      source: '《几何入门》',
      caseStudy: { title: '动手操作学习', result: '几何题正确率提升到90%' },
      tags: ['几何', '动手能力'],
      difficulty: 'medium'
    },
    {
      id: 'm4-4',
      title: '单位换算法',
      description: '掌握各种单位之间的换算关系。',
      steps: [
        { title: '理解进率', detail: '记住常用单位之间的进率：1米=100厘米，1千克=1000克。' },
        { title: '画换算图', detail: '画出单位换算的阶梯图，帮助记忆。' },
        { title: '大化小乘', detail: '大单位化小单位用乘法。如 2米=2×100=200厘米' },
        { title: '小化大除', detail: '小单位化大单位用除法。如 3000克=3000÷1000=3千克' },
      ],
      source: '《单位换算技巧》',
      caseStudy: { title: '掌握换算方法', result: '单位换算题全对' },
      tags: ['单位换算', '基础'],
      difficulty: 'easy'
    },
  ],
};

// 英语学习方法
const englishMethods: Record<string, LearningMethod[]> = {
  '三年级': [
    {
      id: 'e3-1',
      title: '自然拼读法',
      description: '通过学习字母和字母组合的发音规则，实现"见词能读，听音能写"。',
      steps: [
        { title: '学习字母音', detail: '学习26个字母的发音，注意不是字母名称，而是字母在单词中的发音。' },
        { title: '学习元音', detail: '学习5个元音字母的长音和短音。如 a 的短音 /æ/（cat），长音 /eɪ/（cake）。' },
        { title: '学习辅音组合', detail: '学习常见的辅音组合：ch, sh, th, ph 等。' },
        { title: '拼读练习', detail: '将字母音组合起来拼读单词。如 c-a-t → cat' },
      ],
      source: '《Phonics自然拼读》',
      caseStudy: { title: '学习自然拼读后', result: '单词记忆效率提升3倍，见词能读' },
      tags: ['发音', '单词'],
      difficulty: 'easy'
    },
    {
      id: 'e3-2',
      title: '情境学习法',
      description: '在真实情境中学习英语，更容易理解和记忆。',
      steps: [
        { title: '创设情境', detail: '在日常生活中创设英语情境，如吃饭时说食物单词。' },
        { title: '角色扮演', detail: '和家人或同学进行英语对话练习。' },
        { title: '实物对照', detail: '看到实物时说出对应的英语单词。' },
        { title: '情景对话', detail: '模拟购物、问路等场景进行对话练习。' },
      ],
      source: '《情境英语学习法》',
      caseStudy: { title: '使用情境学习法', result: '口语表达能力显著提升' },
      tags: ['口语', '情境'],
      difficulty: 'easy'
    },
    {
      id: 'e3-3',
      title: '单词卡片法',
      description: '使用单词卡片进行单词记忆，随时随地学习。',
      steps: [
        { title: '制作卡片', detail: '正面写英文单词，背面写中文意思和音标。' },
        { title: '分类整理', detail: '按主题分类：动物、食物、颜色、数字等。' },
        { title: '间隔复习', detail: '今天学的单词，明天复习一次，一周后再复习一次。' },
        { title: '自测巩固', detail: '看中文说英文，看英文说中文，双向练习。' },
      ],
      source: '《单词记忆法》',
      caseStudy: { title: '使用单词卡片', result: '一个月掌握200个单词' },
      tags: ['单词', '记忆'],
      difficulty: 'easy'
    },
    {
      id: 'e3-4',
      title: '英语儿歌学习法',
      description: '通过唱英语儿歌，培养语感和听力。',
      steps: [
        { title: '选择儿歌', detail: '选择简单、节奏明快的英语儿歌。' },
        { title: '听音模仿', detail: '先听几遍，模仿发音和语调。' },
        { title: '跟唱练习', detail: '跟着音乐一起唱，注意发音准确。' },
        { title: '理解歌词', detail: '理解歌词的意思，学习其中的单词和句型。' },
      ],
      source: '《英语儿歌精选》',
      caseStudy: { title: '每天唱一首儿歌', result: '语感明显提升，发音更准确' },
      tags: ['听力', '语感'],
      difficulty: 'easy'
    },
  ],
  '四年级': [
    {
      id: 'e4-1',
      title: '句型操练法',
      description: '通过反复操练常用句型，形成英语思维。',
      steps: [
        { title: '学习句型', detail: '学习课本中的重点句型，理解结构。' },
        { title: '替换练习', detail: '用不同的单词替换句型中的关键词。如 I like apples → I like bananas' },
        { title: '造句练习', detail: '用句型造出新的句子。' },
        { title: '情景运用', detail: '在实际情景中使用句型进行交流。' },
      ],
      source: '《英语句型学习》',
      caseStudy: { title: '操练10个核心句型', result: '能够进行简单英语对话' },
      tags: ['句型', '口语'],
      difficulty: 'medium'
    },
    {
      id: 'e4-2',
      title: '分级阅读法',
      description: '通过阅读适合自己水平的英语读物，提高阅读能力。',
      steps: [
        { title: '选择读物', detail: '选择适合自己水平的分级读物，生词率不超过5%。' },
        { title: '先听后读', detail: '先听音频，再看文字，帮助理解。' },
        { title: '猜测词义', detail: '遇到生词先根据上下文猜测意思，不要马上查字典。' },
        { title: '摘抄好句', detail: '将读到的好句子摘抄下来，积累表达方式。' },
      ],
      source: '《英语分级阅读》',
      caseStudy: { title: '坚持阅读3个月', result: '阅读理解能力提升2个等级' },
      tags: ['阅读', '词汇'],
      difficulty: 'medium'
    },
    {
      id: 'e4-3',
      title: '语法归纳法',
      description: '通过归纳总结，系统学习英语语法。',
      steps: [
        { title: '学习规则', detail: '学习一条语法规则，理解其含义和用法。' },
        { title: '找例句', detail: '在课本或阅读材料中找到使用该语法的例句。' },
        { title: '做练习', detail: '做相关的语法练习题，巩固理解。' },
        { title: '归纳总结', detail: '将学过的语法点整理成表格或思维导图。' },
      ],
      source: '《小学英语语法》',
      caseStudy: { title: '系统学习语法', result: '语法题正确率提升到85%' },
      tags: ['语法', '系统学习'],
      difficulty: 'medium'
    },
    {
      id: 'e4-4',
      title: '英语日记法',
      description: '通过写英语日记，提高写作能力和词汇运用能力。',
      steps: [
        { title: '从简单开始', detail: '开始时写3-5句简单句子即可。' },
        { title: '记录日常', detail: '记录每天做的事情、看到的事物。' },
        { title: '使用新词', detail: '尝试使用刚学到的新单词和句型。' },
        { title: '请人修改', detail: '请老师或家长帮忙修改错误。' },
      ],
      source: '《英语写作入门》',
      caseStudy: { title: '坚持写英语日记', result: '写作能力显著提升，词汇量增加' },
      tags: ['写作', '表达'],
      difficulty: 'hard'
    },
  ],
};

// 页面组件
const LearningMethodsPage: React.FC = () => {
  const [subject, setSubject] = useState('chinese');
  const [grade, setGrade] = useState('三年级');

  const getMethods = () => {
    switch (subject) {
      case 'chinese': return chineseMethods[grade] || [];
      case 'math': return mathMethods[grade] || [];
      case 'english': return englishMethods[grade] || [];
      default: return [];
    }
  };

  const subjectConfig = {
    chinese: { name: '语文', icon: <BookOutlined />, color: '#eb2f96' },
    math: { name: '数学', icon: <CalculatorOutlined />, color: '#ff4d4f' },
    english: { name: '英语', icon: <GlobalOutlined />, color: '#faad14' },
  };

  const currentConfig = subjectConfig[subject as keyof typeof subjectConfig];
  const methods = getMethods();

  return (
    <MainLayout>
      <div style={{ padding: 24 }}>
        <h2 style={{ marginBottom: 24 }}>📚 学习方法</h2>

        {/* 学科选择 */}
        <Card style={{ marginBottom: 16 }}>
          <Space>
            <span>选择学科：</span>
            {Object.entries(subjectConfig).map(([key, config]) => (
              <Button
                key={key}
                type={subject === key ? 'primary' : 'default'}
                icon={config.icon}
                onClick={() => setSubject(key)}
              >
                {config.name}
              </Button>
            ))}
          </Space>
        </Card>

        {/* 年级选择 */}
        <Card style={{ marginBottom: 16 }}>
          <Space>
            <span>选择年级：</span>
            <Button type={grade === '三年级' ? 'primary' : 'default'} onClick={() => setGrade('三年级')}>三年级</Button>
            <Button type={grade === '四年级' ? 'primary' : 'default'} onClick={() => setGrade('四年级')}>四年级</Button>
          </Space>
        </Card>

        {/* 提示信息 */}
        <Alert
          message={`${grade}${currentConfig.name}学习方法`}
          description={`共 ${methods.length} 种学习方法，每种方法都包含具体步骤、来源和实际案例。`}
          type="info"
          showIcon
          style={{ marginBottom: 16 }}
        />

        {/* 学习方法列表 */}
        <Collapse defaultActiveKey={methods.map(m => m.id)}>
          {methods.map(method => (
            <Panel
              key={method.id}
              header={
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontWeight: 'bold' }}>{method.title}</span>
                  <Tag color={method.difficulty === 'easy' ? 'green' : method.difficulty === 'medium' ? 'orange' : 'red'}>
                    {method.difficulty === 'easy' ? '简单' : method.difficulty === 'medium' ? '中等' : '进阶'}
                  </Tag>
                  {method.tags.map(tag => (
                    <Tag key={tag} color="blue">{tag}</Tag>
                  ))}
                </div>
              }
            >
              <p style={{ marginBottom: 16, color: '#666' }}>{method.description}</p>

              {/* 具体步骤 */}
              <Card title="📝 具体步骤" size="small" style={{ marginBottom: 16 }}>
                <Steps direction="vertical" size="small">
                  {method.steps.map((step, idx) => (
                    <Step key={idx} title={step.title} description={step.detail} />
                  ))}
                </Steps>
              </Card>

              {/* 来源 */}
              <Card title="📖 来源" size="small" style={{ marginBottom: 16 }}>
                <p><LinkOutlined /> {method.source}</p>
              </Card>

              {/* 实际案例与成果 */}
              <Card title="🎯 实际案例与成果" size="small">
                <p><strong>{method.caseStudy.title}</strong></p>
                <p style={{ color: '#52c41a' }}>
                  <CheckCircleOutlined /> {method.caseStudy.result}
                </p>
              </Card>
            </Panel>
          ))}
        </Collapse>
      </div>
    </MainLayout>
  );
};

export default LearningMethodsPage;
