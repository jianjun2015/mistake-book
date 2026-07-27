import React, { useState, useEffect } from 'react';
import { Card, Tag, Space, Button, Spin, message, Tabs, List } from 'antd';
import { ReloadOutlined, RobotOutlined, ClockCircleOutlined, FireOutlined, ThunderboltOutlined, LinkOutlined } from '@ant-design/icons';
import MainLayout from '../../components/layout/MainLayout';
import request from '../../utils/request';

// AI技术数据接口
interface AITechItem {
  id: string;
  name: string;
  category: string;
  description: string;
  features: string[];
  link: string;
  color: string;
  year: string;
}

interface HotArticle {
  id: string;
  title: string;
  summary: string;
  category: string;
  date: string;
  source: string;
  hot: boolean;
}

interface NewTech {
  id: string;
  name: string;
  company: string;
  description: string;
  date: string;
  isNew: boolean;
}

// AI技术数据
const aiTechData: AITechItem[] = [
  { id: '1', name: 'GPT-4o', category: '大语言模型', description: 'OpenAI最新的多模态大模型', features: ['多模态', '实时语音', '代码生成'], link: 'https://openai.com/gpt-4o', color: '#10a37f', year: '2024' },
  { id: '2', name: 'Claude 3.5 Sonnet', category: '大语言模型', description: 'Anthropic高性能AI助手', features: ['长上下文', '代码理解', '安全对齐'], link: 'https://claude.ai', color: '#d97706', year: '2024' },
  { id: '3', name: 'Gemini 1.5 Pro', category: '大语言模型', description: 'Google多模态AI模型', features: ['100万token', '多模态', '代码生成'], link: 'https://gemini.google.com', color: '#4285f4', year: '2024' },
  { id: '4', name: 'Llama 3.1', category: '开源模型', description: 'Meta开源大语言模型', features: ['开源免费', '本地部署', '社区支持'], link: 'https://llama.meta.com', color: '#1877f2', year: '2024' },
  { id: '5', name: 'DeepSeek-V2', category: '开源模型', description: '深度求索MoE模型', features: ['MoE架构', '低成本', '中文优化'], link: 'https://deepseek.com', color: '#0066ff', year: '2024' },
  { id: '6', name: 'Qwen2.5', category: '开源模型', description: '阿里云通义千问', features: ['中文优化', '工具调用', '多模态'], link: 'https://qwen.aliyun.com', color: '#ff6a00', year: '2024' },
  { id: '7', name: 'AutoGPT', category: 'AI Agent', description: '自主AI代理框架', features: ['任务规划', '自主执行', '工具使用'], link: 'https://agpt.co', color: '#00897b', year: '2023' },
  { id: '8', name: 'LangChain', category: 'AI Agent', description: 'LLM应用开发框架', features: ['链式调用', '工具集成', '记忆管理'], link: 'https://langchain.com', color: '#1c3d5a', year: '2023' },
  { id: '9', name: 'CrewAI', category: 'AI Agent', description: '多智能体协作框架', features: ['多角色协作', '任务分配', '流程编排'], link: 'https://crewai.com', color: '#7c3aed', year: '2024' },
  { id: '10', name: 'DALL-E 3', category: '图像生成', description: 'OpenAI文生图模型', features: ['文生图', '风格控制', '高分辨率'], link: 'https://openai.com/dall-e-3', color: '#10a37f', year: '2023' },
  { id: '11', name: 'Midjourney V6', category: '图像生成', description: 'AI绘画工具', features: ['艺术风格', '高画质', '风格多样'], link: 'https://midjourney.com', color: '#5865f2', year: '2024' },
  { id: '12', name: 'Sora', category: '视频生成', description: 'OpenAI文生视频模型', features: ['文生视频', '长视频', '高质量'], link: 'https://openai.com/sora', color: '#10a37f', year: '2024' },
  { id: '13', name: 'Cursor', category: 'AI编程', description: 'AI代码编辑器', features: ['代码补全', '智能重构', '对话编程'], link: 'https://cursor.sh', color: '#000000', year: '2024' },
  { id: '14', name: 'GitHub Copilot', category: 'AI编程', description: 'AI编程助手', features: ['代码补全', '多语言', 'IDE集成'], link: 'https://github.com/features/copilot', color: '#2088ff', year: '2021' },
  { id: '15', name: 'Whisper V3', category: '语音技术', description: '语音识别模型', features: ['多语言', '高精度', '实时转录'], link: 'https://openai.com/research/whisper', color: '#10a37f', year: '2023' },
];

