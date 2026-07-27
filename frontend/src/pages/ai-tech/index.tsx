import React, { useState, useEffect } from 'react';
import { Card, Tag, Space, Button, Spin, message } from 'antd';
import { ReloadOutlined, RobotOutlined, ClockCircleOutlined } from '@ant-design/icons';
import MainLayout from '../../components/layout/MainLayout';

// AI技术数据接口
interface AITechItem {
  id: string;
  name: string;
  category: string;
  description: string;
  features: string[];
  link: string;
  color: string;
}

// AI技术数据（模拟实时数据）
const aiTechData: AITechItem[] = [
  {
    id: '1',
    name: 'GPT-4o',
    category: '大语言模型',
    description: 'OpenAI最新的多模态大模型，支持文本、图像、音频的输入输出，具备强大的推理能力。',
    features: ['多模态输入输出', '实时语音对话', '视觉理解', '代码生成'],
    link: 'https://openai.com/gpt-4o',
    color: '#10a37f'
  },
  {
    id: '2',
    name: 'Claude 3.5 Sonnet',
    category: '大语言模型',
    description: 'Anthropic推出的高性能AI助手，在编程、分析、写作等方面表现出色。',
    features: ['长上下文支持', '代码理解', '安全对齐', '多语言'],
    link: 'https://claude.ai',
    color: '#d97706'
  },
  {
    id: '3',
    name: 'Gemini 1.5 Pro',
    category: '大语言模型',
    description: 'Google DeepMind开发的多模态AI模型，支持超长上下文窗口。',
    features: ['100万token上下文', '多模态理解', '代码生成', '知识推理'],
    link: 'https://gemini.google.com',
    color: '#4285f4'
  },
  {
    id: '4',
    name: 'Llama 3.1',
    category: '开源模型',
    description: 'Meta开源的大语言模型，提供多种参数规模，性能接近闭源模型。',
    features: ['开源免费', '多尺寸', '本地部署', '社区支持'],
    link: 'https://llama.meta.com',
    color: '#1877f2'
  },
  {
    id: '5',
    name: 'DeepSeek-V2',
    category: '开源模型',
    description: '深度求索开发的高性能MoE模型，以极低成本实现优秀性能。',
    features: ['MoE架构', '低成本', '中文优化', '代码能力强'],
    link: 'https://deepseek.com',
    color: '#0066ff'
  },
  {
    id: '6',
    name: 'Qwen2.5',
    category: '开源模型',
    description: '阿里云通义千问系列最新模型，中文能力突出。',
    features: ['中文优化', '工具调用', '多模态', '长文本'],
    link: 'https://qwen.aliyun.com',
    color: '#ff6a00'
  },
  {
    id: '7',
    name: 'AutoGPT',
    category: 'AI Agent',
    description: '自主AI代理框架，能够自主规划和执行复杂任务。',
    features: ['任务规划', '自主执行', '工具使用', '持续学习'],
    link: 'https://agpt.co',
    color: '#00897b'
  },
  {
    id: '8',
    name: 'LangChain',
    category: 'AI Agent',
    description: '构建LLM应用的框架，支持链式调用、工具集成、记忆管理。',
    features: ['链式调用', '工具集成', '记忆管理', 'RAG支持'],
    link: 'https://langchain.com',
    color: '#1c3d5a'
  },
  {
    id: '9',
    name: 'CrewAI',
    category: 'AI Agent',
    description: '多智能体协作框架，支持多个AI角色协同完成复杂任务。',
    features: ['多角色协作', '任务分配', '角色定义', '流程编排'],
    link: 'https://crewai.com',
    color: '#7c3aed'
  },
  {
    id: '10',
    name: 'DALL-E 3',
    category: '图像生成',
    description: 'OpenAI的文生图模型，能根据文字描述生成高质量图像。',
    features: ['文生图', '风格控制', '高分辨率', '细节丰富'],
    link: 'https://openai.com/dall-e-3',
    color: '#10a37f'
  },
  {
    id: '11',
    name: 'Midjourney V6',
    category: '图像生成',
    description: '强大的AI绘画工具，生成艺术风格图像的首选。',
    features: ['艺术风格', '高画质', '风格多样', '社区活跃'],
    link: 'https://midjourney.com',
    color: '#5865f2'
  },
  {
    id: '12',
    name: 'Sora',
    category: '视频生成',
    description: 'OpenAI的文生视频模型，能生成高质量的60秒视频。',
    features: ['文生视频', '长视频', '物理模拟', '高质量'],
    link: 'https://openai.com/sora',
    color: '#10a37f'
  },
  {
    id: '13',
    name: 'Cursor',
    category: 'AI编程',
    description: 'AI驱动的代码编辑器，大幅提升编程效率。',
    features: ['代码补全', '智能重构', '对话编程', '代码解释'],
    link: 'https://cursor.sh',
    color: '#000000'
  },
  {
    id: '14',
    name: 'GitHub Copilot',
    category: 'AI编程',
    description: 'GitHub的AI编程助手，在IDE中提供智能代码建议。',
    features: ['代码补全', '多语言支持', '上下文理解', 'IDE集成'],
    link: 'https://github.com/features/copilot',
    color: '#2088ff'
  },
  {
    id: '15',
    name: 'Whisper V3',
    category: '语音技术',
    description: 'OpenAI的语音识别模型，支持多语言高精度转录。',
    features: ['多语言', '高精度', '实时转录', '开源'],
    link: 'https://openai.com/research/whisper',
    color: '#10a37f'
  },
];

