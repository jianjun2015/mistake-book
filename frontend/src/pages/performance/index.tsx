import React, { useState, useEffect, useCallback } from 'react';
import request from '../../utils/request';
import {
  Card, Tabs, Table, Form, Input, InputNumber, DatePicker, Select, Button,
  Modal, Tag, Space, message, Popconfirm, Descriptions, Divider, Row, Col,
  Tooltip, Switch,
} from 'antd';
import {
  PlusOutlined, EditOutlined, DeleteOutlined,
  ReloadOutlined, SettingOutlined, FileTextOutlined,
} from '@ant-design/icons';
import dayjs, { Dayjs } from 'dayjs';
import MainLayout from '../../components/layout/MainLayout';

const { RangePicker } = DatePicker;

// ─── Types ──────────────────────────────────────────────────────────────
interface Category {
  id: number;
  type: string;
  name: string;
  maxScore: number;
  sortOrder: number;
}

interface PerformanceRecord {
  id: number;
  categoryId: number;
  categoryName: string;
  type: string;
  title: string;
  score: number;
  recordDate: string;
  remark: string;
}

interface Summary {
  id: number;
  periodName: string;
  startDate: string;
  endDate: string;
  examAvg: number;
  learningAvg: number;
  dailyAvg: number;
  compositeScore: number;
  grade: string;
  studentSummary: string;
  improvementPlan: string;
  parentComment: string;
}

interface RewardPunishmentRecord {
  id: number;
  grade: string;
  category: string;
  subCategory: string;
  detail: string;
  completed: boolean;
  recordDate: string;
  remark: string;
}

// ─── Constants ──────────────────────────────────────────────────────────
const TYPE_CONFIG: Record<string, { label: string; key: string; defaultCategories: { name: string; maxScore: number }[] }> = {
  EXAM: {
    label: '考试记录',
    key: 'EXAM',
    defaultCategories: [
      { name: '语文', maxScore: 100 },
      { name: '数学', maxScore: 100 },
      { name: '英语', maxScore: 100 },
    ],
  },
  LEARNING: {
    label: '学习表现',
    key: 'LEARNING',
    defaultCategories: [
      { name: '练字', maxScore: 10 },
      { name: '听写', maxScore: 10 },
      { name: '默写', maxScore: 10 },
      { name: '朗读', maxScore: 10 },
      { name: '口算', maxScore: 10 },
    ],
  },
  DAILY: {
    label: '日常表现',
    key: 'DAILY',
    defaultCategories: [
      { name: '表扬', maxScore: 10 },
      { name: '批评', maxScore: 10 },
      { name: '家务', maxScore: 10 },
      { name: '运动', maxScore: 10 },
      { name: '作息', maxScore: 10 },
    ],
  },
};

const GRADE_COLORS: Record<string, string> = {
  'A+': '#52c41a',
  'A': '#a0d911',
  'B': '#1677ff',
  'C': '#fa8c16',
  'D': '#f5222d',
  'D-': '#a8071a',
};

const GRADE_OPTIONS = ['一年级', '二年级', '三年级', '四年级', '五年级', '六年级'];

const REWARD_SUB_CATEGORIES = ['学习进步', '优秀作业', '课堂表现', '竞赛获奖', '好人好事', '其他奖励'];
const PUNISHMENT_SUB_CATEGORIES = ['作业未完成', '课堂违纪', '考试作弊', '行为不当', '其他惩罚'];

