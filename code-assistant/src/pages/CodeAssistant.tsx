import React, { useState, useRef, useEffect } from 'react';
import {
  Card,
  Input,
  Button,
  Select,
  Space,
  Tabs,
  message,
  Spin,
  Typography,
  Tooltip,
  Divider,
} from 'antd';
import {
  CodeOutlined,
  SearchOutlined,
  BugOutlined,
  ExperimentOutlined,
  SendOutlined,
  ClearOutlined,
  ThunderboltOutlined,
  CheckCircleOutlined,
  LoadingOutlined,
  RobotOutlined,

} from '@ant-design/icons';
import axios from 'axios';

const { TextArea } = Input;
const { Title } = Typography;
const { TabPane } = Tabs;

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

interface PipelineResult {
  analysis?: string;
  code?: string;
  final_code?: string;
  tests?: string;
  [key: string]: any;
}

const API_BASE = '/api';

const AGENTS = [
  { key: 'analyst', name: '需求分析师', icon: '📋', color: '#1677ff' },
  { key: 'coder', name: '高级程序员', icon: '💻', color: '#52c41a' },
  { key: 'reviewer', name: '代码审查员', icon: '🔍', color: '#faad14' },
  { key: 'tester', name: '测试工程师', icon: '✅', color: '#722ed1' },
  { key: 'debugger', name: '调试专家', icon: '🐛', color: '#f5222d' },
];

const LANGUAGES = [
  { value: 'java', label: 'Java' },
  { value: 'python', label: 'Python' },
  { value: 'typescript', label: 'TypeScript' },
  { value: 'javascript', label: 'JavaScript' },
  { value: 'go', label: 'Go' },
  { value: 'rust', label: 'Rust' },
  { value: 'c++', label: 'C++' },
  { value: 'c#', label: 'C#' },
  { value: 'php', label: 'PHP' },
  { value: 'ruby', label: 'Ruby' },
  { value: 'swift', label: 'Swift' },
  { value: 'kotlin', label: 'Kotlin' },
];