// 分类颜色
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
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [lastUpdate, setLastUpdate] = useState<string>('');
  const [loading, setLoading] = useState(false);

  // 加载数据
  const loadData = () => {
    setLoading(true);
    const now = new Date();
    setLastUpdate(now.toLocaleString('zh-CN'));
    localStorage.setItem('ai_tech_last_update', now.toISOString());
    setTimeout(() => {
      setLoading(false);
      message.success('数据已刷新');
    }, 500);
  };

  // 检查是否需要刷新
  useEffect(() => {
    const lastUpdateStr = localStorage.getItem('ai_tech_last_update');
    if (lastUpdateStr) {
      const lastUpdateDate = new Date(lastUpdateStr);
      const now = new Date();
      const hoursDiff = (now.getTime() - lastUpdateDate.getTime()) / (1000 * 60 * 60);
      
      setLastUpdate(lastUpdateDate.toLocaleString('zh-CN'));
      
      // 如果超过3小时，自动刷新
      if (hoursDiff >= 3) {
        loadData();
      }
    } else {
      loadData();
    }

    // 设置定时器，每3小时检查一次
    const interval = setInterval(() => {
      loadData();
    }, 3 * 60 * 60 * 1000); // 3小时

    return () => clearInterval(interval);
  }, []);

  // 获取分类列表
  const categories = Array.from(new Set(aiTechData.map(item => item.category)));

  // 过滤数据
  const filteredData = selectedCategory === 'all'
    ? aiTechData
    : aiTechData.filter(item => item.category === selectedCategory);

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
          <Button
            icon={<ReloadOutlined spin={loading} />}
            onClick={loadData}
            loading={loading}
          >
            刷新数据
          </Button>
        </div>

        {/* 分类筛选 */}
        <div style={{ marginBottom: 16 }}>
          <Space wrap>
            <Tag
              color={selectedCategory === 'all' ? '#1890ff' : undefined}
              style={{ cursor: 'pointer', padding: '4px 12px' }}
              onClick={() => setSelectedCategory('all')}
            >
              全部
            </Tag>
            {categories.map(category => (
              <Tag
                key={category}
                color={selectedCategory === category ? categoryColors[category] : undefined}
                style={{ cursor: 'pointer', padding: '4px 12px' }}
                onClick={() => setSelectedCategory(category)}
              >
                {category}
              </Tag>
            ))}
          </Space>
        </div>

        {/* 统计信息 */}
        <div style={{ marginBottom: 16, display: 'flex', gap: 16 }}>
          {categories.map(category => {
            const count = aiTechData.filter(item => item.category === category).length;
            return (
              <Tag key={category} color={categoryColors[category]}>
                {category}: {count}个
              </Tag>
            );
          })}
        </div>

        {/* 技术卡片 */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: 100 }}>
            <Spin size="large" />
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: 16 }}>
            {filteredData.map(item => (
              <Card
                key={item.id}
                hoverable
                style={{ borderTop: `3px solid ${item.color}` }}
                onClick={() => window.open(item.link, '_blank')}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                  <div>
                    <h3 style={{ margin: '0 0 8px', color: item.color }}>{item.name}</h3>
                    <Tag color={categoryColors[item.category]}>{item.category}</Tag>
                  </div>
                  <RobotOutlined style={{ fontSize: 24, color: item.color }} />
                </div>
                <p style={{ color: '#666', margin: '0 0 12px', fontSize: 14 }}>{item.description}</p>
                <div>
                  {item.features.map((feature, idx) => (
                    <Tag key={idx} style={{ marginBottom: 4 }}>{feature}</Tag>
                  ))}
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </MainLayout>
  );
};

export default AITechPage;
