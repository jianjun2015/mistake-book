/**
 * 人工客服工作台
 */
import React, { useState, useEffect } from 'react';
import { Layout, List, Card, Input, Button, Tag, Avatar, Badge, message, Statistic, Row, Col } from 'antd';
import { UserOutlined, SendOutlined, CheckCircleOutlined } from '@ant-design/icons';

const { Sider, Content } = Layout;

interface Session {
  id: number;
  user_name: string;
  status: string;
  updated_at: string;
}

const AgentWorkbench: React.FC = () => {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [reply, setReply] = useState('');
  const [stats, setStats] = useState<any>({});

  const statusColors: Record<string, string> = {
    active: 'blue', waiting_human: 'orange', human_handling: 'green', closed: 'gray'
  };

  const statusNames: Record<string, string> = {
    active: 'AI对话中', waiting_human: '等待人工', human_handling: '人工处理中', closed: '已关闭'
  };

  useEffect(() => {
    loadSessions();
    loadStats();
  }, []);

  const loadSessions = async () => {
    const resp = await fetch('/cs-api/api/cs/agent/sessions?status=waiting_human');
    const data = await resp.json();
    setSessions(data.items || []);
  };

  const loadStats = async () => {
    const resp = await fetch('/cs-api/api/cs/stats');
    setStats(await resp.json());
  };

  const loadMessages = async (sessionId: number) => {
    const resp = await fetch(`/cs-api/api/cs/sessions/${sessionId}/messages`);
    setMessages(await resp.json());
  };

  const sendReply = async () => {
    if (!reply.trim() || !selectedSession) return;
    await fetch(`/cs-api/api/cs/agent/sessions/${selectedSession.id}/reply`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: reply })
    });
    setReply('');
    loadMessages(selectedSession.id);
    message.success('回复成功');
  };

  const closeSession = async () => {
    if (!selectedSession) return;
    await fetch(`/cs-api/api/cs/agent/sessions/${selectedSession.id}/close`, { method: 'POST' });
    message.success('会话已关闭');
    loadSessions();
    setSelectedSession(null);
  };

  return (
    <Layout style={{ height: '100vh' }}>
      <Sider width={320} style={{ background: '#fff' }}>
        <div style={{ padding: 16, borderBottom: '1px solid #e8e8e8' }}>
          <h3>📋 待处理会话</h3>
          <Row gutter={8}>
            <Col span={12}><Statistic title="待处理" value={stats.active_sessions || 0} /></Col>
            <Col span={12}><Statistic title="满意度" value={stats.avg_satisfaction || 0} suffix="★" /></Col>
          </Row>
        </div>
        <List
          dataSource={sessions}
          renderItem={(s: Session) => (
            <List.Item
              style={{ padding: '12px 16px', cursor: 'pointer', background: selectedSession?.id === s.id ? '#e6f7ff' : '' }}
              onClick={() => { setSelectedSession(s); loadMessages(s.id); }}
            >
              <List.Item.Meta
                avatar={<Avatar icon={<UserOutlined />} />}
                title={s.user_name || `用户${s.id}`}
                description={
                  <div>
                    <Tag color={statusColors[s.status]}>{statusNames[s.status]}</Tag>
                    <span style={{ fontSize: 12, color: '#999' }}>{s.updated_at}</span>
                  </div>
                }
              />
            </List.Item>
          )}
        />
      </Sider>

      <Content style={{ display: 'flex', flexDirection: 'column' }}>
        {selectedSession ? (
          <>
            <div style={{ padding: 16, borderBottom: '1px solid #e8e8e8', display: 'flex', justifyContent: 'space-between' }}>
              <h3>💬 {selectedSession.user_name || `用户${selectedSession.id}`}</h3>
              <Button icon={<CheckCircleOutlined />} onClick={closeSession}>关闭会话</Button>
            </div>

            <div style={{ flex: 1, overflow: 'auto', padding: 16, background: '#f5f5f5' }}>
              {messages.map((msg: any) => (
                <div key={msg.id} style={{
                  marginBottom: 12,
                  display: 'flex',
                  justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start'
                }}>
                  <div style={{
                    maxWidth: '70%',
                    padding: '8px 12px',
                    borderRadius: 8,
                    background: msg.role === 'user' ? '#1890ff' : msg.role === 'agent' ? '#52c41a' : '#fff',
                    color: msg.role === 'user' || msg.role === 'agent' ? '#fff' : '#333'
                  }}>
                    {msg.content}
                  </div>
                </div>
              ))}
            </div>

            <div style={{ padding: 16, borderTop: '1px solid #e8e8e8', display: 'flex', gap: 8 }}>
              <Input.TextArea
                value={reply}
                onChange={e => setReply(e.target.value)}
                onPressEnter={sendReply}
                placeholder="输入回复..."
                rows={2}
                style={{ flex: 1 }}
              />
              <Button type="primary" icon={<SendOutlined />} onClick={sendReply}>发送</Button>
            </div>
          </>
        ) : (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#999' }}>
            请选择一个会话开始处理
          </div>
        )}
      </Content>
    </Layout>
  );
};

export default AgentWorkbench;