const CodeAssistant: React.FC = () => {
  // 状态
  const [requirement, setRequirement] = useState('');
  const [language, setLanguage] = useState('java');
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('chat');
  
  // 聊天模式
  const [selectedAgent, setSelectedAgent] = useState('coder');
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  
  // 流水线模式
  const [pipelineResult, setPipelineResult] = useState<PipelineResult>({});
  const [pipelineStep, setPipelineStep] = useState(0);
  const [pipelineRunning, setPipelineRunning] = useState(false);
  
  // 聊天区域引用
  const chatEndRef = useRef<HTMLDivElement>(null);

  // 滚动到底部
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  // 清除历史
  const handleClearHistory = async () => {
    try {
      await axios.post(`${API_BASE}/clear-history?role=all`);
      setChatMessages([]);
      message.success('历史已清除');
    } catch (error) {
      message.error('清除失败');
    }
  };

  // 聊天发送
  const handleChatSend = async () => {
    if (!chatInput.trim()) return;
    
    const userMessage: ChatMessage = {
      role: 'user',
      content: chatInput,
      timestamp: Date.now(),
    };
    
    setChatMessages(prev => [...prev, userMessage]);
    setChatInput('');
    setLoading(true);
    
    try {
      const res = await axios.post(`${API_BASE}/chat`, {
        message: chatInput,
        role: selectedAgent,
        language,
      });
      
      const assistantMessage: ChatMessage = {
        role: 'assistant',
        content: res.data.data.response,
        timestamp: Date.now(),
      };
      
      setChatMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      message.error('请求失败，请检查服务是否启动');
    }
    
    setLoading(false);
  };

  // 快速操作
  const handleQuickAction = async (action: string) => {
    if (!requirement.trim()) {
      message.warning('请先输入需求描述');
      return;
    }
    
    setLoading(true);
    
    try {
      let endpoint = '';
      let data = { requirement, language };
      
      switch (action) {
        case 'analyze':
          endpoint = '/analyze';
          break;
        case 'generate':
          endpoint = '/generate';
          break;
        case 'review':
          endpoint = '/review';
          data = { code: requirement, language } as any;
          break;
        case 'test':
          endpoint = '/test';
          data = { code: requirement, language } as any;
          break;
        case 'debug':
          endpoint = '/debug';
          break;
      }
      
      const res = await axios.post(`${API_BASE}${endpoint}`, data);
      const result = res.data.data;
      
      // 显示结果
      const resultContent = Object.entries(result)
        .map(([key, value]) => `### ${key}\n${value}`)
        .join('\n\n');
      
      setChatMessages(prev => [
        ...prev,
        {
          role: 'user',
          content: `[${action}] ${requirement}`,
          timestamp: Date.now(),
        },
        {
          role: 'assistant',
          content: resultContent,
          timestamp: Date.now(),
        },
      ]);
      
      setActiveTab('chat');
      message.success('操作完成');
    } catch (error) {
      message.error('操作失败');
    }
    
    setLoading(false);
  };

  // 完整流水线
  const handlePipeline = async () => {
    if (!requirement.trim()) {
      message.warning('请先输入需求描述');
      return;
    }
    
    setPipelineRunning(true);
    setPipelineStep(1);
    setPipelineResult({});
    
    try {
      // 步骤1: 需求分析
      setPipelineStep(1);
      const analyzeRes = await axios.post(`${API_BASE}/analyze`, {
        requirement,
        language,
      });
      setPipelineResult(prev => ({
        ...prev,
        analysis: analyzeRes.data.data.analysis,
      }));
      
      // 步骤2: 代码生成
      setPipelineStep(2);
      const generateRes = await axios.post(`${API_BASE}/generate`, {
        requirement: analyzeRes.data.data.analysis,
        language,
      });
      setPipelineResult(prev => ({
        ...prev,
        code: generateRes.data.data.code,
      }));
      
      // 步骤3: 代码审查
      setPipelineStep(3);
      const reviewRes = await axios.post(`${API_BASE}/review`, {
        code: generateRes.data.data.code,
        language,
      });
      setPipelineResult(prev => ({
        ...prev,
        review: reviewRes.data.data.review,
      }));
      
      // 步骤4: 测试生成
      setPipelineStep(4);
      const testRes = await axios.post(`${API_BASE}/test`, {
        code: generateRes.data.data.code,
        language,
      });
      setPipelineResult(prev => ({
        ...prev,
        tests: testRes.data.data.tests,
        final_code: generateRes.data.data.code,
      }));
      
      setPipelineStep(5);
      message.success('流水线执行完成！');
    } catch (error) {
      message.error('流水线执行失败');
    }
    
    setPipelineRunning(false);
  };

  // 渲染Markdown内容
  const renderMarkdown = (content: string) => {
    // 简单的Markdown渲染
    return content
      .replace(/```(\w+)?\n([\s\S]*?)```/g, '<pre><code>$2</code></pre>')
      .replace(/`([^`]+)`/g, '<code>$1</code>')
      .replace(/## (.+)/g, '<h2>$1</h2>')
      .replace(/### (.+)/g, '<h3>$1</h3>')
      .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
      .replace(/\n/g, '<br/>');
  };

  return (
    <div className="app-container">
      {/* 头部 */}
      <div className="header">
        <Space>
          <RobotOutlined style={{ fontSize: 28, color: '#1677ff' }} />
          <Title level={3} style={{ margin: 0 }}>
            AI 代码助手
          </Title>
        </Space>
        <Space>
          <Select
            value={language}
            onChange={setLanguage}
            style={{ width: 120 }}
            options={LANGUAGES}
          />
          <Tooltip title="清除历史">
            <Button
              icon={<ClearOutlined />}
              onClick={handleClearHistory}
            />
          </Tooltip>
        </Space>
      </div>

      <div className="main-content">
        {/* 输入区域 */}
        <Card className="input-section">
          <TextArea
            rows={4}
            placeholder="描述你的开发需求，例如：写一个用户登录API，支持JWT认证..."
            value={requirement}
            onChange={e => setRequirement(e.target.value)}
            style={{ marginBottom: 16 }}
          />
          
          <Space wrap>
            <Button
              type="primary"
              icon={<SearchOutlined />}
              onClick={() => handleQuickAction('analyze')}
              loading={loading}
            >
              分析需求
            </Button>
            <Button
              icon={<CodeOutlined />}
              onClick={() => handleQuickAction('generate')}
              loading={loading}
            >
              生成代码
            </Button>
            <Button
              icon={<BugOutlined />}
              onClick={() => handleQuickAction('review')}
              loading={loading}
            >
              代码审查
            </Button>
            <Button
              icon={<ExperimentOutlined />}
              onClick={() => handleQuickAction('test')}
              loading={loading}
            >
              生成测试
            </Button>
            <Divider type="vertical" />
            <Button
              type="primary"
              size="large"
              icon={<ThunderboltOutlined />}
              onClick={handlePipeline}
              loading={pipelineRunning}
              style={{
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                border: 'none',
              }}
            >
              一键执行流水线
            </Button>
          </Space>
        </Card>

        {/* 结果展示 */}
        <Card className="result-section">
          <Tabs activeKey={activeTab} onChange={setActiveTab}>
            {/* 聊天模式 */}
            <TabPane
              tab={
                <span>
                  <SendOutlined /> 智能对话
                </span>
              }
              key="chat"
            >
              {/* Agent选择器 */}
              <div className="agent-selector">
                {AGENTS.map(agent => (
                  <div
                    key={agent.key}
                    className={`agent-btn ${selectedAgent === agent.key ? 'active' : ''}`}
                    onClick={() => setSelectedAgent(agent.key)}
                  >
                    <span>{agent.icon}</span>
                    <span style={{ marginLeft: 4 }}>{agent.name}</span>
                  </div>
                ))}
              </div>

              {/* 聊天区域 */}
              <div className="chat-container">
                {chatMessages.length === 0 && (
                  <div style={{ textAlign: 'center', color: '#999', padding: 40 }}>
                    <RobotOutlined style={{ fontSize: 48, marginBottom: 16 }} />
                    <div>选择一个Agent开始对话</div>
                  </div>
                )}
                
                {chatMessages.map((msg, index) => (
                  <div
                    key={index}
                    className={`chat-message ${msg.role}`}
                  >
                    <div className={`chat-bubble ${msg.role}`}>
                      {msg.role === 'assistant' ? (
                        <div
                          className="markdown-content"
                          dangerouslySetInnerHTML={{
                            __html: renderMarkdown(msg.content),
                          }}
                        />
                      ) : (
                        msg.content
                      )}
                    </div>
                  </div>
                ))}
                
                {loading && (
                  <div className="chat-message assistant">
                    <div className="chat-bubble assistant">
                      <Spin size="small" /> 思考中...
                    </div>
                  </div>
                )}
                
                <div ref={chatEndRef} />
              </div>

              {/* 输入框 */}
              <Space.Compact style={{ width: '100%' }}>
                <Input
                  placeholder={`向 ${AGENTS.find(a => a.key === selectedAgent)?.name} 提问...`}
                  value={chatInput}
                  onChange={e => setChatInput(e.target.value)}
                  onPressEnter={handleChatSend}
                  size="large"
                />
                <Button
                  type="primary"
                  icon={<SendOutlined />}
                  onClick={handleChatSend}
                  loading={loading}
                  size="large"
                >
                  发送
                </Button>
              </Space.Compact>
            </TabPane>

            {/* 流水线模式 */}
            <TabPane
              tab={
                <span>
                  <ThunderboltOutlined /> 流水线
                </span>
              }
              key="pipeline"
            >
              {/* 步骤指示器 */}
              <div className="pipeline-steps">
                {[
                  { step: 1, name: '需求分析', icon: '📋' },
                  { step: 2, name: '代码生成', icon: '💻' },
                  { step: 3, name: '代码审查', icon: '🔍' },
                  { step: 4, name: '测试生成', icon: '✅' },
                ].map(item => (
                  <div
                    key={item.step}
                    className={`step-card ${
                      pipelineStep === item.step
                        ? 'active'
                        : pipelineStep > item.step
                        ? 'completed'
                        : ''
                    }`}
                  >
                    <div className="step-icon">
                      {pipelineStep > item.step ? (
                        <CheckCircleOutlined style={{ color: '#52c41a' }} />
                      ) : pipelineStep === item.step ? (
                        <LoadingOutlined style={{ color: '#1677ff' }} />
                      ) : (
                        item.icon
                      )}
                    </div>
                    <div className="step-name">{item.name}</div>
                  </div>
                ))}
              </div>

              {/* 流水线结果 */}
              {pipelineResult.analysis && (
                <Card title="📋 需求分析" size="small" style={{ marginBottom: 16 }}>
                  <div
                    className="markdown-content"
                    dangerouslySetInnerHTML={{
                      __html: renderMarkdown(pipelineResult.analysis),
                    }}
                  />
                </Card>
              )}

              {(pipelineResult.code || pipelineResult.final_code) && (
                <Card title="💻 生成代码" size="small" style={{ marginBottom: 16 }}>
                  <pre className="code-block">
                    {pipelineResult.final_code || pipelineResult.code}
                  </pre>
                </Card>
              )}

              {pipelineResult.review && (
                <Card title="🔍 代码审查" size="small" style={{ marginBottom: 16 }}>
                  <div
                    className="markdown-content"
                    dangerouslySetInnerHTML={{
                      __html: renderMarkdown(pipelineResult.review),
                    }}
                  />
                </Card>
              )}

              {pipelineResult.tests && (
                <Card title="✅ 测试代码" size="small">
                  <pre className="code-block">
                    {pipelineResult.tests}
                  </pre>
                </Card>
              )}

              {!pipelineResult.analysis && !pipelineRunning && (
                <div style={{ textAlign: 'center', padding: 40, color: '#999' }}>
                  <ExperimentOutlined style={{ fontSize: 48, marginBottom: 16 }} />
                  <div>输入需求后点击"一键执行流水线"</div>
                </div>
              )}
            </TabPane>
          </Tabs>
        </Card>
      </div>
    </div>
  );
};

export default CodeAssistant;
