/**
 * 客服工作台 - 处理转人工会话
 */
import React, { useState, useEffect, useRef } from 'react';
import {
  Layout, List, Card, Input, Button, Tag, Avatar, Badge, message, Statistic,
  Row, Col, Empty, Spin, Popconfirm
} from 'antd';
import {
  import { UserOutlined, SendOutlined, CheckCircleOutlined, ReloadOutlined, EditOutlined,
  CustomerServiceOutlined, ClockCircleOutlined
} from '@ant-design/icons';
import csRequest from '../../utils/csRequest';

const { Sider, Content } = Layout;

interface Session {
  id: number;
  user_name: string;
  user_id: string;
  status: string;
  updated_at: string;
  satisfaction: number | null;
}

interface Message {
  id: number;
  role: string;
  content: string;
  created_at: string;
}

const statusColors: Record<string, string> = {
  active: 'blue', waiting_human: 'orange', human_handling: 'green', closed: 'gray'
};

const statusNames: Record<string, string> = {
  active: 'AI对话中', waiting_human: '等待人工', human_handling: '人工处理中', closed: '已关闭'
};

const AgentWorkbench: React.FC = () => {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [reply, setReply] = useState('');
  const [stats, setStats] = useState<any>({});
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [renaming, setRenaming] = useState<number | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const pollRef = useRef<any>(null);

  // 自动滚动
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // 初始化
  useEffect(() => {
    loadSessions();
    loadStats();
    // 轮询刷新会话列表
    pollRef.current = setInterval(() => {
      loadSessions(true);
    }, 10000);
    return () => clearInterval(pollRef.current);
  }, []);

  // 轮询当前会话消息
  useEffect(() => {
    if (!selectedSession) return;
    const timer = setInterval(() => {
      loadMessages(selectedSession.id, true);
    }, 5000);
    return () => clearInterval(timer);
  }, [selectedSession?.id]);

  const loadSessions = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      const data: any = await csRequest.get('/agent/sessions', {
        params: { size: 50 }
      });
      setSessions(data.items || []);
    } catch (err) {
      if (!silent) message.error('加载会话列表失败');
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const data: any = await csRequest.get('/stats');
      setStats(data);
    } catch (err) {}
  };

  const loadMessages = async (sessionId: number, silent = false) => {
    try {
      const data: any = await csRequest.get(`/sessions/${sessionId}/messages`);
      setMessages(data || []);
    } catch (err) {
      if (!silent) message.error('加载消息失败');
    }
  };

  const selectSession = (s: Session) => {
    setSelectedSession(s);
    loadMessages(s.id);
    // 如果是等待人工状态，自动切换为处理中
    if (s.status === 'waiting_human') {
      acceptSession(s.id);
    }
  };

  const handleRename = async (sessionId: number) => {
    if (!renameValue.trim()) return;
    try {
      await csRequest.post(`/sessions/${sessionId}/rename`, { name: renameValue.trim() });
      message.success('重命名成功');
      setRenaming(null);
      loadSessions(true);
      if (selectedSession?.id === sessionId) {
        setSelectedSession(prev => prev ? {...prev, user_name: renameValue.trim()} : prev);
      }
    } catch (err) {
      message.error('重命名失败');
    }
  };

  const acceptSession = async (sessionId: number) => {
    try {
      await csRequest.post(`/agent/sessions/${sessionId}/reply`, {
        content: '您好，人工客服已接入，请问有什么可以帮您？'
      });
      message.success('已接入会话');
      // 更新本地选中会话状态
      if (selectedSession?.id === sessionId) {
        setSelectedSession(prev => prev ? {...prev, status: 'human_handling'} : prev);
      }
      loadSessions(true);
    } catch (err) {}
  };

  const sendReply = async () => {
    if (!reply.trim() || !selectedSession || sending) return;
    setSending(true);
    try {
      await csRequest.post(`/agent/sessions/${selectedSession.id}/reply`, {
        content: reply
      });
      setReply('');
      loadMessages(selectedSession.id);
    } catch (err) {
      message.error('发送失败');
    } finally {
      setSending(false);
    }
  };

  const closeSession = async () => {
    if (!selectedSession) return;
    try {
      await csRequest.post(`/agent/sessions/${selectedSession.id}/close`);
      message.success('会话已关闭');
      setSelectedSession(null);
      setMessages([]);
      loadSessions();
      loadStats();
    } catch (err) {
      message.error('关闭失败');
    }
  };

  return (
    <Layout style={{ height: 'calc(100vh - 64px)' }}>
      {/* 左侧：会话列表 */}
      <Sider width={320} style={{ background: '#fff', borderRight: '1px solid #e8e8e8' }}>
        <div style={{ padding: 16, borderBottom: '1px solid #e8e8e8' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <h3 style={{ margin: 0 }}>📋 客服工作台</h3>
            <Button size="small" icon={<ReloadOutlined />} onClick={() => loadSessions()}>刷新</Button>
          </div>
          <Row gutter={8}>
            <Col span={8}>
              <Statistic title="总会话" value={stats.total_sessions || 0} valueStyle={{ fontSize: 18 }} />
            </Col>
            <Col span={8}>
              <Statistic title="进行中" value={stats.active_sessions || 0} valueStyle={{ fontSize: 18, color: '#1890ff' }} />
            </Col>
            <Col span={8}>
              <Statistic title="满意度" value={stats.avg_satisfaction || 0} suffix="★" valueStyle={{ fontSize: 18, color: '#52c41a' }} />
            </Col>
          </Row>
        </div>

        <div style={{ overflow: 'auto', height: 'calc(100% - 130px)' }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: 40 }}><Spin /></div>
          ) : sessions.length === 0 ? (
            <Empty description="暂无会话" style={{ marginTop: 40 }} />
          ) : (
            <List
              dataSource={sessions}
              renderItem={(s: Session) => (
                <List.Item
                  style={{
                    padding: '12px 16px',
                    cursor: 'pointer',
                    background: selectedSession?.id === s.id ? '#e6f7ff' : '',
                    borderLeft: selectedSession?.id === s.id ? '3px solid #1890ff' : '3px solid transparent'
                  }}
                  onClick={() => selectSession(s)}
                >
                  <List.Item.Meta
                    avatar={
                      <Badge status={s.status === 'waiting_human' ? 'processing' : s.status === 'human_handling' ? 'success' : 'default'}>
                        <Avatar icon={<UserOutlined />} />
                      </Badge>
                    }
                    title={
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        {renaming === s.id ? (
                          <Input
                            size="small"
                            value={renameValue}
                            onChange={e => setRenameValue(e.target.value)}
                            onPressEnter={() => handleRename(s.id)}
                            onBlur={() => handleRename(s.id)}
                            autoFocus
                            style={{ width: 120 }}
                          />
                        ) : (
                          <span style={{ cursor: 'pointer' }} onClick={(e) => {
                            e.stopPropagation();
                            setRenaming(s.id);
                            setRenameValue(s.user_name || `用户${s.id}`);
                          }}>
                            {s.user_name || `用户${s.id}`}
                            <EditOutlined style={{ fontSize: 11, marginLeft: 4, color: '#bbb' }} />
                          </span>
                        )}
                        {s.status === 'waiting_human' && <Badge count={1} style={{ backgroundColor: '#fa8c16' }} />}
                      </div>
                    }
                    description={
                      <div>
                        <Tag color={statusColors[s.status]} style={{ fontSize: 11 }}>
                          {statusNames[s.status]}
                        </Tag>
                        <span style={{ fontSize: 11, color: '#999' }}>
                          <ClockCircleOutlined /> {s.updated_at?.substring(11, 16)}
                        </span>
                      </div>
                    }
                  />
                </List.Item>
              )}
            />
          )}
        </div>
      </Sider>

      {/* 右侧：对话区 */}
      <Content style={{ display: 'flex', flexDirection: 'column', background: '#f5f5f5' }}>
        {selectedSession ? (
          <>
            {/* 头部 */}
            <div style={{
              padding: '12px 24px', background: '#fff', borderBottom: '1px solid #e8e8e8',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <Avatar icon={<UserOutlined />} />
                <div>
                  <div style={{ fontWeight: 'bold' }}>{selectedSession.user_name || `用户${selectedSession.id}`}</div>
                  <div style={{ fontSize: 12, color: '#999' }}>会话 #{selectedSession.id}</div>
                </div>
                <Tag color={statusColors[selectedSession.status]}>
                  {statusNames[selectedSession.status]}
                </Tag>
              </div>
              <Popconfirm title="确定关闭此会话？" onConfirm={closeSession}>
                <Button icon={<CheckCircleOutlined />} type="primary" danger>关闭会话</Button>
              </Popconfirm>
            </div>

            {/* 消息区 */}
            <div style={{ flex: 1, overflow: 'auto', padding: 24 }}>
              {messages.map((msg: Message) => (
                <div key={msg.id} style={{
                  marginBottom: 16,
                  display: 'flex',
                  justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start'
                }}>
                  {msg.role !== 'user' && (
                    <Avatar
                      size="default"
                      icon={msg.role === 'agent' ? <CustomerServiceOutlined /> : <UserOutlined />}
                      style={{
                        marginRight: 12,
                        background: msg.role === 'agent' ? '#52c41a' : msg.role === 'ai' ? '#1890ff' : '#999'
                      }}
                    />
                  )}
                  <div style={{ maxWidth: '65%' }}>
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
                    <div style={{
                      fontSize: 11, color: '#bbb', marginTop: 4,
                      textAlign: msg.role === 'user' ? 'right' : 'left'
                    }}>
                      {msg.role === 'ai' ? 'AI助手' : msg.role === 'agent' ? '人工客服' : msg.role === 'system' ? '系统' : '用户'}
                      {' · '}{msg.created_at?.substring(11, 19)}
                    </div>
                  </div>
                  {msg.role === 'user' && (
                    <Avatar size="default" icon={<UserOutlined />} style={{ marginLeft: 12 }} />
                  )}
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* 输入区 */}
            <div style={{ padding: 16, background: '#fff', borderTop: '1px solid #e8e8e8' }}>
              <div style={{ display: 'flex', gap: 12 }}>
                <Input.TextArea
                  value={reply}
                  onChange={e => setReply(e.target.value)}
                  placeholder="输入回复... (Enter发送, Shift+Enter换行)"
                  rows={3}
                  style={{ flex: 1 }}
                  onPressEnter={(e) => {
                    if (!e.shiftKey) {
                      e.preventDefault();
                      sendReply();
                    }
                  }}
                />
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <Button type="primary" icon={<SendOutlined />} onClick={sendReply} loading={sending} style={{ flex: 1 }}>
                    发送
                  </Button>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div style={{
            flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexDirection: 'column', color: '#bbb'
          }}>
            <CustomerServiceOutlined style={{ fontSize: 64, marginBottom: 16 }} />
            <h3 style={{ color: '#999' }}>客服工作台</h3>
            <p>请从左侧选择一个会话开始处理</p>
            <p style={{ fontSize: 12 }}>
              💡 提示：每10秒自动刷新会话列表，每5秒自动刷新当前对话
            </p>
          </div>
        )}
      </Content>
    </Layout>
  );
};

export default AgentWorkbench;