const categoryColors: Record<string, string> = {
  '大语言模型': '#1890ff',
  '开源模型': '#52c41a',
  'AI Agent': '#722ed1',
  '图像生成': '#eb2f96',
  '视频生成': '#fa8c16',
  'AI编程': '#13c2c2',
  '语音技术': '#faad14',
};

const AITechPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState('tech');
  const [lastUpdate, setLastUpdate] = useState('');
  const [loading, setLoading] = useState(false);
  const [hotArticles, setHotArticles] = useState<HotArticle[]>([]);
  const [newTech, setNewTech] = useState<NewTech[]>([]);

  const loadData = () => {
    setLoading(true);
    const now = new Date();
    setLastUpdate(now.toLocaleString('zh-CN'));
    localStorage.setItem('ai_tech_last_update', now.toISOString());
    
    // 获取热点文章
    request.get('/ai-news/hot').then((res: any) => {
      if (res.code === 200) {
        setHotArticles(res.data);
      }
    }).catch(() => {
      // 使用默认数据
      setHotArticles([
        { id: '1', title: 'GPT-5即将发布：OpenAI预告重大突破', summary: 'OpenAI宣布GPT-5将在未来几个月内发布', category: '大语言模型', date: '2024-01-15', source: 'OpenAI', hot: true },
        { id: '2', title: 'Google发布Gemini 2.0', summary: '性能全面超越GPT-4', category: '大语言模型', date: '2024-01-14', source: 'Google', hot: true },
        { id: '3', title: 'Meta开源Llama 4', summary: '最强开源模型诞生', category: '开源模型', date: '2024-01-13', source: 'Meta', hot: false },
      ]);
    });

    // 获取新技术
    request.get('/ai-news/new-tech').then((res: any) => {
      if (res.code === 200) {
        setNewTech(res.data);
      }
    }).catch(() => {
      // 使用默认数据
      setNewTech([
        { id: '1', name: 'GPT-4o Turbo', company: 'OpenAI', description: '更快更便宜的GPT-4o', date: '2024-01-15', isNew: true },
        { id: '2', name: 'Stable Diffusion XL Turbo', company: 'Stability AI', description: '实时图像生成', date: '2024-01-14', isNew: true },
      ]);
    });

    setTimeout(() => setLoading(false), 500);
  };

  useEffect(() => {
    const lastUpdateStr = localStorage.getItem('ai_tech_last_update');
    if (lastUpdateStr) {
      const lastUpdateDate = new Date(lastUpdateStr);
      const now = new Date();
      const hoursDiff = (now.getTime() - lastUpdateDate.getTime()) / (1000 * 60 * 60);
      setLastUpdate(lastUpdateDate.toLocaleString('zh-CN'));
      if (hoursDiff >= 3) loadData();
    } else {
      loadData();
    }
    const interval = setInterval(loadData, 3 * 60 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const categories = Array.from(new Set(aiTechData.map(item => item.category)));
  const categoryCounts = categories.map(cat => ({
    name: cat,
    count: aiTechData.filter(item => item.category === cat).length,
    color: categoryColors[cat] || '#666'
  }));

  const [activeCategory, setActiveCategory] = useState('all');
  const filteredData = activeCategory === 'all' ? aiTechData : aiTechData.filter(item => item.category === activeCategory);

  const tabItems = [
    { key: 'tech', label: <span><RobotOutlined /> AI技术</span> },
    { key: 'hot', label: <span><FireOutlined /> 热点文章</span> },
    { key: 'new', label: <span><ThunderboltOutlined /> 新技术发布</span> },
  ];

  const techTab = (
    <div>
      <div style={{ marginBottom: 16 }}>
        <Space wrap>
          <Tag
            color={activeCategory === 'all' ? '#1890ff' : undefined}
            style={{ cursor: 'pointer', padding: '4px 12px' }}
            onClick={() => setActiveCategory('all')}
          >
            全部
          </Tag>
          {categoryCounts.map(cat => (
            <Tag
              key={cat.name}
              color={activeCategory === cat.name ? cat.color : undefined}
              style={{ cursor: 'pointer', padding: '4px 12px' }}
              onClick={() => setActiveCategory(cat.name)}
            >
              {cat.name} ({cat.count})
            </Tag>
          ))}
        </Space>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
        {filteredData.map(item => (
          <Card
            key={item.id}
            hoverable
            style={{ borderTop: `3px solid ${item.color}` }}
            onClick={() => window.open(item.link, '_blank')}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
              <div>
                <h3 style={{ margin: '0 0 8px', color: item.color }}>{item.name}</h3>
                <Space>
                  <Tag color={categoryColors[item.category]}>{item.category}</Tag>
                  <Tag>{item.year}</Tag>
                </Space>
              </div>
              <RobotOutlined style={{ fontSize: 24, color: item.color }} />
            </div>
            <p style={{ color: '#666', margin: '0 0 12px', fontSize: 14 }}>{item.description}</p>
            <div>
              {item.features.map((f, i) => <Tag key={i} style={{ marginBottom: 4 }}>{f}</Tag>)}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );

  const hotTab = (
    <div>
      <Card title="🔥 AI热点文章" extra={<Button icon={<ReloadOutlined />} onClick={loadData} size="small">刷新</Button>}>
        <List
          dataSource={hotArticles}
          renderItem={(item) => (
            <List.Item>
              <List.Item.Meta
                title={
                  <Space>
                    {item.hot && <Tag color="red">热门</Tag>}
                    <span>{item.title}</span>
                  </Space>
                }
                description={
                  <div>
                    <p style={{ margin: '4px 0' }}>{item.summary}</p>
                    <Space>
                      <Tag color={categoryColors[item.category] || '#666'}>{item.category}</Tag>
                      <span style={{ color: '#999', fontSize: 12 }}>{item.date}</span>
                      <span style={{ color: '#999', fontSize: 12 }}>来源: {item.source}</span>
                    </Space>
                  </div>
                }
              />
            </List.Item>
          )}
        />
      </Card>
    </div>
  );

  const newTechTab = (
    <div>
      <Card title="🚀 新技术发布" extra={<Button icon={<ReloadOutlined />} onClick={loadData} size="small">刷新</Button>}>
        <List
          dataSource={newTech}
          renderItem={(item) => (
            <List.Item>
              <List.Item.Meta
                title={
                  <Space>
                    {item.isNew && <Tag color="green">新发布</Tag>}
                    <span>{item.name}</span>
                    <Tag color="blue">{item.company}</Tag>
                  </Space>
                }
                description={
                  <div>
                    <p style={{ margin: '4px 0' }}>{item.description}</p>
                    <span style={{ color: '#999', fontSize: 12 }}>发布日期: {item.date}</span>
                  </div>
                }
              />
            </List.Item>
          )}
        />
      </Card>
    </div>
  );

  return (
    <MainLayout>
      <div style={{ padding: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <div>
            <h2 style={{ margin: 0 }}>🤖 AI前沿技术</h2>
            <p style={{ margin: '8px 0 0', color: '#999', fontSize: 13 }}>
              <ClockCircleOutlined /> 上次更新: {lastUpdate || '未更新'} · 每3小时自动刷新
            </p>
          </div>
        </div>

        <Tabs activeKey={activeTab} onChange={setActiveTab} items={tabItems} style={{ marginBottom: 16 }} />

        {loading ? (
          <div style={{ textAlign: 'center', padding: 100 }}><Spin size="large" /></div>
        ) : (
          <>
            {activeTab === 'tech' && techTab}
            {activeTab === 'hot' && hotTab}
            {activeTab === 'new' && newTechTab}
          </>
        )}
      </div>
    </MainLayout>
  );
};

export default AITechPage;
