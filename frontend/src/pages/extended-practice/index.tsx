import React, { useState } from 'react';
import { Card, Tabs, Tag, Collapse, Alert, Image } from 'antd';
import { ExperimentOutlined, TrophyOutlined, ReadOutlined, SafetyOutlined } from '@ant-design/icons';
import MainLayout from '../../components/layout/MainLayout';


// 学生小实验数据（带图片）
const experiments = [
  {
    title: '🌋 火山喷发实验',
    image: 'https://images.unsplash.com/photo-1574158622682-e40e69881006?w=400',
    materials: ['小苏打', '白醋', '洗洁精', '食用色素', '塑料瓶'],
    steps: [
      '在塑料瓶中放入2勺小苏打',
      '加入几滴洗洁精',
      '加入几滴红色食用色素',
      '慢慢倒入白醋',
      '观察火山喷发效果',
    ],
    principle: '小苏打（碱性）与白醋（酸性）反应产生二氧化碳气体，形成喷发效果。',
    difficulty: 'easy',
  },
  {
    title: '🌈 彩虹牛奶实验',
    image: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=400',
    materials: ['全脂牛奶', '食用色素', '洗洁精', '棉签', '盘子'],
    steps: [
      '将牛奶倒入盘子中',
      '在牛奶中滴入不同颜色的食用色素',
      '用棉签蘸取洗洁精',
      '将棉签触碰牛奶表面',
      '观察颜色扩散效果',
    ],
    principle: '洗洁精破坏了牛奶表面的张力，使颜色向四周扩散。',
    difficulty: 'easy',
  },
  {
    title: '🥚 鸡蛋浮沉实验',
    image: 'https://images.unsplash.com/photo-1582719508461-905c673771fd?w=400',
    materials: ['鸡蛋', '水', '盐', '玻璃杯'],
    steps: [
      '在玻璃杯中倒入清水',
      '放入鸡蛋，观察沉底',
      '逐渐加入盐并搅拌',
      '观察鸡蛋浮起来',
    ],
    principle: '盐水密度大于清水，当盐水密度大于鸡蛋密度时，鸡蛋就会浮起来。',
    difficulty: 'easy',
  },
  {
    title: '🎈 静电实验',
    image: 'https://images.unsplash.com/photo-1530026405186-ed1f139313f8?w=400',
    materials: ['气球', '毛衣或头发', '小纸片'],
    steps: [
      '吹起气球',
      '将气球在毛衣或头发上摩擦',
      '将气球靠近小纸片',
      '观察纸片被吸起',
    ],
    principle: '摩擦产生静电，静电能够吸引轻小物体。',
    difficulty: 'easy',
  },
  {
    title: '🌱 植物生长实验',
    image: 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=400',
    materials: ['绿豆', '纸巾', '塑料杯', '水'],
    steps: [
      '在塑料杯中放入湿润的纸巾',
      '放入几颗绿豆',
      '每天浇水保持湿润',
      '观察绿豆发芽生长',
    ],
    principle: '种子在适宜的温度、水分和空气条件下会发芽生长。',
    difficulty: 'easy',
  },
  {
    title: '💧 水的表面张力',
    image: 'https://images.unsplash.com/photo-1509099836639-18ba1795216d?w=400',
    materials: ['硬币', '滴管', '水', '洗洁精'],
    steps: [
      '用滴管往硬币上滴水',
      '数一数能滴多少滴',
      '加入一滴洗洁精',
      '观察水溢出',
    ],
    principle: '水的表面张力使水能堆积成拱形，洗洁精破坏表面张力后水就溢出了。',
    difficulty: 'easy',
  },
];

// 学习游戏数据
const games = [
  {
    title: '🔢 24点游戏',
    image: 'https://images.unsplash.com/photo-1509228468518-180dd4864864?w=400',
    description: '用4个数字通过加减乘除得到24',
    howToPlay: [
      '随机抽取4张扑克牌',
      '用加减乘除将4个数字计算得到24',
      '每个数字只能用一次',
      '先算出的人获胜',
    ],
    example: '1, 5, 5, 5 → (5-1)×5+5=24',
    benefits: '提高心算能力和数学思维',
  },
  {
    title: '📝 成语接龙',
    image: 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=400',
    description: '用成语最后一个字接下一个成语',
    howToPlay: [
      '第一个人说一个成语',
      '下一个人用最后一个字接新成语',
      '不能重复说过的成语',
      '接不上的人淘汰',
    ],
    example: '一心一意 → 意气风发 → 发扬光大',
    benefits: '积累成语词汇，了解成语含义',
  },
  {
    title: '🔤 单词拼写比赛',
    image: 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=400',
    description: '英语单词拼写竞赛',
    howToPlay: [
      '主持人读出单词和中文意思',
      '参赛者在纸上拼写',
      '拼写正确得分',
      '最后得分最高者获胜',
    ],
    example: 'apple（苹果）→ a-p-p-l-e',
    benefits: '提高英语单词拼写能力',
  },
  {
    title: '🧮 数独游戏',
    image: 'https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=400',
    description: '在9×9格子中填入1-9的数字',
    howToPlay: [
      '每行必须包含1-9不重复',
      '每列必须包含1-9不重复',
      '每个3×3小格必须包含1-9不重复',
      '根据已知数字推理填写',
    ],
    example: '从简单级别开始练习',
    benefits: '培养逻辑推理能力和专注力',
  },
  {
    title: '🎯 知识问答',
    image: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=400',
    description: '各科知识抢答竞赛',
    howToPlay: [
      '准备各科知识题目',
      '主持人读题',
      '抢答正确得分',
      '涵盖语文、数学、英语等',
    ],
    example: 'Q: 中国最长的河流？A: 长江',
    benefits: '巩固各科知识，提高反应速度',
  },
];

