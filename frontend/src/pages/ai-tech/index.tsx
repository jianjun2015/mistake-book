import React, { useState, useEffect } from 'react';
import { Card, Tag, Space, Button, Spin, message, Tabs } from 'antd';
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
  year: string;
}

// AI技术数据
const aiTechData: AITechItem[] = [
  // ========== 大语言模型 ==========
  {
    id: '1',
    name: 'GPT-4o',
    category: '大语言模型',
    description: 'OpenAI最新的多模态大模型，支持文本、图像、音频的输入输出，具备强大的推理能力。',
    features: ['多模态输入输出', '实时语音对话', '视觉理解', '代码生成'],
    link: 'https://openai.com/gpt-4o',
    color: '#10a37f',
    year: '2024'
  },
  {
    id: '2',
    name: 'Claude 3.5 Sonnet',
    category: '大语言模型',
    description: 'Anthropic推出的高性能AI助手，在编程、分析、写作等方面表现出色。',
    features: ['长上下文支持', '代码理解', '安全对齐', '多语言'],
    link: 'https://claude.ai',
    color: '#d97706',
    year: '2024'
  },
  {
    id: '3',
    name: 'Gemini 1.5 Pro',
    category: '大语言模型',
    description: 'Google DeepMind开发的多模态AI模型，支持超长上下文窗口。',
    features: ['100万token上下文', '多模态理解', '代码生成', '知识推理'],
    link: 'https://gemini.google.com',
    color: '#4285f4',
    year: '2024'
  },
  {
    id: '4',
    name: 'Grok-2',
    category: '大语言模型',
    description: 'xAI开发的AI模型，具有实时信息访问能力和幽默感。',
    features: ['实时信息', '幽默风格', '代码生成', '图像理解'],
    link: 'https://x.ai',
    color: '#1d9bf0',
    year: '2024'
  },
  {
    id: '5',
    name: '文心一言 4.0',
    category: '大语言模型',
    description: '百度推出的AI对话系统，中文理解能力强，支持多模态。',
    features: ['中文优化', '多模态', '知识问答', '创作辅助'],
    link: 'https://yiyan.baidu.com',
    color: '#2932e1',
    year: '2024'
  },
  {
    id: '6',
    name: '通义千问',
    category: '大语言模型',
    description: '阿里云推出的AI助手，支持多种场景应用。',
    features: ['多模态', '代码生成', '文档理解', '工具调用'],
    link: 'https://tongyi.aliyun.com',
    color: '#ff6a00',
    year: '2024'
  },
  {
    id: '7',
    name: 'Kimi',
    category: '大语言模型',
    description: '月之暗面推出的AI助手，擅长长文本理解和处理。',
    features: ['超长文本', '文档分析', '联网搜索', '多轮对话'],
    link: 'https://kimi.moonshot.cn',
    color: '#000000',
    year: '2024'
  },

  // ========== 开源模型 ==========
  {
    id: '10',
    name: 'Llama 3.1',
    category: '开源模型',
    description: 'Meta开源的大语言模型，提供多种参数规模，性能接近闭源模型。',
    features: ['开源免费', '多尺寸', '本地部署', '社区支持'],
    link: 'https://llama.meta.com',
    color: '#1877f2',
    year: '2024'
  },
  {
    id: '11',
    name: 'DeepSeek-V2',
    category: '开源模型',
    description: '深度求索开发的高性能MoE模型，以极低成本实现优秀性能。',
    features: ['MoE架构', '低成本', '中文优化', '代码能力强'],
    link: 'https://deepseek.com',
    color: '#0066ff',
    year: '2024'
  },
  {
    id: '12',
    name: 'Qwen2.5',
    category: '开源模型',
    description: '阿里云通义千问系列最新模型，中文能力突出。',
    features: ['中文优化', '工具调用', '多模态', '长文本'],
    link: 'https://qwen.aliyun.com',
    color: '#ff6a00',
    year: '2024'
  },
  {
    id: '13',
    name: 'Mistral Large',
    category: '开源模型',
    description: 'Mistral AI推出的高性能模型，欧洲AI领军者。',
    features: ['多语言', '代码生成', '推理能力', '工具使用'],
    link: 'https://mistral.ai',
    color: '#ff7000',
    year: '2024'
  },
  {
    id: '14',
    name: 'Phi-3',
    category: '开源模型',
    description: 'Microsoft推出的小型高效模型，适合边缘设备部署。',
    features: ['小体积', '高性能', '移动端', '本地运行'],
    link: 'https://microsoft.com/phi',
    color: '#00a4ef',
    year: '2024'
  },
  {
    id: '15',
    name: 'Yi-1.5',
    category: '开源模型',
    description: '零一万物推出的高性能开源模型，中文能力优秀。',
    features: ['中文优化', '长文本', '代码生成', '多语言'],
    link: 'https://01.ai',
    color: '#000000',
    year: '2024'
  },

  // ========== AI Agent ==========
  {
    id: '20',
    name: 'AutoGPT',
    category: 'AI Agent',
    description: '自主AI代理框架，能够自主规划和执行复杂任务。',
    features: ['任务规划', '自主执行', '工具使用', '持续学习'],
    link: 'https://agpt.co',
    color: '#00897b',
    year: '2023'
  },
  {
    id: '21',
    name: 'LangChain',
    category: 'AI Agent',
    description: '构建LLM应用的框架，支持链式调用、工具集成、记忆管理。',
    features: ['链式调用', '工具集成', '记忆管理', 'RAG支持'],
    link: 'https://langchain.com',
    color: '#1c3d5a',
    year: '2023'
  },
  {
    id: '22',
    name: 'CrewAI',
    category: 'AI Agent',
    description: '多智能体协作框架，支持多个AI角色协同完成复杂任务。',
    features: ['多角色协作', '任务分配', '角色定义', '流程编排'],
    link: 'https://crewai.com',
    color: '#7c3aed',
    year: '2024'
  },
  {
    id: '23',
    name: 'AutoGen',
    category: 'AI Agent',
    description: 'Microsoft推出的多智能体对话框架，支持复杂任务协作。',
    features: ['多智能体', '对话协作', '代码执行', '灵活定制'],
    link: 'https://microsoft.github.io/autogen/',
    color: '#00a4ef',
    year: '2023'
  },
  {
    id: '24',
    name: 'Dify',
    category: 'AI Agent',
    description: '开源的LLM应用开发平台，支持可视化编排AI工作流。',
    features: ['可视化编排', 'RAG支持', 'API发布', '插件系统'],
    link: 'https://dify.ai',
    color: '#000000',
    year: '2023'
  },
  {
    id: '25',
    name: 'Coze',
    category: 'AI Agent',
    description: '字节跳动推出的AI Bot开发平台，支持零代码构建AI应用。',
    features: ['零代码', '插件丰富', '多平台发布', '知识库'],
    link: 'https://coze.com',
    color: '#00f0ff',
    year: '2024'
  },
  {
    id: '26',
    name: 'MetaGPT',
    category: 'AI Agent',
    description: '多智能体元编程框架，模拟软件公司开发流程。',
    features: ['角色分工', '自动化开发', '文档生成', '代码审查'],
    link: 'https://github.com/geekan/MetaGPT',
    color: '#1877f2',
    year: '2023'
  },

  // ========== 图像生成 ==========
  {
    id: '30',
    name: 'DALL-E 3',
    category: '图像生成',
    description: 'OpenAI的文生图模型，能根据文字描述生成高质量图像。',
    features: ['文生图', '风格控制', '高分辨率', '细节丰富'],
    link: 'https://openai.com/dall-e-3',
    color: '#10a37f',
    year: '2023'
  },
  {
    id: '31',
    name: 'Midjourney V6',
    category: '图像生成',
    description: '强大的AI绘画工具，生成艺术风格图像的首选。',
    features: ['艺术风格', '高画质', '风格多样', '社区活跃'],
    link: 'https://midjourney.com',
    color: '#5865f2',
    year: '2024'
  },
  {
    id: '32',
    name: 'Stable Diffusion 3',
    category: '图像生成',
    description: 'Stability AI开源的图像生成模型，可本地部署。',
    features: ['开源免费', '本地部署', '插件丰富', '风格多样'],
    link: 'https://stability.ai',
    color: '#9333ea',
    year: '2024'
  },
  {
    id: '33',
    name: 'Flux',
    category: '图像生成',
    description: 'Black Forest Labs推出的图像生成模型，画质优秀。',
    features: ['高画质', '快速生成', '多风格', '开源'],
    link: 'https://blackforestlabs.ai',
    color: '#000000',
    year: '2024'
  },
  {
    id: '34',
    name: 'Ideogram',
    category: '图像生成',
    description: '擅长文字渲染的AI图像生成工具。',
    features: ['文字渲染', '海报设计', 'Logo生成', '高质量'],
    link: 'https://ideogram.ai',
    color: '#000000',
    year: '2024'
  },

  // ========== 视频生成 ==========
  {
    id: '40',
    name: 'Sora',
    category: '视频生成',
    description: 'OpenAI的文生视频模型，能生成高质量的60秒视频。',
    features: ['文生视频', '长视频', '物理模拟', '高质量'],
    link: 'https://openai.com/sora',
    color: '#10a37f',
    year: '2024'
  },
  {
    id: '41',
    name: 'Runway Gen-3',
    category: '视频生成',
    description: 'Runway推出的AI视频生成工具，支持多种视频编辑功能。',
    features: ['文生视频', '图生视频', '视频编辑', '风格转换'],
    link: 'https://runwayml.com',
    color: '#000000',
    year: '2024'
  },
  {
    id: '42',
    name: 'Pika',
    category: '视频生成',
    description: '简单易用的AI视频生成工具，支持多种创意功能。',
    features: ['文生视频', '图生视频', '视频编辑', '特效添加'],
    link: 'https://pika.art',
    color: '#000000',
    year: '2024'
  },
  {
    id: '43',
    name: 'Kling',
    category: '视频生成',
    description: '快手推出的AI视频生成工具，中文场景优化。',
    features: ['文生视频', '图生视频', '中文优化', '高质量'],
    link: 'https://kling.kuaishou.com',
    color: '#ff0000',
    year: '2024'
  },
  {
    id: '44',
    name: 'Vidu',
    category: '视频生成',
    description: '生数科技推出的AI视频生成工具，支持长视频生成。',
    features: ['长视频', '高画质', '多风格', '快速生成'],
    link: 'https://vidu.studio',
    color: '#000000',
    year: '2024'
  },

  // ========== AI编程 ==========
  {
    id: '50',
    name: 'Cursor',
    category: 'AI编程',
    description: 'AI驱动的代码编辑器，大幅提升编程效率。',
    features: ['代码补全', '智能重构', '对话编程', '代码解释'],
    link: 'https://cursor.sh',
    color: '#000000',
    year: '2024'
  },
  {
    id: '51',
    name: 'GitHub Copilot',
    category: 'AI编程',
    description: 'GitHub的AI编程助手，在IDE中提供智能代码建议。',
    features: ['代码补全', '多语言支持', '上下文理解', 'IDE集成'],
    link: 'https://github.com/features/copilot',
    color: '#2088ff',
    year: '2021'
  },
  {
    id: '52',
    name: 'Claude Code',
    category: 'AI编程',
    description: 'Anthropic推出的命令行AI编程工具，支持复杂的代码任务。',
    features: ['命令行', '代码生成', '调试', '重构'],
    link: 'https://claude.ai',
    color: '#d97706',
    year: '2024'
  },
  {
    id: '53',
    name: 'Windsurf',
    category: 'AI编程',
    description: 'Codeium推出的AI代码编辑器，支持智能补全和聊天。',
    features: ['智能补全', '代码聊天', '多语言', '免费使用'],
    link: 'https://codeium.com',
    color: '#000000',
    year: '2024'
  },
  {
    id: '54',
    name: 'v0',
    category: 'AI编程',
    description: 'Vercel推出的AI前端代码生成工具，快速生成UI组件。',
    features: ['UI生成', 'React代码', 'Tailwind CSS', '快速原型'],
    link: 'https://v0.dev',
    color: '#000000',
    year: '2024'
  },

  // ========== 语音技术 ==========
  {
    id: '60',
    name: 'Whisper V3',
    category: '语音技术',
    description: 'OpenAI的语音识别模型，支持多语言高精度转录。',
    features: ['多语言', '高精度', '实时转录', '开源'],
    link: 'https://openai.com/research/whisper',
    color: '#10a37f',
    year: '2023'
  },
  {
    id: '61',
    name: 'ElevenLabs',
    category: '语音技术',
    description: '高质量的AI语音合成平台，支持声音克隆。',
    features: ['语音合成', '声音克隆', '多语言', '情感表达'],
    link: 'https://elevenlabs.io',
    color: '#000000',
    year: '2023'
  },
  {
    id: '62',
    name: 'Fish Speech',
    category: '语音技术',
    description: '开源的语音合成模型，支持中英文高质量合成。',
    features: ['开源', '中英文', '高质量', '本地部署'],
    link: 'https://fish.audio',
    color: '#000000',
    year: '2024'
  },
  {
    id: '63',
    name: 'GPT-SoVITS',
    category: '语音技术',
    description: '开源的声音克隆工具，少量音频即可克隆声音。',
    features: ['声音克隆', '少量样本', '开源', '中文支持'],
    link: 'https://github.com/RVC-Boss/GPT-SoVITS',
    color: '#000000',
    year: '2024'
  },

  // ========== RAG & 知识库 ==========
  {
    id: '70',
    name: 'RAGFlow',
    category: 'RAG & 知识库',
    description: '开源的RAG引擎，支持深度文档理解和检索。',
    features: ['文档理解', '智能检索', '开源', '多格式支持'],
    link: 'https://github.com/infiniflow/ragflow',
    color: '#000000',
    year: '2024'
  },
  {
    id: '71',
    name: 'FastGPT',
    category: 'RAG & 知识库',
    description: '开源的AI知识库平台，支持可视化编排和知识管理。',
    features: ['知识库', '可视化编排', 'API发布', '多模型支持'],
    link: 'https://fastgpt.in',
    color: '#000000',
    year: '2023'
  },
  {
    id: '72',
    name: 'MaxKB',
    category: 'RAG & 知识库',
    description: '开源的知识库问答系统，支持多种文档格式。',
    features: ['知识库', '问答系统', '多格式', '开源'],
    link: 'https://github.com/1Panel-dev/MaxKB',
    color: '#000000',
    year: '2024'
  },

  // ========== 向量数据库 ==========
  {
    id: '80',
    name: 'Milvus',
    category: '向量数据库',
    description: '开源的向量数据库，专为AI应用设计。',
    features: ['高性能', '可扩展', '开源', '云原生'],
    link: 'https://milvus.io',
    color: '#000000',
    year: '2019'
  },
  {
    id: '81',
    name: 'Chroma',
    category: '向量数据库',
    description: '轻量级向量数据库，适合快速开发和原型验证。',
    features: ['轻量级', '易使用', '开源', 'Python友好'],
    link: 'https://www.trychroma.com',
    color: '#000000',
    year: '2022'
  },
  {
    id: '82',
    name: 'Qdrant',
    category: '向量数据库',
    description: '高性能向量数据库，支持丰富的过滤和搜索功能。',
    features: ['高性能', '丰富过滤', '开源', 'Rust实现'],
    link: 'https://qdrant.tech',
    color: '#000000',
    year: '2021'
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
  'RAG & 知识库': '#2f54eb',
  '向量数据库': '#f5222d',
};

const AITechPage: React.FC = () => {
  const [lastUpdate, setLastUpdate] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('all');

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
      
      if (hoursDiff >= 3) {
        loadData();
      }
    } else {
      loadData();
    }

    const interval = setInterval(() => {
      loadData();
    }, 3 * 60 * 60 * 1000);

    return () => clearInterval(interval);
  }, []);

  // 获取分类列表
  const categories = Array.from(new Set(aiTechData.map(item => item.category)));

  // 过滤数据
  const filteredData = activeTab === 'all'
    ? aiTechData
    : aiTechData.filter(item => item.category === activeTab);

  // 统计每个分类的数量
  const categoryCounts = categories.map(cat => ({
    name: cat,
    count: aiTechData.filter(item => item.category === cat).length,
    color: categoryColors[cat] || '#666'
  }));

  const tabItems = [
    { key: 'all', label: `全部 (${aiTechData.length})` },
    ...categoryCounts.map(cat => ({
      key: cat.name,
      label: `${cat.name} (${cat.count})`,
    }))
  ];

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

        {/* 分类标签 */}
        <div style={{ marginBottom: 16 }}>
          <Space wrap>
            {categoryCounts.map(cat => (
              <Tag
                key={cat.name}
                color={activeTab === cat.name ? cat.color : undefined}
                style={{ cursor: 'pointer', padding: '4px 12px' }}
                onClick={() => setActiveTab(cat.name)}
              >
                {cat.name}: {cat.count}
              </Tag>
            ))}
          </Space>
        </div>

        {/* Tabs */}
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={tabItems}
          style={{ marginBottom: 16 }}
        />

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
                    <Space>
                      <Tag color={categoryColors[item.category]}>{item.category}</Tag>
                      <Tag>{item.year}</Tag>
                    </Space>
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