// ─── Main Component ─────────────────────────────────────────────────────
const PerformancePage: React.FC = () => {
  const [activeTab, setActiveTab] = useState('EXAM');
  const [selectedGrade, setSelectedGrade] = useState('三年级');
  const [records, setRecords] = useState<PerformanceRecord[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [summaries, setSummaries] = useState<Summary[]>([]);
  const [loading, setLoading] = useState(false);
  const [dateRange, setDateRange] = useState<[Dayjs, Dayjs]>([
    dayjs().startOf('month'),
    dayjs().endOf('month'),
  ]);

  // Record modal
  const [recordModalOpen, setRecordModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<PerformanceRecord | null>(null);
  const [recordForm] = Form.useForm();

  // Category modal
  const [categoryModalOpen, setCategoryModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [categoryForm] = Form.useForm();

  // Summary modal
  const [generateModalOpen, setGenerateModalOpen] = useState(false);
  const [generateForm] = Form.useForm();
  const [expandedSummary, setExpandedSummary] = useState<Summary | null>(null);
  const [summaryDetailOpen, setSummaryDetailOpen] = useState(false);
  const [summaryForm] = Form.useForm();

  // ─── Reward/Punishment state ──────────────────────────────────────────
  const [rpSubTab, setRpSubTab] = useState<'REWARD' | 'PUNISHMENT'>('REWARD');
  const [rpRecords, setRpRecords] = useState<RewardPunishmentRecord[]>([]);
  const [rpLoading, setRpLoading] = useState(false);
  const [rpDateRange, setRpDateRange] = useState<[Dayjs, Dayjs]>([
    dayjs().startOf('month'),
    dayjs().endOf('month'),
  ]);
  const [rpModalOpen, setRpModalOpen] = useState(false);
  const [editingRpRecord, setEditingRpRecord] = useState<RewardPunishmentRecord | null>(null);
  const [rpForm] = Form.useForm();

  // ─── Data Fetching ────────────────────────────────────────────────────
  const fetchCategories = useCallback(async (type: string) => {
    try {
      const data: any = await request.get('/performance/categories', { params: { type } });
      setCategories(data.data || []);
    } catch {
      message.error('获取分类失败');
    }
  }, []);

  const fetchRecords = useCallback(async (type: string, start: string, end: string) => {
    setLoading(true);
    try {
      const data: any = await request.get('/performance/records', { params: { type, start, end } });
      setRecords(data.data || []);
    } catch {
      message.error('获取记录失败');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchSummaries = useCallback(async () => {
    try {
      const data: any = await request.get('/performance/summaries');
      setSummaries(data.data || []);
    } catch {
      message.error('获取汇总失败');
    }
  }, []);

  const fetchRpRecords = useCallback(async (start: string, end: string) => {
    setRpLoading(true);
    try {
      const data: any = await request.get('/reward-punishment/records', { params: { start, end } });
      setRpRecords(data.data || []);
    } catch {
      message.error('获取奖惩记录失败');
    } finally {
      setRpLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCategories(activeTab);
    fetchRecords(activeTab, dateRange[0].format('YYYY-MM-DD'), dateRange[1].format('YYYY-MM-DD'));
  }, [activeTab, dateRange, fetchCategories, fetchRecords]);

  useEffect(() => {
    fetchSummaries();
  }, [fetchSummaries]);

  useEffect(() => {
    if (activeTab === 'REWARD_PUNISHMENT') {
      fetchRpRecords(rpDateRange[0].format('YYYY-MM-DD'), rpDateRange[1].format('YYYY-MM-DD'));
    }
  }, [activeTab, rpDateRange, fetchRpRecords]);

  // ─── Record CRUD ──────────────────────────────────────────────────────
  const handleAddRecord = () => {
    setEditingRecord(null);
    recordForm.resetFields();
    recordForm.setFieldsValue({ recordDate: dayjs() });
    setRecordModalOpen(true);
  };

  const handleEditRecord = (record: PerformanceRecord) => {
    setEditingRecord(record);
    recordForm.setFieldsValue({
      ...record,
      recordDate: dayjs(record.recordDate),
    });
    setRecordModalOpen(true);
  };

  const handleSaveRecord = async () => {
    try {
      const values = await recordForm.validateFields();
      const body = {
        ...values,
        type: activeTab,
        recordDate: values.recordDate.format('YYYY-MM-DD'),
      };
      if (editingRecord) {
        await request.put(`/performance/records/${editingRecord.id}`, body);
      } else {
        await request.post('/performance/records', body);
      }
      message.success(editingRecord ? '记录已更新' : '记录已添加');
      setRecordModalOpen(false);
      fetchRecords(activeTab, dateRange[0].format('YYYY-MM-DD'), dateRange[1].format('YYYY-MM-DD'));
    } catch {
      message.error('保存记录失败');
    }
  };

  const handleDeleteRecord = async (id: number) => {
    try {
      await request.delete(`/performance/records/${id}`);
      message.success('记录已删除');
      fetchRecords(activeTab, dateRange[0].format('YYYY-MM-DD'), dateRange[1].format('YYYY-MM-DD'));
    } catch {
      message.error('删除记录失败');
    }
  };

  // ─── Category CRUD ────────────────────────────────────────────────────
  const handleAddCategory = () => {
    setEditingCategory(null);
    categoryForm.resetFields();
    categoryForm.setFieldsValue({ maxScore: activeTab === 'EXAM' ? 100 : 10 });
    setCategoryModalOpen(true);
  };

  const handleEditCategory = (cat: Category) => {
    setEditingCategory(cat);
    categoryForm.setFieldsValue(cat);
    setCategoryModalOpen(true);
  };

  const handleSaveCategory = async () => {
    try {
      const values = await categoryForm.validateFields();
      const body = { ...values, type: activeTab };
      if (editingCategory) {
        await request.put(`/performance/categories/${editingCategory.id}`, body);
      } else {
        await request.post('/performance/categories', body);
      }
      message.success(editingCategory ? '分类已更新' : '分类已添加');
      setCategoryModalOpen(false);
      fetchCategories(activeTab);
    } catch {
      message.error('保存分类失败');
    }
  };

  const handleDeleteCategory = async (id: number) => {
    try {
      await request.delete(`/performance/categories/${id}`);
      message.success('分类已删除');
      fetchCategories(activeTab);
    } catch {
      message.error('删除分类失败');
    }
  };

  // ─── Summary CRUD ─────────────────────────────────────────────────────
  const handleGenerateSummary = async () => {
    try {
      const values = await generateForm.validateFields();
      const { periodName, dateRange: range } = values;
      await request.post('/performance/summaries/generate', null, {
        params: { periodName, startDate: range[0].format('YYYY-MM-DD'), endDate: range[1].format('YYYY-MM-DD') }
      });
      message.success('阶段汇总已生成');
      setGenerateModalOpen(false);
      fetchSummaries();
    } catch {
      message.error('生成汇总失败');
    }
  };

  const handleViewSummary = (summary: Summary) => {
    setExpandedSummary(summary);
    summaryForm.setFieldsValue({
      studentSummary: summary.studentSummary || '',
      improvementPlan: summary.improvementPlan || '',
      parentComment: summary.parentComment || '',
    });
    setSummaryDetailOpen(true);
  };

  const handleSaveSummary = async () => {
    if (!expandedSummary) return;
    try {
      const values = await summaryForm.validateFields();
      await request.put(`/performance/summaries/${expandedSummary.id}`, values);
      message.success('汇总已更新');
      setSummaryDetailOpen(false);
      fetchSummaries();
    } catch {
      message.error('保存汇总失败');
    }
  };

  // ─── Reward/Punishment CRUD ───────────────────────────────────────────
  const handleAddRpRecord = () => {
    setEditingRpRecord(null);
    rpForm.resetFields();
    rpForm.setFieldsValue({
      grade: selectedGrade,
      category: rpSubTab,
      recordDate: dayjs(),
      completed: false,
    });
    setRpModalOpen(true);
  };

  const handleEditRpRecord = (record: RewardPunishmentRecord) => {
    setEditingRpRecord(record);
    rpForm.setFieldsValue({
      ...record,
      recordDate: dayjs(record.recordDate),
    });
    setRpModalOpen(true);
  };

  const handleSaveRpRecord = async () => {
    try {
      const values = await rpForm.validateFields();
      const body = {
        ...values,
        category: rpSubTab,
        recordDate: values.recordDate.format('YYYY-MM-DD'),
        completed: values.completed || false,
      };
      if (editingRpRecord) {
        await request.put(`/reward-punishment/records/${editingRpRecord.id}`, body);
      } else {
        await request.post('/reward-punishment/records', body);
      }
      message.success(editingRpRecord ? '记录已更新' : '记录已添加');
      setRpModalOpen(false);
      fetchRpRecords(rpDateRange[0].format('YYYY-MM-DD'), rpDateRange[1].format('YYYY-MM-DD'));
    } catch {
      message.error('保存奖惩记录失败');
    }
  };

  const handleDeleteRpRecord = async (id: number) => {
    try {
      await request.delete(`/reward-punishment/records/${id}`);
      message.success('记录已删除');
      fetchRpRecords(rpDateRange[0].format('YYYY-MM-DD'), rpDateRange[1].format('YYYY-MM-DD'));
    } catch {
      message.error('删除奖惩记录失败');
    }
  };

  const handleToggleRpCompleted = async (id: number) => {
    try {
      await request.put(`/reward-punishment/records/${id}/completed`);
      message.success('状态已更新');
      fetchRpRecords(rpDateRange[0].format('YYYY-MM-DD'), rpDateRange[1].format('YYYY-MM-DD'));
    } catch {
      message.error('更新状态失败');
    }
  };

// ─── Record Table Columns @@\
  const recordColumns = [
    {
      title: '分类',
      dataIndex: 'categoryName',
      key: 'categoryName',
      render: (name: string) => <Tag color="blue">{name}</Tag>,
    },
    { title: '标题', dataIndex: 'title', key: 'title' },
    {
      title: '分数',
      dataIndex: 'score',
      key: 'score',
      sorter: (a: PerformanceRecord, b: PerformanceRecord) => a.score - b.score,
    },
    {
      title: '日期',
      dataIndex: 'recordDate',
      key: 'recordDate',
      sorter: (a: PerformanceRecord, b: PerformanceRecord) => a.recordDate.localeCompare(b.recordDate),
    },
    { title: '备注', dataIndex: 'remark', key: 'remark', ellipsis: true },
    {
      title: '操作',
      key: 'action',
      width: 120,
      render: (_: unknown, record: PerformanceRecord) => (
        <Space size="small">
          <Tooltip title="编辑">
            <Button type="link" size="small" icon={<EditOutlined />} onClick={() => handleEditRecord(record)} />
          </Tooltip>
          <Popconfirm title="确认删除该记录？" onConfirm={() => handleDeleteRecord(record.id)}>
            <Tooltip title="删除">
              <Button type="link" size="small" danger icon={<DeleteOutlined />} />
            </Tooltip>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  // ─── Category Table Columns ───────────────────────────────────────────
  const categoryColumns = [
    { title: '分类名称', dataIndex: 'name', key: 'name' },
    { title: '满分', dataIndex: 'maxScore', key: 'maxScore' },
    { title: '排序', dataIndex: 'sortOrder', key: 'sortOrder' },
    {
      title: '操作',
      key: 'action',
      width: 120,
      render: (_: unknown, cat: Category) => (
        <Space size="small">
          <Button type="link" size="small" icon={<EditOutlined />} onClick={() => handleEditCategory(cat)} />
          <Popconfirm title="确认删除该分类？" onConfirm={() => handleDeleteCategory(cat.id)}>
            <Button type="link" size="small" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  // ─── Summary Table Columns ────────────────────────────────────────────
  const summaryColumns = [
    { title: '阶段名称', dataIndex: 'periodName', key: 'periodName' },
    {
      title: '考试平均分',
      dataIndex: 'examAvg',
      key: 'examAvg',
      render: (v: number) => (v != null ? v.toFixed(1) : '-'),
    },
    {
      title: '学习表现平均',
      dataIndex: 'learningAvg',
      key: 'learningAvg',
      render: (v: number) => (v != null ? v.toFixed(1) : '-'),
    },
    {
      title: '日常表现平均',
      dataIndex: 'dailyAvg',
      key: 'dailyAvg',
      render: (v: number) => (v != null ? v.toFixed(1) : '-'),
    },
    {
      title: '综合得分',
      dataIndex: 'compositeScore',
      key: 'compositeScore',
      render: (v: number) => (v != null ? v.toFixed(1) : '-'),
    },
    {
      title: '等级',
      dataIndex: 'grade',
      key: 'grade',
      render: (grade: string) => (
        <Tag color={GRADE_COLORS[grade] || 'default'} style={{ fontWeight: 600, fontSize: 14 }}>
          {grade}
        </Tag>
      ),
    },
    {
      title: '操作',
      key: 'action',
      render: (_: unknown, summary: Summary) => (
        <Button type="link" icon={<FileTextOutlined />} onClick={() => handleViewSummary(summary)}>
          查看详情
        </Button>
      ),
    },
  ];

  // ─── Reward/Punishment Table Columns ──────────────────────────────────
  const rpColumns = [
    {
      title: '年级',
      dataIndex: 'grade',
      key: 'grade',
      render: () => selectedGrade,
    },
    {
      title: '大类',
      dataIndex: 'category',
      key: 'category',
      render: (category: string) => (
        <Tag color={category === 'REWARD' ? 'green' : 'red'}>
          {category === 'REWARD' ? '奖励' : '惩罚'}
        </Tag>
      ),
    },
    {
      title: '小类',
      dataIndex: 'subCategory',
      key: 'subCategory',
    },
    {
      title: '奖惩明细',
      dataIndex: 'detail',
      key: 'detail',
      ellipsis: true,
    },
    {
      title: '是否完成',
      dataIndex: 'completed',
      key: 'completed',
      width: 100,
      render: (completed: boolean, record: RewardPunishmentRecord) => (
        <Switch
          checked={completed}
          size="small"
          onChange={() => handleToggleRpCompleted(record.id)}
        />
      ),
    },
    {
      title: '日期',
      dataIndex: 'recordDate',
      key: 'recordDate',
      sorter: (a: RewardPunishmentRecord, b: RewardPunishmentRecord) => a.recordDate.localeCompare(b.recordDate),
    },
    {
      title: '备注',
      dataIndex: 'remark',
      key: 'remark',
      ellipsis: true,
    },
    {
      title: '操作',
      key: 'action',
      width: 120,
      render: (_: unknown, record: RewardPunishmentRecord) => (
        <Space size="small">
          <Tooltip title="编辑">
            <Button type="link" size="small" icon={<EditOutlined />} onClick={() => handleEditRpRecord(record)} />
          </Tooltip>
          <Popconfirm title="确认删除该记录？" onConfirm={() => handleDeleteRpRecord(record.id)}>
            <Tooltip title="删除">
              <Button type="link" size="small" danger icon={<DeleteOutlined />} />
            </Tooltip>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  // ─── Tab Content Builder ──────────────────────────────────────────────
  const renderTabContent = (type: string) => {
    return (
      <>
        <Row justify="space-between" align="middle" style={{ marginBottom: 16 }}>
          <Col>
            <Space>
              <span style={{ fontWeight: 500 }}>日期范围：</span>
              <RangePicker
                value={dateRange}
                onChange={(dates) => {
                  if (dates && dates[0] && dates[1]) {
                    setDateRange([dates[0], dates[1]]);
                  }
                }}
                allowClear={false}
              />
              <Button
                icon={<ReloadOutlined />}
                onClick={() => fetchRecords(type, dateRange[0].format('YYYY-MM-DD'), dateRange[1].format('YYYY-MM-DD'))}
              >
                刷新
              </Button>
            </Space>
          </Col>
          <Col>
            <Space>
              <Button icon={<SettingOutlined />} onClick={handleAddCategory}>
                管理分类
              </Button>
              <Button type="primary" icon={<PlusOutlined />} onClick={handleAddRecord}>
                添加记录
              </Button>
            </Space>
          </Col>
        </Row>

        <Table
          columns={recordColumns}
          dataSource={records}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 10, showTotal: (t) => `共 ${t} 条` }}
          size="middle"
        />
      </>
    );
  };

  // ─── Reward/Punishment Tab Content ────────────────────────────────────
  const renderRpTabContent = () => {
    const filteredRecords = rpRecords.filter((r) => r.category === rpSubTab);
    return (
      <>
        <Row justify="space-between" align="middle" style={{ marginBottom: 16 }}>
          <Col>
            <Space>
              <span style={{ fontWeight: 500 }}>日期范围：</span>
              <RangePicker
                value={rpDateRange}
                onChange={(dates) => {
                  if (dates && dates[0] && dates[1]) {
                    setRpDateRange([dates[0], dates[1]]);
                  }
                }}
                allowClear={false}
              />
              <Button
                icon={<ReloadOutlined />}
                onClick={() => fetchRpRecords(rpDateRange[0].format('YYYY-MM-DD'), rpDateRange[1].format('YYYY-MM-DD'))}
              >
                刷新
              </Button>
            </Space>
          </Col>
          <Col>
            <Button type="primary" icon={<PlusOutlined />} onClick={handleAddRpRecord}>
              添加记录
            </Button>
          </Col>
        </Row>

        <Tabs
          activeKey={rpSubTab}
          onChange={(key) => setRpSubTab(key as 'REWARD' | 'PUNISHMENT')}
          items={[
            { key: 'REWARD', label: '奖励记录' },
            { key: 'PUNISHMENT', label: '惩罚记录' },
          ]}
          style={{ marginBottom: 0 }}
        />

        <Table
          columns={rpColumns}
          dataSource={filteredRecords}
          rowKey="id"
          loading={rpLoading}
          pagination={{ pageSize: 10, showTotal: (t) => `共 ${t} 条` }}
          size="middle"
        />
      </>
    );
  };

  // ─── Tab Items ────────────────────────────────────────────────────────
  const tabItems = [
    ...Object.entries(TYPE_CONFIG).map(([key, config]) => ({
      key,
      label: config.label,
      children: renderTabContent(key),
    })),
    {
      key: 'REWARD_PUNISHMENT',
      label: '奖惩记录',
      children: renderRpTabContent(),
    },
  ];

  // ─── Sub-category options based on current rpSubTab ───────────────────
  const currentSubCategories = rpSubTab === 'REWARD' ? REWARD_SUB_CATEGORIES : PUNISHMENT_SUB_CATEGORIES;

  // ─── Render ───────────────────────────────────────────────────────────
  return (
    <MainLayout>
      <Card title="📝 表现记录" style={{ marginBottom: 16 }}>
        <div style={{ marginBottom: 16 }}>
          <Space>
            <span style={{ fontWeight: 500 }}>当前年级：</span>
            <Select
              value={selectedGrade}
              onChange={setSelectedGrade}
              style={{ width: 150 }}
              options={GRADE_OPTIONS.map((g) => ({ label: g, value: g }))}
            />
          </Space>
        </div>
        <Tabs activeKey={activeTab} onChange={setActiveTab} items={tabItems} />
      </Card>

      {/* 阶段汇总 */}
      <Card
        title="📊 阶段汇总"
        extra={
          <Button type="primary" icon={<PlusOutlined />} onClick={() => { generateForm.resetFields(); setGenerateModalOpen(true); }}>
            生成汇总
          </Button>
        }
      >
        <Table
          columns={summaryColumns}
          dataSource={summaries}
          rowKey="id"
          pagination={{ pageSize: 5, showTotal: (t) => `共 ${t} 条` }}
          size="middle"
        />
      </Card>

      {/* ─── Record Modal ──────────────────────────────────────────── */}
      <Modal
        title={editingRecord ? '编辑记录' : '添加记录'}
        open={recordModalOpen}
        onOk={handleSaveRecord}
        onCancel={() => setRecordModalOpen(false)}
        destroyOnClose
        width={520}
      >
        <Form form={recordForm} layout="vertical">
          <Form.Item name="categoryId" label="分类" rules={[{ required: true, message: '请选择分类' }]}>
            <Select placeholder="选择分类">
              {categories.map((cat) => (
                <Select.Option key={cat.id} value={cat.id}>
                  {cat.name}（满分 {cat.maxScore}）
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="title" label="标题" rules={[{ required: true, message: '请输入标题' }]}>
            <Input placeholder="如：第三单元测试" />
          </Form.Item>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="score" label="分数" rules={[{ required: true, message: '请输入分数' }]}>
                <InputNumber style={{ width: '100%' }} min={0} max={100} placeholder="分数" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="recordDate" label="日期" rules={[{ required: true, message: '请选择日期' }]}>
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="remark" label="备注">
            <Input.TextArea rows={3} placeholder="备注信息（可选）" />
          </Form.Item>
        </Form>
      </Modal>

      {/* ─── Category Modal ────────────────────────────────────────── */}
      <Modal
        title={editingCategory ? '编辑分类' : '添加分类'}
        open={categoryModalOpen}
        onOk={handleSaveCategory}
        onCancel={() => setCategoryModalOpen(false)}
        destroyOnClose
        width={520}
        footer={(_, { OkBtn, CancelBtn }) => (
          <>
            <CancelBtn />
            <OkBtn />
          </>
        )}
      >
        <Form form={categoryForm} layout="vertical">
          <Form.Item name="name" label="分类名称" rules={[{ required: true, message: '请输入分类名称' }]}>
            <Input placeholder="如：科学" />
          </Form.Item>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="maxScore" label="满分" rules={[{ required: true, message: '请输入满分' }]}>
                <InputNumber style={{ width: '100%' }} min={1} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="sortOrder" label="排序" initialValue={0}>
                <InputNumber style={{ width: '100%' }} min={0} />
              </Form.Item>
            </Col>
          </Row>
        </Form>

        <Divider>当前分类列表</Divider>
        <Table
          columns={categoryColumns}
          dataSource={categories}
          rowKey="id"
          size="small"
          pagination={false}
        />
      </Modal>

      {/* ─── Generate Summary Modal ────────────────────────────────── */}
      <Modal
        title="生成阶段汇总"
        open={generateModalOpen}
        onOk={handleGenerateSummary}
        onCancel={() => setGenerateModalOpen(false)}
        destroyOnClose
      >
        <Form form={generateForm} layout="vertical">
          <Form.Item name="periodName" label="阶段名称" rules={[{ required: true, message: '请输入阶段名称' }]}>
            <Input placeholder="如：2025年秋季学期" />
          </Form.Item>
          <Form.Item name="dateRange" label="日期范围" rules={[{ required: true, message: '请选择日期范围' }]}>
            <RangePicker style={{ width: '100%' }} />
          </Form.Item>
        </Form>
      </Modal>

      {/* ─── Summary Detail Modal ──────────────────────────────────── */}
      <Modal
        title={expandedSummary ? `${expandedSummary.periodName} — 详情` : '汇总详情'}
        open={summaryDetailOpen}
        onOk={handleSaveSummary}
        onCancel={() => setSummaryDetailOpen(false)}
        width={640}
        okText="保存"
        destroyOnClose
      >
        {expandedSummary && (
          <>
            <Descriptions bordered size="small" column={2} style={{ marginBottom: 16 }}>
              <Descriptions.Item label="考试平均">{expandedSummary.examAvg?.toFixed(1)}</Descriptions.Item>
              <Descriptions.Item label="学习表现平均">{expandedSummary.learningAvg?.toFixed(1)}</Descriptions.Item>
              <Descriptions.Item label="日常表现平均">{expandedSummary.dailyAvg?.toFixed(1)}</Descriptions.Item>
              <Descriptions.Item label="综合得分">{expandedSummary.compositeScore?.toFixed(1)}</Descriptions.Item>
              <Descriptions.Item label="等级">
                <Tag color={GRADE_COLORS[expandedSummary.grade] || 'default'} style={{ fontWeight: 600, fontSize: 16 }}>
                  {expandedSummary.grade}
                </Tag>
              </Descriptions.Item>
            </Descriptions>

            <Form form={summaryForm} layout="vertical">
              <Form.Item name="studentSummary" label="学生自评">
                <Input.TextArea rows={3} placeholder="学生自我总结..." />
              </Form.Item>
              <Form.Item name="improvementPlan" label="改进计划">
                <Input.TextArea rows={3} placeholder="下一步改进计划..." />
              </Form.Item>
              <Form.Item name="parentComment" label="家长评语">
                <Input.TextArea rows={3} placeholder="家长评语..." />
              </Form.Item>
            </Form>
          </>
        )}
      </Modal>

      {/* ─── Reward/Punishment Modal ───────────────────────────────── */}
      <Modal
        title={editingRpRecord ? '编辑奖惩记录' : '添加奖惩记录'}
        open={rpModalOpen}
        onOk={handleSaveRpRecord}
        onCancel={() => setRpModalOpen(false)}
        destroyOnClose
        width={520}
      >
        <Form form={rpForm} layout="vertical">
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="grade" label="年级" rules={[{ required: true, message: '请选择年级' }]}>
                <Select placeholder="选择年级">
                  {GRADE_OPTIONS.map((g) => (
                    <Select.Option key={g} value={g}>{g}</Select.Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="subCategory" label="小类" rules={[{ required: true, message: '请选择小类' }]}>
                <Select placeholder="选择小类">
                  {currentSubCategories.map((sc) => (
                    <Select.Option key={sc} value={sc}>{sc}</Select.Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="detail" label="奖惩明细" rules={[{ required: true, message: '请输入奖惩明细' }]}>
            <Input.TextArea rows={3} placeholder="请输入奖惩明细" />
          </Form.Item>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="recordDate" label="日期" rules={[{ required: true, message: '请选择日期' }]}>
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="completed" label="是否完成" valuePropName="checked">
                <Switch />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="remark" label="备注">
            <Input.TextArea rows={2} placeholder="备注信息（可选）" />
          </Form.Item>
        </Form>
      </Modal>
    </MainLayout>
  );
};

export default PerformancePage;