// 课外学习数据
const extracurricular = [
  {
    title: '📖 经典阅读',
    image: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=400',
    items: [
      { name: '《西游记》', desc: '中国古典四大名著之一，充满想象力', image: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=200' },
      { name: '《三国演义》', desc: '了解三国历史，学习智慧和谋略', image: 'https://images.unsplash.com/photo-1541963463532-d6829d20b504?w=200' },
      { name: '《小王子》', desc: '法国经典童话，富含人生哲理', image: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=200' },
      { name: '《夏洛的网》', desc: '关于友情和生命的感人故事', image: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=200' },
    ],
  },
  {
    title: '🎬 教育纪录片',
    image: 'https://images.unsplash.com/photo-1478720568477-152d9b164e26?w=400',
    items: [
      { name: '《地球脉动》', desc: 'BBC自然纪录片，了解地球生态', image: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=200' },
      { name: '《蓝色星球》', desc: '探索海洋世界的奥秘', image: 'https://images.unsplash.com/photo-1518837695005-2083093ee35b?w=200' },
      { name: '《河西走廊》', desc: '了解中国历史文化', image: 'https://images.unsplash.com/photo-1508804185872-d7badad00f7d?w=200' },
    ],
  },
  {
    title: '🎨 兴趣培养',
    image: 'https://images.unsplash.com/photo-1513364776144-60967b0f80ef?w=400',
    items: [
      { name: '绘画', desc: '培养艺术审美和创造力', image: 'https://images.unsplash.com/photo-1513364776144-60967b0f80ef?w=200' },
      { name: '书法', desc: '练字修身，培养耐心', image: 'https://images.unsplash.com/photo-1455390582262-044cdead277a?w=200' },
      { name: '编程', desc: '学习逻辑思维和解决问题能力', image: 'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=200' },
    ],
  },
];

// 运动规则数据
const sportsRules = [
  {
    name: '足球',
    icon: '⚽',
    image: 'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?w=400',
    video: 'https://www.w3schools.com/html/mov_bbb.mp4',
    rules: [
      '每队11人，其中1名守门员',
      '比赛时间90分钟（上下半场各45分钟）',
      '除守门员外，其他球员不能用手触球',
      '球整体越过球门线算进球',
      '越位规则：进攻球员不能比倒数第二个防守球员更靠近球门',
      '犯规可判罚任意球或点球',
      '黄牌警告，两张黄牌或一张红牌罚下',
    ],
    tips: ['基本功：传球、停球、带球、射门', '团队配合比个人技术更重要', '注意跑位和接应'],
  },
  {
    name: '篮球',
    icon: '🏀',
    image: 'https://images.unsplash.com/photo-1546519638-68e109498ffc?w=400',
    rules: [
      '每队5人上场',
      '比赛时间48分钟（NBA）或40分钟（FIBA）',
      '投篮进入篮筐得分：三分线外3分，线内2分，罚球1分',
      '运球时不能双手同时触球',
      '走步：持球移动超过两步',
      '犯规5次被罚下',
      '24秒进攻时限',
    ],
    tips: ['基本功：运球、投篮、传球、防守', '多练习投篮，找到投篮节奏', '注意团队配合和跑位'],
  },
  {
    name: '羽毛球',
    icon: '🏸',
    image: 'https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?w=400',
    rules: [
      '单打或双打',
      '21分制，三局两胜',
      '发球必须过网，落在对角发球区',
      '球落在对方场地内得分',
      '发球时球拍必须低于腰部',
    ],
    tips: ['基本功：握拍、发球、高远球、吊球', '步伐很重要，要多练习移动', '注意观察对手的弱点'],
  },
  {
    name: '乒乓球',
    icon: '🏓',
    image: 'https://images.unsplash.com/photo-1558741225-31e48c7e8e8a?w=400',
    rules: [
      '单打或双打',
      '11分制，三局两胜或五局三胜',
      '发球需要先在自己这边弹一下，再弹到对方区域',
      '每人轮流发2个球',
      '10:10时需领先2分才能获胜',
    ],
    tips: ['基本功：握拍、发球、正手攻球、反手推挡', '练习旋转球', '注意步伐移动和身体协调'],
  },
  {
    name: '排球',
    icon: '🏐',
    image: 'https://images.unsplash.com/photo-1612872087720-bb876e2e67f6?w=400',
    rules: [
      '每队6人上场',
      '25分制，五局三胜',
      '每方最多触球3次（拦网除外）',
      '球落在对方场地内得分',
      '发球不能踩线',
    ],
    tips: ['基本功：垫球、传球、扣球、发球', '团队配合很重要', '注意站位和轮转'],
  },
];

const ExtendedPracticePage: React.FC = () => {
  const [activeTab, setActiveTab] = useState('experiments');

  const tabItems = [
    { key: 'experiments', label: <span><ExperimentOutlined /> 学生小实验</span> },
    { key: 'games', label: <span><TrophyOutlined /> 学习游戏</span> },
    { key: 'extracurricular', label: <span><ReadOutlined /> 课外学习</span> },
    { key: 'sports', label: <span><SafetyOutlined /> 运动规则</span> },
  ];

  const experimentsTab = (
    <div>
      <Alert message="安全提示" description="所有实验请在家长陪同下进行，注意安全！" type="warning" showIcon style={{ marginBottom: 16 }} />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: 16 }}>
        {experiments.map((exp, idx) => (
          <Card key={idx} hoverable cover={<Image src={exp.image} alt={exp.title} height={200} style={{ objectFit: 'cover' }} />}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <h3 style={{ margin: 0 }}>{exp.title}</h3>
              <Tag color="green">简单</Tag>
            </div>
            <Card size="small" style={{ marginBottom: 8 }}>
              <h4>🧪 实验材料</h4>
              <ul>{exp.materials.map((m, i) => <li key={i}>{m}</li>)}</ul>
            </Card>
            <Card size="small" style={{ marginBottom: 8 }}>
              <h4>📝 实验步骤</h4>
              <ol>{exp.steps.map((s, i) => <li key={i}>{s}</li>)}</ol>
            </Card>
            <Card size="small">
              <h4>💡 实验原理</h4>
              <p>{exp.principle}</p>
            </Card>
          </Card>
        ))}
      </div>
    </div>
  );

  const gamesTab = (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: 16 }}>
        {games.map((game, idx) => (
          <Card key={idx} hoverable cover={<Image src={game.image} alt={game.title} height={200} style={{ objectFit: 'cover' }} />}>
            <h3 style={{ margin: '0 0 12px' }}>{game.title}</h3>
            <p style={{ color: '#666', marginBottom: 12 }}>{game.description}</p>
            <Card size="small" style={{ marginBottom: 8 }}>
              <h4>🎮 游戏规则</h4>
              <ol>{game.howToPlay.map((r, i) => <li key={i}>{r}</li>)}</ol>
            </Card>
            <Card size="small" style={{ marginBottom: 8 }}>
              <h4>💡 示例</h4>
              <p>{game.example}</p>
            </Card>
            <Card size="small">
              <h4>🎯 学习收获</h4>
              <p>{game.benefits}</p>
            </Card>
          </Card>
        ))}
      </div>
    </div>
  );

  const extracurricularTab = (
    <div>
      {extracurricular.map((category, idx) => (
        <Card key={idx} title={category.title} style={{ marginBottom: 16 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: 16 }}>
            {category.items.map((item, i) => (
              <Card key={i} size="small" hoverable cover={<Image src={item.image} alt={item.name} height={150} style={{ objectFit: 'cover' }} />}>
                <h4 style={{ margin: '0 0 8px', color: '#1890ff' }}>{item.name}</h4>
                <p style={{ margin: 0, color: '#666' }}>{item.desc}</p>
              </Card>
            ))}
          </div>
        </Card>
      ))}
    </div>
  );

  const sportsTab = (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: 16 }}>
        {sportsRules.map((sport, idx) => (
          <Card key={idx} hoverable cover={<Image src={sport.image} alt={sport.name} height={200} style={{ objectFit: 'cover' }} />}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <span style={{ fontSize: 32 }}>{sport.icon}</span>
              <h3 style={{ margin: 0 }}>{sport.name}</h3>
            </div>
            <Card size="small" style={{ marginBottom: 8 }}>
              <h4>📋 基本规则</h4>
              <ul>{sport.rules.map((r, i) => <li key={i}>{r}</li>)}</ul>
            </Card>
            <Card size="small">
              <h4>💡 学习建议</h4>
              <ul>{sport.tips.map((t, i) => <li key={i}>{t}</li>)}</ul>
            </Card>
          </Card>
        ))}
      </div>
    </div>
  );

  return (
    <MainLayout>
      <div style={{ padding: 24 }}>
        <h2 style={{ marginBottom: 24 }}>🎯 拓展实践</h2>
        <Tabs activeKey={activeTab} onChange={setActiveTab} items={tabItems} size="large" />
        {activeTab === 'experiments' && experimentsTab}
        {activeTab === 'games' && gamesTab}
        {activeTab === 'extracurricular' && extracurricularTab}
        {activeTab === 'sports' && sportsTab}
      </div>
    </MainLayout>
  );
};

export default ExtendedPracticePage;
