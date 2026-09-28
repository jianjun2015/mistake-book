/**
 * 客服工作台 - 目录管理 + 星标 + 移动 + 删除
 */
import React, { useState, useEffect, useRef } from 'react';
import {
  Layout, List, Input, Button, Tag, Avatar, Badge, message, Statistic,
  Row, Col, Empty, Spin, Popconfirm, Dropdown, Modal, Tree, Tooltip
} from 'antd';
import {
  UserOutlined, SendOutlined, CheckCircleOutlined, ReloadOutlined,
  CustomerServiceOutlined, ClockCircleOutlined, EditOutlined, StarOutlined, StarFilled,
  FolderOutlined, FolderAddOutlined, DeleteOutlined, DragOutlined, MoreOutlined, PaperClipOutlined, AudioOutlined, StopOutlined,
  RightOutlined
} from '@ant-design/icons';
import csRequest from '../../utils/csRequest';

const { Sider, Content } = Layout;

interface Session {
  id: number; user_name: string; user_id: string; status: string;
  updated_at: string; satisfaction: number | null; directory_id: number | null; starred: number;
}
interface Msg { id: number; role: string; content: string; created_at: string; }
interface Directory { id: number; name: string; parent_id: number | null; }

const statusColors: Record<string, string> = { active: 'blue', waiting_human: 'orange', human_handling: 'green', closed: 'gray' };
const statusNames: Record<string, string> = { active: 'AI对话中', waiting_human: '等待人工', human_handling: '人工处理中', closed: '已关闭' };

