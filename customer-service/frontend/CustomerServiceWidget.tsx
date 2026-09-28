/**
 * 智能客服对话窗口组件
 * 可嵌入任何React应用
 */
import React, { useState, useRef, useEffect } from 'react';
import { Input, Button, Avatar, Spin, Tag, Rate, Modal } from 'antd';
import { SendOutlined, UserOutlined, RobotOutlined, CustomerServiceOutlined } from '@ant-design/icons';

interface Message {
  id: string;
  role: 'user' | 'ai' | 'agent' | 'system';
  content: string;
  timestamp: Date;
  citations?: Array<{filename: string; score: number}>;
}

interface Props {
  userId: string;
  userName?: string;
  apiUrl?: string;
}

const CustomerServiceWidget: React.FC<Props> = ({ userId, userName, apiUrl = '/cs-api' }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState<number | null>(null);
  const [status, setStatus] = useState<string>('active');
  const [showSatisfaction, setShowSatisfaction] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 自动滚动到底部
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // 初始化会话
  useEffect(() => {
    initSession();
  }, []);

  const initSession = async () => {
    try {
      const resp = await fetch(`${apiUrl}/api/cs/sessions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId, user_name: userName })
      });
      const data = await resp.json();
      setSessionId(data.id);
      setStatus(data.status);
      setMessages([{
        id: 'welcome',
        role: 'ai',
        content: '您好！我是智能客服助手，请问有什么可以帮您？',
        timestamp: new Date()
      }]);
    } catch (err) {
      console.error('初始化会话失败:', err);
    }
  };

  const sendMessage = async () => {
    if (!input.trim() || loading || !sessionId) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const resp = await fetch(`${apiUrl}/api/cs/sessions/${sessionId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: input })
      });
      const data = await resp.json();

      if (data.ai_reply) {
        const aiMsg: Message = {
          id: data.ai_reply.id?.toString() || Date.now().toString(),
          role: data.action === 'transfer_human' ? 'system' : 'ai',
          content: data.ai_reply.content,
          timestamp: new Date(),
          citations: data.citations
        };
        setMessages(prev => [...prev, aiMsg]);
      }

      if (data.action === 'transfer_human') {
        setStatus('waiting_human');
      }
    } catch (err) {
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        role: 'system',
        content: '发送失败，请重试',
        timestamp: new Date()
      }]);
    } finally {
      setLoading(false);
    }
  };

  const transferToHuman = async () => {
    if (!sessionId) return;
    await fetch(`${apiUrl}/api/cs/sessions/${sessionId}/transfer`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reason: 'user_request' })
    });
    setStatus('waiting_human');
    setMessages(prev => [...prev, {
      id: Date.now().toString(),
      role: 'system',
      content: '正在为您转接人工客服，请稍候...',
      timestamp: new Date()
    }]);
  };

  return (
    <div style={{ width: 400, height: 600, border: '1px solid #e8e8e8', borderRadius: 8, display: 'flex', flexDirection: 'column' }}>
      {/* 头部 */}
      <div style={{ padding: '12px 16px', background: '#1890ff', color: '#fff', borderRadius: '8px 8px 0 0' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span><CustomerServiceOutlined /> 智能客服</span>
          {status === 'active' && (
            <Button size="small" ghost onClick={transferToHuman}>转人工</Button>
          )}
          {status === 'human_handling' && <Tag color="green">人工服务中</Tag>}
        </div>
      </div>

      {/* 消息区 */}
      <div style={{ flex: 1, overflow: 'auto', padding: 16, background: '#f5f5f5' }}>
        {messages.map(msg => (
          <div key={msg.id} style={{
            marginBottom: 12,
            display: 'flex',
            justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start'
          }}>
            {msg.role !== 'user' && <Avatar size="small" icon={<RobotOutlined />} style={{ marginRight: 8 }} />}
            <div style={{
              maxWidth: '70%',
              padding: '8px 12px',
              borderRadius: 8,
              background: msg.role === 'user' ? '#1890ff' : '#fff',
              color: msg.role === 'user' ? '#fff' : '#333',
              boxShadow: '0 1px 2px rgba(0,0,0,0.1)'
            }}>
              {msg.content}
              {msg.citations && msg.citations.length > 0 && (
                <div style={{ marginTop: 8, fontSize: 12, opacity: 0.8 }}>
                  📎 {msg.citations.map(c => c.filename).join(', ')}
                </div>
              )}
            </div>
            {msg.role === 'user' && <Avatar size="small" icon={<UserOutlined />} style={{ marginLeft: 8 }} />}
          </div>
        ))}
        {loading && <Spin size="small" style={{ marginLeft: '50%' }} />}
        <div ref={messagesEndRef} />
      </div>

      {/* 输入区 */}
      <div style={{ padding: 12, borderTop: '1px solid #e8e8e8', display: 'flex', gap: 8 }}>
        <Input
          value={input}
          onChange={e => setInput(e.target.value)}
          onPressEnter={sendMessage}
          placeholder="输入问题..."
          disabled={loading}
        />
        <Button type="primary" icon={<SendOutlined />} onClick={sendMessage} loading={loading} />
      </div>
    </div>
  );
};

export default CustomerServiceWidget;
