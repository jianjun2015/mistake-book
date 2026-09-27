/**
 * 本地知识库页面
 * 支持文档上传、语义检索、智能问答
 */
import React, { useState, useEffect, useCallback } from 'react';
import {
  Card, Tabs, Upload, Button, Input, List, Tag, Space, message,
  Select, Form, Modal, Spin, Empty, Typography, Popconfirm, Statistic, Row, Col
} from 'antd';
import {
  UploadOutlined, SearchOutlined, MessageOutlined, DeleteOutlined,
  FileTextOutlined, FilePdfOutlined, FileWordOutlined, FileExcelOutlined,
  FileImageOutlined, AudioOutlined, VideoCameraOutlined, CodeOutlined,
  FolderOutlined, TagOutlined, PlusOutlined, SendOutlined, ReloadOutlined, DatabaseOutlined,
  GlobalOutlined
} from '@ant-design/icons';
import request from '../../utils/kbRequest';

const { Title, Text, Paragraph } = Typography;
const { TabPane } = Tabs;
const { Dragger } = Upload;

// 文件类型图标映射
const fileIcon = (type: string) => {
  const map: Record<string, React.ReactNode> = {
    pdf: <FilePdfOutlined style={{ color: '#f5222d' }} />,
    docx: <FileWordOutlined style={{ color: '#1890ff' }} />,
    doc: <FileWordOutlined style={{ color: '#1890ff' }} />,
    xlsx: <FileExcelOutlined style={{ color: '#52c41a' }} />,
    xls: <FileExcelOutlined style={{ color: '#52c41a' }} />,
    pptx: <FileTextOutlined style={{ color: '#fa8c16' }} />,
    txt: <FileTextOutlined />,
    md: <FileTextOutlined />,
    jpg: <FileImageOutlined style={{ color: '#722ed1' }} />,
    png: <FileImageOutlined style={{ color: '#722ed1' }} />,
    jpeg: <FileImageOutlined style={{ color: '#722ed1' }} />,
    mp3: <AudioOutlined style={{ color: '#13c2c2' }} />,
    wav: <AudioOutlined style={{ color: '#13c2c2' }} />,
    mp4: <VideoCameraOutlined style={{ color: '#eb2f96' }} />,
    py: <CodeOutlined style={{ color: '#faad14' }} />,
    java: <CodeOutlined style={{ color: '#faad14' }} />,
  };
  return map[type] || <FileTextOutlined />;
};

