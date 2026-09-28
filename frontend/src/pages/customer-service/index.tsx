/**
 * 智能客服页面
 */
import React, { useState, useRef, useEffect } from 'react';
import {
  Card, Input, Button, Avatar, Tag, Rate, Modal, Spin, Empty, message, Tooltip, Space
} from 'antd';
import {
  SendOutlined, UserOutlined, RobotOutlined, CustomerServiceOutlined,
  PhoneOutlined, StarOutlined, PlusOutlined
} from '@ant-design/icons';
import csRequest from '../../utils/csRequest';

interface Message {
  id: string;
  role: 'user' | 'ai' | 'agent' | 'system';
  content: string;
  timestamp: Date;
  citations?: Array<{filename: string; score: number}>;
}

const CustomerServicePage: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState<number | null>(null);
  const [status, setStatus] = useState<string>('active');
  const [showSatisfaction, setShowSatisfaction] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    initSession();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // 轮询会话状态和新消息（检测人工客服接入）
  useEffect(() => {
    if (!sessionId) return;
    const timer = setInterval(async () => {
      try {
        // 检查会话状态
        const session: any = await csRequest.get(`/sessions/${sessionId}`);
        const prevStatus = status;
        if (session.status !== prevStatus) {
          setStatus(session.status);
          if (session.status === 'human_handling') {
            setMessages(prev => [...prev, {
              id: Date.now().toString(),
              role: 'system',
              content: '人工客服已接入，正在为您服务！',
              timestamp: new Date()
            }]);
          }
        }
        // 人工处理中时轮询新消息
        if (session.status === 'human_handling') {
          const msgs: any = await csRequest.get(`/sessions/${sessionId}/messages`);
          if (msgs && msgs.length > messages.length) {
            // 只添加新的agent/system消息
            const newMsgs = msgs.slice(messages.length)
              .filter((m: any) => m.role === 'agent' || m.role === 'system')
              .map((m: any) => ({
                id: m.id?.toString() || Date.now().toString(),
                role: m.role,
                content: m.content,
                timestamp: new Date(m.created_at)
              }));
            if (newMsgs.length > 0) {
              setMessages(prev => [...prev, ...newMsgs]);
            }
          }
        }
      } catch (err) {}
    }, 5000); // 5秒轮询
    return () => clearInterval(timer);
  }, [sessionId, status, messages.length]);

  const initSession = async () => {
    try {
      const data: any = await csRequest.post('/sessions', {
        user_id: localStorage.getItem('user_id') || 'guest_' + Date.now(),
        user_name: localStorage.getItem('user_name') || '访客',
      });
      setSessionId(data.id);
      setStatus(data.status);
      setMessages([{
        id: 'welcome',
        role: 'ai',
        content: '您好！我是智能客服助手，请问有什么可以帮您？',
        timestamp: new Date()
      }]);
    } catch (err) {
      message.error('连接客服失败，请刷新重试');
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
      const data: any = await csRequest.post(`/sessions/${sessionId}/messages`, {
        content: input
      });

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
    try {
      await csRequest.post(`/sessions/${sessionId}/transfer`, {
        reason: 'user_request'
      });
      setStatus('waiting_human');
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        role: 'system',
        content: '正在为您转接人工客服，请稍候...',
        timestamp: new Date()
      }]);
    } catch (err) {
      message.error('转接失败，请重试');
    }
  };

  const submitSatisfaction = async (score: number) => {
    if (!sessionId) return;
    await csRequest.post(`/sessions/${sessionId}/satisfaction`, {
      score, comment: '用户评价'
    });
    setShowSatisfaction(false);
    message.success('感谢您的评价！');
  };

  const startNewSession = () => {
    setMessages([]);
    setSessionId(null);
    initSession();
  };

  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: 24 }}>
      <Card
        title={
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Space>
              <CustomerServiceOutlined style={{ fontSize: 20, color: '#1890ff' }} />
              <span>智能客服</span>
              {status === 'active' && <Tag color="blue">AI服务中</Tag>}
              {status === 'waiting_human' && <Tag color="orange">等待人工</Tag>}
              {status === 'human_handling' && <Tag color="green">人工服务中</Tag>}
            </Space>
            <Space>
              <Button size="small" icon={<PlusOutlined />} onClick={startNewSession}>新会话</Button>
              {status === 'active' && (
                <Button size="small" icon={<PhoneOutlined />} onClick={transferToHuman}>转人工</Button>
              )}
              <Button size="small" icon={<StarOutlined />} onClick={() => setShowSatisfaction(true)}>评价</Button>
            </Space>
          </div>
        }
        style={{ height: '75vh', display: 'flex', flexDirection: 'column' }}
        bodyStyle={{ flex: 1, overflow: 'auto', padding: 16, background: '#f5f5f5' }}
      >
        {messages.length === 0 ? (
          <Empty description="加载中..." />
        ) : (
          <>
            {messages.map(msg => (
              <div key={msg.id} style={{
                marginBottom: 16,
                display: 'flex',
                justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start'
              }}>
                {msg.role !== 'user' && (
                  <Avatar
                    size="default"
                    icon={msg.role === 'agent' ? <CustomerServiceOutlined /> : <RobotOutlined />}
                    style={{ marginRight: 12, background: msg.role === 'agent' ? '#52c41a' : '#1890ff' }}
                  />
                )}
                <div style={{ maxWidth: '70%' }}>
                  <div style={{
                    padding: '10px 16px',
                    borderRadius: 12,
                    background: msg.role === 'user' ? '#1890ff' : '#fff',
                    color: msg.role === 'user' ? '#fff' : '#333',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                    fontSize: 14,
                    lineHeight: 1.6
                  }}>
                    {msg.content}
                  </div>
                  {msg.citations && msg.citations.length > 0 && (
                    <div style={{ marginTop: 8, fontSize: 12, color: '#999' }}>
                      📎 引用: {msg.citations.map(c => c.filename).join('、')}
                    </div>
                  )}
                  <div style={{ fontSize: 11, color: '#bbb', marginTop: 4 }}>
                    {msg.timestamp.toLocaleTimeString()}
                  </div>
                </div>
                {msg.role === 'user' && (
                  <Avatar size="default" icon={<UserOutlined />} style={{ marginLeft: 12 }} />
                )}
              </div>
            ))}
            {loading && (
              <div style={{ textAlign: 'center', padding: 16 }}>
                <Spin tip="正在输入..." />
              </div>
            )}
            <div ref={messagesEndRef} />
          </>
        )}
      </Card>

      {/* 输入区 */}
      <Card style={{ marginTop: 0, borderRadius: '0 0 8px 8px' }} bodyStyle={{ padding: 16 }}>
        <div style={{ display: 'flex', gap: 12 }}>
          <Input.TextArea
            value={input}
            onChange={e => setInput(e.target.value)}
            onPressEnter={(e) => {
              if (!e.shiftKey) {
                e.preventDefault();
                sendMessage();
              }
            }}
            placeholder="输入问题... (Enter发送, Shift+Enter换行)"
            disabled={loading}
            rows={2}
            style={{ flex: 1 }}
          />
          <Button
            type="primary"
            icon={<SendOutlined />}
            onClick={sendMessage}
            loading={loading}
            style={{ height: 'auto' }}
          >
            发送
          </Button>
        </div>
      </Card>

      {/* 满意度评价 */}
      <Modal
        title="服务评价"
        open={showSatisfaction}
        onCancel={() => setShowSatisfaction(false)}
        footer={null}
        centered
      >
        <div style={{ textAlign: 'center', padding: 24 }}>
          <p>您对本次服务满意吗？</p>
          <Rate onChange={submitSatisfaction} style={{ fontSize: 32 }} />
          <p style={{ color: '#999', marginTop: 16 }}>点击星星完成评价</p>
        </div>
      </Modal>
    </div>
  );
};

export default CustomerServicePage;