const AgentWorkbench: React.FC = () => {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [directories, setDirectories] = useState<Directory[]>([]);
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [reply, setReply] = useState('');
  const [stats, setStats] = useState<any>({});
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [renaming, setRenaming] = useState<number | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [activeDir, setActiveDir] = useState<number | null | 'all'>('all');
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [recording, setRecording] = useState(false);
  const mediaRecorderRef = useRef<any>(null);
  const [recordTime, setRecordTime] = useState(0);
  const [showNewDir, setShowNewDir] = useState(false);
  const [newDirName, setNewDirName] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const pollRef = useRef<any>(null);

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  useEffect(() => {
    loadSessions(); loadStats(); loadDirectories();
    pollRef.current = setInterval(() => { loadSessions(true); }, 10000);
    return () => clearInterval(pollRef.current);
  }, []);

  useEffect(() => {
    if (!selectedSession) return;
    const t = setInterval(async () => {
      loadMessages(selectedSession.id, true);
      // 同步会话状态（客户可能结束人工）
      try {
        const session: any = await csRequest.get(`/sessions/${selectedSession.id}`);
        if (session.status !== selectedSession.status) {
          setSelectedSession(prev => prev ? {...prev, status: session.status} : prev);
          if (session.status === 'active') {
            message.info('客户已结束人工服务，恢复AI对话');
          }
        }
      } catch (e) {}
    }, 3000);
    return () => clearInterval(t);
  }, [selectedSession?.id, selectedSession?.status]);

  const loadSessions = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      const data: any = await csRequest.get('/agent/sessions', { params: { size: 100 } });
      setSessions(data.items || []);
    } catch (e) { if (!silent) message.error('加载失败'); } finally { setLoading(false); }
  };

  const loadDirectories = async () => {
    try { const data: any = await csRequest.get('/directories'); setDirectories(data || []); } catch (e) {}
  };

  const loadStats = async () => {
    try { setStats(await csRequest.get('/stats')); } catch (e) {}
  };

  const loadMessages = async (sid: number, silent = false) => {
    try { setMessages(await csRequest.get(`/sessions/${sid}/messages`) || []); } catch (e) { if (!silent) message.error('加载消息失败'); }
  };

  const selectSession = (s: Session) => {
    setSelectedSession(s); loadMessages(s.id);
    if (s.status === 'waiting_human') acceptSession(s.id);
  };

  const acceptSession = async (sid: number) => {
    try {
      await csRequest.post(`/agent/sessions/${sid}/reply`, { content: '您好，人工客服已接入，请问有什么可以帮您？' });
      message.success('已接入');
      if (selectedSession?.id === sid) setSelectedSession(p => p ? { ...p, status: 'human_handling' } : p);
      loadSessions(true);
    } catch (e) {}
  };

  const sendReply = async () => {
    if (!reply.trim() || !selectedSession || sending) return;
    setSending(true);
    try {
      await csRequest.post(`/agent/sessions/${selectedSession.id}/reply`, { content: reply });
      setReply(''); loadMessages(selectedSession.id);
    } catch (e) { message.error('发送失败'); } finally { setSending(false); }
  };

  const closeSession = async () => {
    if (!selectedSession) return;
    try {
      await csRequest.post(`/agent/sessions/${selectedSession.id}/close`);
      message.success('已关闭'); setSelectedSession(null); setMessages([]);
      loadSessions(); loadStats();
    } catch (e) { message.error('关闭失败'); }
  };

  const handleRename = async (sid: number) => {
    if (!renameValue.trim()) return;
    try {
      await csRequest.post(`/sessions/${sid}/rename`, { name: renameValue.trim() });
      message.success('重命名成功'); setRenaming(null); loadSessions(true);
      if (selectedSession?.id === sid) setSelectedSession(p => p ? { ...p, user_name: renameValue.trim() } : p);
    } catch (e) { message.error('失败'); }
  };

  const handleStar = async (sid: number) => {
    try { await csRequest.post(`/sessions/${sid}/star`); loadSessions(true); } catch (e) {}
  };

  const handleDelete = async (sid: number) => {
    try {
      await csRequest.delete(`/sessions/${sid}`);
      message.success('已删除');
      if (selectedSession?.id === sid) { setSelectedSession(null); setMessages([]); }
      loadSessions(); loadStats();
    } catch (e) { message.error('删除失败'); }
  };

  const handleMove = async (sid: number, dirId: number | null) => {
    try {
      await csRequest.post(`/sessions/${sid}/move`, { directory_id: dirId });
      message.success('已移动'); loadSessions(true);
    } catch (e) { message.error('移动失败'); }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedSession) return;
    if (file.size > 50 * 1024 * 1024) { message.error('文件不能超过50MB'); return; }
    
    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    
    try {
      const resp = await fetch('/cs-api/upload', { method: 'POST', body: formData });
      const data = await resp.json();
      const ext = data.ext.toLowerCase();
      const isImage = ['.jpg','.jpeg','.png','.gif','.bmp','.webp'].includes(ext);
      const isAudio = ['.mp3','.wav','.ogg','.m4a','.aac','.webm'].includes(ext);
      const msgType = isImage ? 'image' : isAudio ? 'audio' : 'file';
      
      await csRequest.post(`/agent/sessions/${selectedSession.id}/reply`, {
        content: data.filename,
        msg_type: msgType,
        metadata: data
      });
      message.success('文件已发送');
      loadMessages(selectedSession.id);
    } catch (err) {
      message.error('文件上传失败');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const toggleVoice = async () => {
    if (recording) {
      stopVoice();
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      const chunks: Blob[] = [];
      
      recorder.ondataavailable = (e: BlobEvent) => { if (e.data.size > 0) chunks.push(e.data); };
      recorder.onstop = async () => {
        stream.getTracks().forEach((t: MediaStreamTrack) => t.stop());
        await uploadVoice(new Blob(chunks, { type: 'audio/webm' }));
      };
      
      recorder.start();
      mediaRecorderRef.current = recorder;
      setRecording(true);
      setRecordTime(0);
      const timer = setInterval(() => {
        setRecordTime(prev => {
          if (prev >= 60) { stopVoice(); return prev; }
          return prev + 1;
        });
      }, 1000);
      (window as any).__voiceTimer = timer;
    } catch (err) {
      message.error('无法访问麦克风');
    }
  };

  const stopVoice = () => {
    if (mediaRecorderRef.current?.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
    setRecording(false);
    clearInterval((window as any).__voiceTimer);
  };

  const uploadVoice = async (blob: Blob) => {
    if (!selectedSession) return;
    const formData = new FormData();
    formData.append('file', blob, 'voice.webm');
    
    try {
      const resp = await fetch('/cs-api/upload', { method: 'POST', body: formData });
      const data = await resp.json();
      await csRequest.post(`/agent/sessions/${selectedSession.id}/reply`, {
        content: '[语音消息]',
        msg_type: 'audio',
        metadata: data
      });
      message.success('语音已发送');
      loadMessages(selectedSession.id);
    } catch (err) {
      message.error('语音上传失败');
    }
  };

  const renderMessageContent = (msg: Msg) => {
    const meta = (msg as any).metadata;
    if (msg.msg_type === 'image' && meta?.file_url) {
      return <img src={meta.file_url} style={{ maxWidth: 200, borderRadius: 8, cursor: 'pointer' }} onClick={() => window.open(meta.file_url)} />;
    }
    if (msg.msg_type === 'audio' && meta?.file_url) {
      return <audio controls src={meta.file_url} style={{ maxWidth: 250 }} />;
    }
    if (msg.msg_type === 'file' && meta?.file_url) {
      return (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: 8, background: '#f5f5f5', borderRadius: 8, cursor: 'pointer' }} onClick={() => window.open(meta.file_url)}>
          <span style={{ fontSize: 24 }}>📄</span>
          <div>
            <div style={{ fontSize: 13 }}>{meta.filename}</div>
            <div style={{ fontSize: 11, color: '#999' }}>{(meta.size/1024).toFixed(1)}KB</div>
          </div>
        </div>
      );
    }
    return msg.content;
  };

  const handleCreateDir = async () => {
    if (!newDirName.trim()) return;
    try {
      await csRequest.post('/directories', { name: newDirName.trim() });
      message.success('目录已创建'); setNewDirName(''); setShowNewDir(false); loadDirectories();
    } catch (e) { message.error('创建失败'); }
  };

  const handleDeleteDir = async (dirId: number) => {
    try {
      await csRequest.delete(`/directories/${dirId}`);
      message.success('目录已删除'); loadDirectories(); loadSessions(true);
    } catch (e) {}
  };

  // 筛选会话
  const filteredSessions = sessions.filter(s => {
    if (activeDir === 'all') return true;
    if (activeDir === null) return !s.directory_id;
    return s.directory_id === activeDir;
  });

  // 会话右键菜单
  const getSessionMenu = (s: Session) => ({
    items: [
      { key: 'star', icon: s.starred ? <StarFilled style={{ color: '#faad14' }} /> : <StarOutlined />, label: s.starred ? '取消星标' : '星标' },
      { key: 'rename', icon: <EditOutlined />, label: '重命名' },
      { type: 'divider' as const },
      ...directories.map(d => ({ key: `move-${d.id}`, icon: <FolderOutlined />, label: `移动到「${d.name}」` })),
      ...(s.directory_id ? [{ key: 'move-null', icon: <FolderOutlined />, label: '移出目录' }] : []),
      { type: 'divider' as const },
      { key: 'delete', icon: <DeleteOutlined />, label: '删除会话', danger: true },
    ],
    onClick: ({ key }: { key: string }) => {
      if (key === 'star') handleStar(s.id);
      else if (key === 'rename') { setRenaming(s.id); setRenameValue(s.user_name || `用户${s.id}`); }
      else if (key === 'delete') {
        Modal.confirm({ title: '确定删除此会话？', content: '删除后不可恢复', okType: 'danger', onOk: () => handleDelete(s.id) });
      }
      else if (key.startsWith('move-')) {
        const dirId = key === 'move-null' ? null : parseInt(key.replace('move-', ''));
        handleMove(s.id, dirId);
      }
    }
  });

  return (
    <Layout style={{ height: 'calc(100vh - 64px)' }}>
      {/* 左侧 */}
      <Sider width={320} style={{ background: '#fff', borderRight: '1px solid #e8e8e8' }}>
        <div style={{ padding: 16, borderBottom: '1px solid #e8e8e8' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <h3 style={{ margin: 0 }}>📋 客服工作台</h3>
            <Button size="small" icon={<ReloadOutlined />} onClick={() => loadSessions()}>刷新</Button>
          </div>
          <Row gutter={8}>
            <Col span={8}><Statistic title="总会话" value={stats.total_sessions || 0} valueStyle={{ fontSize: 18 }} /></Col>
            <Col span={8}><Statistic title="进行中" value={stats.active_sessions || 0} valueStyle={{ fontSize: 18, color: '#1890ff' }} /></Col>
            <Col span={8}><Statistic title="满意度" value={stats.avg_satisfaction || 0} suffix="★" valueStyle={{ fontSize: 18, color: '#52c41a' }} /></Col>
          </Row>
        </div>

        {/* 目录导航 */}
        <div style={{ padding: '8px 16px', borderBottom: '1px solid #e8e8e8', maxHeight: 200, overflow: 'auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <span style={{ fontWeight: 'bold', fontSize: 13 }}>📁 目录</span>
            <Button size="small" icon={<FolderAddOutlined />} onClick={() => setShowNewDir(true)} />
          </div>
          <div
            style={{ padding: '4px 8px', cursor: 'pointer', borderRadius: 4, background: activeDir === 'all' ? '#e6f7ff' : '', fontSize: 13 }}
            onClick={() => setActiveDir('all')}
          >📂 全部会话 ({sessions.length})</div>
          <div
            style={{ padding: '4px 8px', cursor: 'pointer', borderRadius: 4, background: activeDir === null ? '#e6f7ff' : '', fontSize: 13 }}
            onClick={() => setActiveDir(null)}
          >📄 未分类 ({sessions.filter(s => !s.directory_id).length})</div>
          {directories.map(d => (
            <div key={d.id} style={{
              padding: '4px 8px', cursor: 'pointer', borderRadius: 4,
              background: activeDir === d.id ? '#e6f7ff' : '', fontSize: 13,
              display: 'flex', justifyContent: 'space-between', alignItems: 'center'
            }}>
              <span onClick={() => setActiveDir(d.id)}>
                <FolderOutlined /> {d.name} ({sessions.filter(s => s.directory_id === d.id).length})
              </span>
              <Popconfirm title="删除目录？" onConfirm={() => handleDeleteDir(d.id)}>
                <DeleteOutlined style={{ fontSize: 11, color: '#bbb' }} />
              </Popconfirm>
            </div>
          ))}
        </div>

        {/* 会话列表 */}
        <div style={{ overflow: 'auto', height: 'calc(100% - 320px)' }}>
          {loading ? <div style={{ textAlign: 'center', padding: 40 }}><Spin /></div>
          : filteredSessions.length === 0 ? <Empty description="暂无会话" style={{ marginTop: 40 }} />
          : (
            <List
              dataSource={filteredSessions}
              renderItem={(s: Session) => (
                <Dropdown menu={getSessionMenu(s)} trigger={['contextMenu']}>
                  <List.Item
                    style={{
                      padding: '12px 16px', cursor: 'pointer',
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
                            <Input size="small" value={renameValue} onChange={e => setRenameValue(e.target.value)}
                              onPressEnter={() => handleRename(s.id)} onBlur={() => handleRename(s.id)} autoFocus style={{ width: 110 }} />
                          ) : (
                            <span style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}
                              onClick={(e) => { e.stopPropagation(); setRenaming(s.id); setRenameValue(s.user_name || `用户${s.id}`); }}>
                              {s.starred ? <StarFilled style={{ color: '#faad14', fontSize: 12 }} /> : null}
                              {s.user_name || `用户${s.id}`}
                              <EditOutlined style={{ fontSize: 11, color: '#bbb' }} />
                            </span>
                          )}
                          <Dropdown menu={getSessionMenu(s)} trigger={['click']}>
                            <MoreOutlined style={{ color: '#bbb', cursor: 'pointer' }} onClick={e => e.stopPropagation()} />
                          </Dropdown>
                        </div>
                      }
                      description={
                        <div>
                          <Tag color={statusColors[s.status]} style={{ fontSize: 11 }}>{statusNames[s.status]}</Tag>
                          <span style={{ fontSize: 11, color: '#999' }}><ClockCircleOutlined /> {s.updated_at?.substring(11, 16)}</span>
                        </div>
                      }
                    />
                  </List.Item>
                </Dropdown>
              )}
            />
          )}
        </div>
      </Sider>

      {/* 右侧对话区 */}
      <Content style={{ display: 'flex', flexDirection: 'column', background: '#f5f5f5' }}>
        {selectedSession ? (
          <>
            <div style={{ padding: '12px 24px', background: '#fff', borderBottom: '1px solid #e8e8e8', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <Avatar icon={<UserOutlined />} />
                <div>
                  <div style={{ fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 6 }}>
                    {selectedSession.starred ? <StarFilled style={{ color: '#faad14' }} /> : null}
                    {selectedSession.user_name || `用户${selectedSession.id}`}
                  </div>
                  <div style={{ fontSize: 12, color: '#999' }}>会话 #{selectedSession.id}</div>
                </div>
                <Tag color={statusColors[selectedSession.status]}>{statusNames[selectedSession.status]}</Tag>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <Button icon={selectedSession.starred ? <StarFilled /> : <StarOutlined />} onClick={() => handleStar(selectedSession.id)}>
                  {selectedSession.starred ? '已星标' : '星标'}
                </Button>
                <Popconfirm title="确定关闭此会话？" onConfirm={closeSession}>
                  <Button icon={<CheckCircleOutlined />} type="primary" danger>关闭会话</Button>
                </Popconfirm>
              </div>
            </div>

            <div style={{ flex: 1, overflow: 'auto', padding: 24 }}>
              {messages.map((msg: Msg) => (
                <div key={msg.id} style={{ marginBottom: 16, display: 'flex', justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start' }}>
                  {msg.role !== 'user' && (
                    <Avatar size="default" icon={msg.role === 'agent' ? <CustomerServiceOutlined /> : <UserOutlined />}
                      style={{ marginRight: 12, background: msg.role === 'agent' ? '#52c41a' : msg.role === 'ai' ? '#1890ff' : '#999' }} />
                  )}
                  <div style={{ maxWidth: '65%' }}>
                    <div style={{ padding: '10px 16px', borderRadius: 12, background: msg.role === 'user' ? '#1890ff' : '#fff', color: msg.role === 'user' ? '#fff' : '#333', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', fontSize: 14, lineHeight: 1.6 }}>
                      {renderMessageContent(msg)}
                    </div>
                    <div style={{ fontSize: 11, color: '#bbb', marginTop: 4, textAlign: msg.role === 'user' ? 'right' : 'left' }}>
                      {msg.role === 'ai' ? 'AI助手' : msg.role === 'agent' ? '人工客服' : msg.role === 'system' ? '系统' : '用户'} · {msg.created_at?.substring(11, 19)}
                    </div>
                  </div>
                  {msg.role === 'user' && <Avatar size="default" icon={<UserOutlined />} style={{ marginLeft: 12 }} />}
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            <div style={{ padding: 16, background: '#fff', borderTop: '1px solid #e8e8e8' }}>
              <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                <Button icon={<PaperClipOutlined />} onClick={() => fileInputRef.current?.click()} loading={uploading}>文件</Button>
                <Button icon={recording ? <StopOutlined /> : <AudioOutlined />} 
                  onClick={toggleVoice}
                  danger={recording}
                  type={recording ? 'primary' : 'default'}>
                  {recording ? `录音中 ${recordTime}s (点击停止)` : '语音'}
                </Button>
                <input ref={fileInputRef} type="file" style={{ display: 'none' }} onChange={handleFileUpload}
                  accept="image/*,audio/*,video/*,.pdf,.doc,.docx,.xls,.xlsx,.txt,.md" />
              </div>
              <div style={{ display: 'flex', gap: 12 }}>
                <Input.TextArea value={reply} onChange={e => setReply(e.target.value)} placeholder="输入回复... (Enter发送)" rows={3}
                  style={{ flex: 1 }} onPressEnter={(e) => { if (!e.shiftKey) { e.preventDefault(); sendReply(); } }} />
                <Button type="primary" icon={<SendOutlined />} onClick={sendReply} loading={sending} style={{ height: 'auto' }}>发送</Button>
              </div>
            </div>
          </>
        ) : (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', color: '#bbb' }}>
            <CustomerServiceOutlined style={{ fontSize: 64, marginBottom: 16 }} />
            <h3 style={{ color: '#999' }}>客服工作台</h3>
            <p>请从左侧选择一个会话开始处理</p>
            <p style={{ fontSize: 12 }}>💡 右键会话可 星标/重命名/移动/删除</p>
          </div>
        )}
      </Content>

      {/* 新建目录弹窗 */}
      <Modal title="新建目录" open={showNewDir} onOk={handleCreateDir} onCancel={() => setShowNewDir(false)}>
        <Input placeholder="目录名称" value={newDirName} onChange={e => setNewDirName(e.target.value)} onPressEnter={handleCreateDir} autoFocus />
      </Modal>
    </Layout>
  );
};

export default AgentWorkbench;