const KnowledgeBasePage: React.FC = () => {
  // 文档列表
  const [docs, setDocs] = useState<any[]>([]);
  const [docsTotal, setDocsTotal] = useState(0);
  const [docsLoading, setDocsLoading] = useState(false);
  const [category, setCategory] = useState<string | undefined>();
  const [page, setPage] = useState(1);
  
  // 搜索
  const [searchQuery, setSearchQuery] = useState('');
  const [searchType, setSearchType] = useState('hybrid');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const [searchLatency, setSearchLatency] = useState(0);
  
  // 问答
  const [chatInput, setChatInput] = useState('');
  const [messages, setMessages] = useState<any[]>([]);
  const [chatting, setChatting] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  
  // 文本导入
  const [textModalOpen, setTextModalOpen] = useState(false);
  const [textForm] = Form.useForm();
  
  // 统计
  const [stats, setStats] = useState({ total_documents: 0, total_chunks: 0 });
  const [categories, setCategories] = useState<any[]>([]);
  const [tags, setTags] = useState<any[]>([]);

  // 加载文档列表
  const loadDocs = useCallback(async () => {
    setDocsLoading(true);
    try {
      const res = await request.get('/documents/', {
        params: { category, page, size: 20 }
      });
      setDocs(res.items || []);
      setDocsTotal(res.total || 0);
    } catch (e) {
      console.error(e);
    }
    setDocsLoading(false);
  }, [category, page]);

  // 加载统计
  const loadStats = useCallback(async () => {
    try {
      const res = await request.get('/documents/stats/overview');
      setStats(res);
    } catch (e) {
      console.error(e);
    }
  }, []);

  // 加载分类和标签
  const loadMeta = useCallback(async () => {
    try {
      const [cats, tgs] = await Promise.all([
        request.get('/categories'),
        request.get('/tags')
      ]);
      setCategories(cats || []);
      setTags(tgs || []);
    } catch (e) {
      console.error(e);
    }
  }, []);

  useEffect(() => {
    loadDocs();
    loadStats();
    loadMeta();
  }, [loadDocs, loadStats, loadMeta]);

  // 上传文档
  const handleUpload = async (file: any) => {
    const formData = new FormData();
    formData.append('file', file);
    const hide = message.loading(`正在上传 ${file.name} 并处理...`, 0);
    try {
      const res: any = await request.post('/documents/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      hide();
      message.success(`上传成功，已生成 ${res.chunk_count} 个知识分块`);
      loadDocs();
      loadStats();
      loadMeta();
    } catch (e: any) {
      hide();
      const detail = e?.response?.data?.detail;
      message.error(detail ? `上传失败: ${detail}` : '上传失败，请检查文件格式');
    }
    return false;
  };

  // 删除文档
  const handleDelete = async (id: number) => {
    await request.delete(`/documents/${id}`);
    message.success('已删除');
    loadDocs();
    loadStats();
  };

  // 搜索
  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      message.warning('请输入搜索内容');
      return;
    }
    setSearching(true);
    try {
      const res = await request.post('/search/', {
        query: searchQuery,
        search_type: searchType,
        top_k: 10
      });
      setSearchResults(res.results || []);
      setSearchLatency(res.latency_ms || 0);
    } catch (e) {
      message.error('搜索失败');
    }
    setSearching(false);
  };

  // 发送问答
  const handleChat = async () => {
    if (!chatInput.trim()) {
      message.warning('请输入问题');
      return;
    }
    if (chatting) return;
    const question = chatInput;
    setChatInput('');
    setMessages(prev => [...prev, { role: 'user', content: question }]);
    setChatting(true);
    try {
      const res = await request.post('/chat/', {
        question,
        conversation_id: conversationId,
        use_rag: true
      });
      setConversationId(res.conversation_id);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: res.answer,
        citations: res.citations || [],
        sources: res.sources || []
      }]);
    } catch (e) {
      message.error('问答失败');
    }
    setChatting(false);
  };

  // 文本导入
  const handleTextImport = async () => {
    const values = await textForm.validateFields();
    const formData = new FormData();
    formData.append('content', values.content);
    formData.append('title', values.title);
    if (values.category) formData.append('category', values.category);
    if (values.tags) formData.append('tags', values.tags);
    
    try {
      await request.post('/documents/text', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      message.success('导入成功');
      setTextModalOpen(false);
      textForm.resetFields();
      loadDocs();
      loadStats();
    } catch (e) {
      message.error('导入失败');
    }
  };

  // ========== 渲染 ==========
  
  const uploadTab = (
    <Card>
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={6}>
          <Statistic title="文档总数" value={stats.total_documents} prefix={<FolderOutlined style={{color: '#1890ff'}} />} />
        </Col>
        <Col span={6}>
          <Statistic title="知识分块" value={stats.total_chunks} prefix={<FileTextOutlined style={{color: '#52c41a'}} />} />
        </Col>
        <Col span={6}>
          <Statistic title="标签数" value={tags.length} prefix={<TagOutlined style={{color: '#fa8c16'}} />} />
        </Col>
        <Col span={6}>
          <Statistic title="分类数" value={categories.length} prefix={<DatabaseOutlined style={{color: '#722ed1'}} />} />
        </Col>
      </Row>
      
      <Space style={{ marginBottom: 16 }}>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setTextModalOpen(true)}>
          导入文本
        </Button>
        <Button icon={<ReloadOutlined />} onClick={loadDocs}>刷新</Button>
      </Space>
      
      <Dragger
        multiple
        accept=".txt,.md,.pdf,.docx,.doc,.pptx,.xlsx,.xls,.csv,.json,.xml,.html,.jpg,.jpeg,.png,.bmp,.gif,.webp,.mp3,.wav,.ogg,.mp4,.avi,.mov,.py,.java,.js,.ts,.go,.sh"
        beforeUpload={handleUpload}
        showUploadList={false}
        style={{ marginBottom: 16 }}
      >
        <p className="ant-upload-drag-icon"><UploadOutlined /></p>
        <p className="ant-upload-text">点击或拖拽文件到此处上传</p>
        <p className="ant-upload-hint">
          支持: 文本(.txt/.md)、PDF、Word、PPT、Excel、图片(OCR)、音频、视频、代码等
        </p>
      </Dragger>
      
      <Select
        allowClear
        placeholder="按分类筛选"
        style={{ width: 200, marginBottom: 16 }}
        onChange={setCategory}
        options={categories.map(c => ({ label: c.name, value: c.name }))}
      />
      
      <List
        loading={docsLoading}
        dataSource={docs}
        pagination={{
          current: page,
          total: docsTotal,
          pageSize: 20,
          onChange: setPage,
          showTotal: (t) => `共 ${t} 条`
        }}
        renderItem={(item: any) => (
          <List.Item
            actions={[
              <Popconfirm title="确定删除?" onConfirm={() => handleDelete(item.id)} key="del">
                <Button danger icon={<DeleteOutlined />} size="small" />
              </Popconfirm>
            ]}
          >
            <List.Item.Meta
              avatar={<div style={{ fontSize: 24 }}>{fileIcon(item.file_type)}</div>}
              title={
                <Space>
                  <Text strong>{item.title}</Text>
                  {item.category && <Tag color="blue">{item.category}</Tag>}
                  {(item.tags || []).map((t: string) => <Tag key={t}>{t}</Tag>)}
                </Space>
              }
              description={
                <Space direction="vertical" size={0}>
                  <Text type="secondary">{item.filename} · {item.file_type?.toUpperCase()} · {(item.file_size / 1024).toFixed(1)}KB</Text>
                  <Text type="secondary">
                    {item.status === 'pending' && <Tag color="orange">等待解析</Tag>}
                    {item.status === 'processing' && <Tag color="blue">解析中...</Tag>}
                    {item.status === 'failed' && <Tag color="red">解析失败</Tag>}
                    {item.status === 'completed' && <span>分块数: {item.chunk_count}</span>}
                    {' · '}{item.created_at?.slice(0, 10)}
                  </Text>
                </Space>
              }
            />
          </List.Item>
        )}
      />
    </Card>
  );

  const searchTab = (
    <Card>
      <Space.Compact style={{ width: '100%', marginBottom: 16 }}>
        <Select
          value={searchType}
          onChange={setSearchType}
          style={{ width: 120 }}
          options={[
            { label: '混合搜索', value: 'hybrid' },
            { label: '语义搜索', value: 'semantic' },
            { label: '关键词', value: 'keyword' }
          ]}
        />
        <Input
          placeholder="输入问题或关键词..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          onPressEnter={handleSearch}
        />
        <Button type="primary" icon={<SearchOutlined />} loading={searching} onClick={handleSearch}>
          搜索
        </Button>
      </Space.Compact>
      
      {searchResults.length > 0 && (
        <>
          <Text type="secondary" style={{ display: 'block', marginBottom: 12 }}>
            找到 {searchResults.length} 条结果 · 耗时 {searchLatency.toFixed(0)}ms
          </Text>
          <List
            dataSource={searchResults}
            renderItem={(item: any) => (
              <List.Item>
                <Card size="small" style={{ width: '100%' }}>
                  <Space style={{ marginBottom: 8 }}>
                    <Tag color="blue">{item.metadata?.filename || '未知来源'}</Tag>
                    <Text type="secondary">相似度: {(item.score * 100).toFixed(1)}%</Text>
                    {item.metadata?.category && <Tag>{item.metadata.category}</Tag>}
                  </Space>
                  <Paragraph style={{ whiteSpace: 'pre-wrap', marginBottom: 0 }}>
                    {item.content}
                  </Paragraph>
                </Card>
              </List.Item>
            )}
          />
        </>
      )}
      {searchQuery && !searching && searchResults.length === 0 && (
          <Empty description={
            <span>
              未找到相关内容<br/>
              <Text type="secondary" style={{fontSize: 12}}>试试换个关键词或使用语义搜索</Text>
            </span>
          } />
        )}
    </Card>
  );

  const chatTab = (
    <Card
      title="💬 智能问答 (RAG)"
      extra={<Button size="small" onClick={() => { setMessages([]); setConversationId(null); }}>新对话</Button>}
    >
      <div style={{ height: 500, overflowY: 'auto', padding: 16, background: '#fafafa', borderRadius: 8, marginBottom: 16 }}>
        {messages.length === 0 && (
          <Empty description="输入问题开始对话，AI会基于知识库回答" />
        )}
        {messages.map((m, i) => (
          <div key={i} style={{ marginBottom: 16, textAlign: m.role === 'user' ? 'right' : 'left' }}>
            <div style={{
              display: 'inline-block',
              maxWidth: '80%',
              padding: '8px 12px',
              borderRadius: 8,
              background: m.role === 'user' ? '#1890ff' : '#fff',
              color: m.role === 'user' ? '#fff' : '#000',
              boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
              textAlign: 'left',
              whiteSpace: 'pre-wrap'
            }}>
              {m.content}
              {m.citations && m.citations.length > 0 && (
                <div style={{ marginTop: 8, fontSize: 12, opacity: 0.8, borderTop: '1px solid rgba(0,0,0,0.1)', paddingTop: 6 }}>
                  📚 引用来源：
                  {m.citations.map((c: any) => (
                    <div key={c.index}>[{c.index}] {c.filename}</div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
        {chatting && <Spin size="small" />}
      </div>
      
      <Space.Compact style={{ width: '100%' }}>
        <Input
          placeholder="输入问题..."
          value={chatInput}
          onChange={e => setChatInput(e.target.value)}
          onPressEnter={handleChat}
          disabled={chatting}
        />
        <Button type="primary" icon={<SendOutlined />} loading={chatting} onClick={handleChat}>
          发送
        </Button>
      </Space.Compact>
    </Card>
  );

  return (
    <div style={{ padding: 24 }}>
      <Title level={3}>📚 本地知识库</Title>
      <Tabs defaultActiveKey="upload">
        <Tabs.TabPane tab={<span><UploadOutlined />文档管理</span>} key="upload">
          {uploadTab}
        </Tabs.TabPane>
        <Tabs.TabPane tab={<span><SearchOutlined />知识检索</span>} key="search">
          {searchTab}
        </Tabs.TabPane>
        <Tabs.TabPane tab={<span><MessageOutlined />智能问答</span>} key="chat">
          {chatTab}
        </Tabs.TabPane>
      </Tabs>
      
      <Modal
        title="导入文本"
        open={textModalOpen}
        onOk={handleTextImport}
        onCancel={() => setTextModalOpen(false)}
        width={600}
      >
        <Form form={textForm} layout="vertical">
          <Form.Item name="title" label="标题" rules={[{ required: true }]}>
            <Input placeholder="请输入标题" />
          </Form.Item>
          <Form.Item name="content" label="内容" rules={[{ required: true }]}>
            <Input.TextArea rows={10} placeholder="粘贴文本内容..." />
          </Form.Item>
          <Form.Item name="category" label="分类">
            <Select
              allowClear
              placeholder="选择分类"
              options={categories.map(c => ({ label: c.name, value: c.name }))}
            />
          </Form.Item>
          <Form.Item name="tags" label="标签">
            <Input placeholder="用逗号分隔，如: 数学,三角函数" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default KnowledgeBasePage;
