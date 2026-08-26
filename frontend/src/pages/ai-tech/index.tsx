import React, { useState, useEffect } from 'react';
import { Card, Tag, Space, Button, Tabs, List } from 'antd';
import { ReloadOutlined, RobotOutlined, ClockCircleOutlined, FireOutlined, ThunderboltOutlined, AppstoreOutlined, ToolOutlined } from '@ant-design/icons';
import MainLayout from '../../components/layout/MainLayout';
import request from '../../utils/request';

interface AITechItem {
  id: string;
  name: string;
  category: string;
  description: string;
  features: string[];
  link: string;
  source: string;
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
  link: string;
}

interface NewTech {
  id: string;
  name: string;
  company: string;
  description: string;
  date: string;
  isNew: boolean;
  link: string;
  source: string;
}

interface SkillOrPlugin {
  id: string;
  name: string;
  company: string;
  description: string;
  trend: string;
  rating: number;
  usage: number;
  date: string;
  link: string;
  source: string;
}

const aiTechData: AITechItem[] = [
  { id: '1', name: 'GPT-4o', category: '大语言模型', description: 'OpenAI最新的多模态大模型', features: ['多模态', '实时语音', '代码生成'], link: 'https://openai.com/gpt-4o', source: 'OpenAI', color: '#10a37f', year: '2024' },
  { id: '2', name: 'Claude 3.5 Sonnet', category: '大语言模型', description: 'Anthropic高性能AI助手', features: ['长上下文', '代码理解', '安全对齐'], link: 'https://claude.ai', source: 'Anthropic', color: '#d97706', year: '2024' },
  { id: '3', name: 'Gemini 1.5 Pro', category: '大语言模型', description: 'Google多模态AI模型', features: ['100万token', '多模态', '代码生成'], link: 'https://gemini.google.com', source: 'Google', color: '#4285f4', year: '2024' },
  { id: '4', name: 'Llama 3.1', category: '开源模型', description: 'Meta开源大语言模型', features: ['开源免费', '本地部署', '社区支持'], link: 'https://llama.meta.com', source: 'Meta', color: '#1877f2', year: '2024' },
  { id: '5', name: 'DeepSeek-V2', category: '开源模型', description: '深度求索MoE模型', features: ['MoE架构', '低成本', '中文优化'], link: 'https://deepseek.com', source: '深度求索', color: '#0066ff', year: '2024' },
  { id: '6', name: 'Qwen2.5', category: '开源模型', description: '阿里云通义千问', features: ['中文优化', '工具调用', '多模态'], link: 'https://qwen.aliyun.com', source: '阿里云', color: '#ff6a00', year: '2024' },
  { id: '7', name: 'AutoGPT', category: 'AI Agent', description: '自主AI代理框架', features: ['任务规划', '自主执行', '工具使用'], link: 'https://agpt.co', source: 'Significant Gravitas', color: '#00897b', year: '2023' },
  { id: '8', name: 'LangChain', category: 'AI Agent', description: 'LLM应用开发框架', features: ['链式调用', '工具集成', '记忆管理'], link: 'https://langchain.com', source: 'LangChain AI', color: '#1c3d5a', year: '2023' },
  { id: '9', name: 'CrewAI', category: 'AI Agent', description: '多智能体协作框架', features: ['多角色协作', '任务分配', '流程编排'], link: 'https://crewai.com', source: 'CrewAI', color: '#7c3aed', year: '2024' },
  { id: '10', name: 'DALL-E 3', category: '图像生成', description: 'OpenAI文生图模型', features: ['文生图', '风格控制', '高分辨率'], link: 'https://openai.com/dall-e-3', source: 'OpenAI', color: '#10a37f', year: '2023' },
  { id: '11', name: 'Midjourney V6', category: '图像生成', description: 'AI绘画工具', features: ['艺术风格', '高画质', '风格多样'], link: 'https://midjourney.com', source: 'Midjourney', color: '#5865f2', year: '2024' },
  { id: '12', name: 'Sora', category: '视频生成', description: 'OpenAI文生视频模型', features: ['文生视频', '长视频', '高质量'], link: 'https://openai.com/sora', source: 'OpenAI', color: '#10a37f', year: '2024' },
  { id: '13', name: 'Cursor', category: 'AI编程', description: 'AI代码编辑器', features: ['代码补全', '智能重构', '对话编程'], link: 'https://cursor.sh', source: 'Cursor', color: '#000000', year: '2024' },
  { id: '14', name: 'GitHub Copilot', category: 'AI编程', description: 'AI编程助手', features: ['代码补全', '多语言', 'IDE集成'], link: 'https://github.com/features/copilot', source: 'GitHub', color: '#2088ff', year: '2021' },
  { id: '15', name: 'Whisper V3', category: '语音技术', description: '语音识别模型', features: ['多语言', '高精度', '实时转录'], link: 'https://openai.com/research/whisper', source: 'OpenAI', color: '#10a37f', year: '2023' },
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
  const [skills, setSkills] = useState<SkillOrPlugin[]>([]);
  const [plugins, setPlugins] = useState<SkillOrPlugin[]>([]);

  const loadData = () => {
    setLoading(true);
    const now = new Date();
    setLastUpdate(now.toLocaleString('zh-CN'));
    
    // 获取热点文章
    request.get('/ai-news/hot').then((res: any) => {
      if (res.code === 200 && res.data) setHotArticles(res.data);
    }).catch(() => {});

    // 获取新技术
    request.get('/ai-news/new-tech').then((res: any) => {
      if (res.code === 200 && res.data) setNewTech(res.data);
    }).catch(() => {});

    // 获取 Skills
    request.get('/ai-resources/skills').then((res: any) => {
      if (res.code === 200 && res.data) setSkills(res.data);
    }).catch(() => {});

    // 获取 Plugins
    request.get('/ai-resources/plugins').then((res: any) => {
      if (res.code === 200 && res.data) setPlugins(res.data);
    }).catch(() => {});

    setLoading(false);
  };

  useEffect(() => {
    loadData();
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
    { key: 'skills', label: <span><AppstoreOutlined /> Top Skills</span> },
    { key: 'plugins', label: <span><ToolOutlined /> DeepSeek Harness</span> },
  ];

  const getTrendTag = (trend: string) => {
    if (trend === 'rising') return <Tag color="red">🔥 上升中</Tag>;
    if (trend === 'popular') return <Tag color="green">🔥 热门</Tag>;
    return <Tag>{trend}</Tag>;
  };

  const techTab = (
    <div>
      <div style={{ marginBottom: 16 }}>
        <Space wrap>
          <Tag color={activeCategory === 'all' ? '#1890ff' : undefined} style={{ cursor: 'pointer', padding: '4px 12px' }} onClick={() => setActiveCategory('all')}>全部</Tag>
          {categoryCounts.map(cat => (
            <Tag key={cat.name} color={activeCategory === cat.name ? cat.color : undefined} style={{ cursor: 'pointer', padding: '4px 12px' }} onClick={() => setActiveCategory(cat.name)}>{cat.name} ({cat.count})</Tag>
          ))}
        </Space>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
        {filteredData.map(item => (
          <Card key={item.id} hoverable style={{ borderTop: `3px solid ${item.color}` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
              <div>
                <a href={item.link} target="_blank" rel="noopener noreferrer" style={{ color: item.color, textDecoration: 'none' }}><h3 style={{ margin: '0 0 8px', color: item.color }}>{item.name} ↗</h3></a>
                <Space><Tag color={categoryColors[item.category]}>{item.category}</Tag><Tag>{item.year}</Tag></Space>
              </div>
            <div style={{ marginTop: 8, fontSize: 12, color: '#999' }}>来源: {item.source}</div>
              <RobotOutlined style={{ fontSize: 24, color: item.color }} />
            </div>
            <div style={{ marginTop: 8, fontSize: 12, color: '#999' }}>来源: {item.source}</div>
            <p style={{ color: '#666', margin: '0 0 12px', fontSize: 14 }}>{item.description}</p>
            <div>{item.features.map((f, i) => <Tag key={i} style={{ marginBottom: 4 }}>{f}</Tag>)}</div>
            <div style={{ marginTop: 8, fontSize: 12, color: '#999' }}>来源: {item.source}</div>
          </Card>
        ))}
      </div>
    </div>
  );

  const hotTab = (
    <Card title="🔥 AI热点文章" extra={<Button icon={<ReloadOutlined />} onClick={loadData} size="small">刷新</Button>}>
      {hotArticles.length > 0 ? (
        <List dataSource={hotArticles} renderItem={(item) => (
          <List.Item>
            <List.Item.Meta
              title={<Space>{item.hot && <Tag color="red">热门</Tag>}<a href={item.link} target="_blank" rel="noopener noreferrer">{item.title} ↗</a></Space>}
              description={<div><p style={{ margin: '4px 0' }}>{item.summary}</p><Space><Tag color={categoryColors[item.category] || '#666'}>{item.category}</Tag><span style={{ color: '#999', fontSize: 12 }}>{item.date}</span></Space><div style={{ marginTop: 4, fontSize: 12, color: '#999' }}>来源: {item.source}</div></div>}
            />
          </List.Item>
        )} />
      ) : (
        <div style={{ textAlign: 'center', padding: 40, color: '#999' }}>暂无数据</div>
      )}
    </Card>
  );

  const newTechTab = (
    <Card title="🚀 新技术发布" extra={<Button icon={<ReloadOutlined />} onClick={loadData} size="small">刷新</Button>}>
      {newTech.length > 0 ? (
        <List dataSource={newTech} renderItem={(item) => (
          <List.Item>
            <List.Item.Meta
              title={<Space>{item.isNew && <Tag color="green">新发布</Tag>}<a href={item.link} target="_blank" rel="noopener noreferrer">{item.name} ↗</a><Tag color="blue">{item.source}</Tag></Space>}
              description={<div><p style={{ margin: '4px 0' }}>{item.description}</p><span style={{ color: '#999', fontSize: 12 }}>发布日期: {item.date}</span></div>}
            />
          </List.Item>
        )} />
      ) : (
        <div style={{ textAlign: 'center', padding: 40, color: '#999' }}>暂无数据</div>
      )}
    </Card>
  );

  const skillsTab = (
    <Card title="🎯 Top50 Skills" extra={<Button icon={<ReloadOutlined />} onClick={loadData} size="small">刷新</Button>}>
      {skills.length > 0 ? (
        <List dataSource={skills} renderItem={(item, index) => (
          <List.Item>
            <List.Item.Meta
              title={
                <Space>
                  <span style={{ color: '#1890ff', fontWeight: 'bold' }}>#{index + 1}</span>
                  <a href={item.link} target="_blank" rel="noopener noreferrer">{item.name} ↗</a>
                  <Tag color="blue">{item.source}</Tag>
                  {getTrendTag(item.trend)}
                </Space>
              }
              description={
                <div>
                  <p style={{ margin: '4px 0' }}>{item.description}</p>
                  <Space>
                    <span>⭐ {item.rating}</span>
                    <span>🔥 {item.usage.toLocaleString()} 次使用</span>
                  </Space>
                </div>
              }
            />
          </List.Item>
        )} />
      ) : (
        <div style={{ textAlign: 'center', padding: 40, color: '#999' }}>暂无数据</div>
      )}
    </Card>
  );

  const pluginsTab = (
    <Card title="🔧 DeepSeek Harness" extra={<Button icon={<ReloadOutlined />} onClick={loadData} size="small">刷新</Button>}>
      {plugins.length > 0 ? (
        <List dataSource={plugins} renderItem={(item, index) => (
          <List.Item>
            <List.Item.Meta
              title={
                <Space>
                  <span style={{ color: '#722ed1', fontWeight: 'bold' }}>#{index + 1}</span>
                  <a href={item.link} target="_blank" rel="noopener noreferrer">{item.name} ↗</a>
                  <Tag color="purple">{item.source}</Tag>
                  {getTrendTag(item.trend)}
                </Space>
              }
              description={
                <div>
                  <p style={{ margin: '4px 0' }}>{item.description}</p>
                  <Space>
                    <span>⭐ {item.rating}</span>
                    <span>🔥 {item.usage.toLocaleString()} 次使用</span>
                  </Space>
                </div>
              }
            />
          </List.Item>
        )} />
      ) : (
        <div style={{ textAlign: 'center', padding: 40, color: '#999' }}>暂无数据</div>
      )}
    </Card>
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
          <Button icon={<ReloadOutlined />} onClick={loadData} loading={loading}>刷新</Button>
        </div>

        <Tabs activeKey={activeTab} onChange={setActiveTab} items={tabItems} style={{ marginBottom: 16 }} />

        {activeTab === 'tech' && techTab}
        {activeTab === 'hot' && hotTab}
        {activeTab === 'new' && newTechTab}
        {activeTab === 'skills' && skillsTab}
        {activeTab === 'plugins' && pluginsTab}
      </div>
    </MainLayout>
  );
};

export default AITechPage;
