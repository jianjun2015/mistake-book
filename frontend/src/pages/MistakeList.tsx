import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Table, Tag, Button, Space, Popconfirm, message, Badge, Dropdown } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
} from '@ant-design/icons';
import MainLayout from '../components/layout/MainLayout';
import { getMistakeList, deleteMistake, updateMistakeStatus } from '../api/mistake';
import { SUBJECT_MAP, STATUS_MAP } from '../types';
import type { Mistake } from '../types';

const MistakeList: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [dataSource, setDataSource] = useState<Mistake[]>([]);
  const [total, setTotal] = useState(0);
  const [current, setCurrent] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await getMistakeList(current, pageSize);
      const data = res.data;
      setDataSource(data.content);
      setTotal(data.totalElements);
    } catch (error) {
      console.error('获取错题列表失败', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [current, pageSize]);

  const handleDelete = async (id: number) => {
    try {
      await deleteMistake(id);
      message.success('删除成功');
      fetchData();
    } catch {
      message.error('删除失败');
    }
  };

  const handleStatusChange = async (id: number, newStatus: number) => {
    try {
      await updateMistakeStatus(id, newStatus);
      message.success('状态更新成功');
      fetchData();
    } catch {
      message.error('状态更新失败');
    }
  };

  const columns: ColumnsType<Mistake> = [
    {
      title: '题目',
      dataIndex: 'title',
      key: 'title',
      ellipsis: true,
      width: 300,
      render: (text: string, record: Mistake) => (
        <a onClick={() => navigate(`/mistakes/${record.id}`)}>{text || '（无标题）'}</a>
      ),
    },
    {
      title: '学科',
      dataIndex: 'subject',
      key: 'subject',
      width: 100,
      render: (subject: string) => {
        const subjectInfo = SUBJECT_MAP[subject];
        return subjectInfo ? (
          <Tag color={subjectInfo.color}>{subjectInfo.name}</Tag>
        ) : (
          <Tag>{subject || '-'}</Tag>
        );
      },
    },
    {
      title: '难度',
      dataIndex: 'difficulty',
      key: 'difficulty',
      width: 80,
      render: (diff: number) => '⭐'.repeat(diff || 1),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (status: number, record: Mistake) => {
        const statusInfo = STATUS_MAP[status as keyof typeof STATUS_MAP];
        return (
          <Dropdown
            menu={{
              items: Object.entries(STATUS_MAP).map(([value, info]: [string, { label: string; color: string }]) => ({
                key: value,
                label: info.label,
                onClick: () => handleStatusChange(record.id, Number(value)),
              })),
            }}
            trigger={['click']}
          >
            <Badge
              status={statusInfo?.color as any}
              text={statusInfo?.label}
              style={{ cursor: 'pointer' }}
            />
          </Dropdown>
        );
      },
    },
    {
      title: '标签',
      dataIndex: 'tags',
      key: 'tags',
      width: 200,
      render: (tags: string[]) => (
        <Space wrap>
          {tags?.map((tag) => (
            <Tag key={tag}>{tag}</Tag>
          )) || '-'}
        </Space>
      ),
    },
    {
      title: '图片',
      dataIndex: 'images',
      key: 'images',
      width: 60,
      render: (images: any[]) => images?.length || 0,
    },
    {
      title: '创建时间',
      dataIndex: 'createTime',
      key: 'createTime',
      width: 180,
      render: (time: string) => new Date(time).toLocaleString('zh-CN'),
    },
    {
      title: '操作',
      key: 'action',
      width: 180,
      fixed: 'right' as const,
      render: (_: any, record: Mistake) => (
        <Space>
          <Button
            type="link"
            icon={<EyeOutlined />}
            onClick={() => navigate(`/mistakes/${record.id}`)}
          >
            查看
          </Button>
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => navigate(`/mistakes/edit/${record.id}`)}
          >
            编辑
          </Button>
          <Popconfirm
            title="确定删除该错题？"
            onConfirm={() => handleDelete(record.id)}
            okText="确定"
            cancelText="取消"
          >
            <Button type="link" danger icon={<DeleteOutlined />}>
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <MainLayout>
      <div style={{ padding: 24 }}>
        <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2>错题列表</h2>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('/mistakes/add')}>
            添加错题
          </Button>
        </div>
        <Table
          columns={columns}
          dataSource={dataSource}
          rowKey="id"
          loading={loading}
          scroll={{ x: 1200 }}
          pagination={{
            current,
            pageSize,
            total,
            showSizeChanger: true,
            showTotal: (total) => `共 ${total} 条`,
            onChange: (page, pageSize) => {
              setCurrent(page);
              setPageSize(pageSize);
            },
          }}
        />
      </div>
    </MainLayout>
  );
};

export default MistakeList;
