import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Button, Tag, Space, Divider, message, Badge, Collapse, Image } from 'antd';
import {
  ArrowLeftOutlined,
  EditOutlined,
  ThunderboltOutlined,
} from '@ant-design/icons';
import MainLayout from '../components/layout/MainLayout';
import { getMistake, updateMistakeStatus, deleteMistake } from '../api/mistake';
import { SUBJECT_MAP, STATUS_MAP } from '../types';
import type { Mistake } from '../types';

const { Panel } = Collapse;

const MistakeDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [mistake, setMistake] = useState<Mistake | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const res = await getMistake(Number(id));
      setMistake(res.data);
    } catch (error) {
      console.error('获取错题详情失败', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [id]);

  const handleStatusChange = async (newStatus: number) => {
    if (!mistake) return;
    try {
      await updateMistakeStatus(mistake.id, newStatus);
      setMistake({ ...mistake, status: newStatus });
      message.success('状态更新成功');
    } catch {
      message.error('更新失败');
    }
  };

  const handleDelete = async () => {
    if (!mistake) return;
    try {
      await deleteMistake(mistake.id);
      message.success('删除成功');
      navigate('/mistakes');
    } catch {
      message.error('删除失败');
    }
  };

  if (loading) return <MainLayout><div style={{ padding: 24, textAlign: 'center' }}>加载中...</div></MainLayout>;
  if (!mistake) return <MainLayout><div style={{ padding: 24, textAlign: 'center' }}>错题不存在</div></MainLayout>;

  const subjectInfo = SUBJECT_MAP[mistake.subject];
  const statusInfo = STATUS_MAP[mistake.status as keyof typeof STATUS_MAP];

  return (
    <MainLayout>
      <div style={{ padding: 24, maxWidth: 900, margin: '0 auto' }}>
        <Button
          icon={<ArrowLeftOutlined />}
          onClick={() => navigate('/mistakes')}
          style={{ marginBottom: 16 }}
        >
          返回列表
        </Button>

        <Card bordered={false}>
          {/* Header */}
          <div style={{ marginBottom: 24 }}>
            <Space align="center" style={{ marginBottom: 12 }}>
              <h1 style={{ margin: 0, fontSize: 24 }}>{mistake.title || '（无标题）'}</h1>
              {subjectInfo && (
                <Tag color={subjectInfo.color} style={{ fontSize: 14 }}>{subjectInfo.name}</Tag>
              )}
              <Badge status={statusInfo?.color as any} text={statusInfo?.label} />
              <span style={{ color: '#faad14' }}>{'⭐'.repeat(mistake.difficulty || 1)}</span>
            </Space>
            <div style={{ color: '#999', fontSize: 12 }}>
              创建时间: {new Date(mistake.createTime).toLocaleString('zh-CN')}
              {' | '}
              复习次数: {mistake.reviewCount}
              {' | '}
              标签: {mistake.tags?.join(', ') || '无'}
            </div>
          </div>

          <Divider />

          {/* Question */}
          <Collapse defaultActiveKey={['question']} style={{ marginBottom: 16 }}>
            <Panel header="📝 题目内容" key="question">
              <div style={{ whiteSpace: 'pre-wrap', lineHeight: 1.8 }}>{mistake.content}</div>
            </Panel>
          </Collapse>

          {/* Images */}
          {mistake.images && mistake.images.length > 0 && (
            <Card title={`📷 图片（${mistake.images.length}张）`} size="small" style={{ marginBottom: 16 }}>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16 }}>
                {mistake.images.map((img) => (
                  <Image
                    key={img.id}
                    src={img.imageUrl}
                    alt="题目图片"
                    width={300}
                    style={{ borderRadius: 8, objectFit: 'contain', border: '1px solid #f0f0f0' }}
                  />
                ))}
              </div>
            </Card>
          )}

          {/* Answer */}
          {mistake.correctAnswer && (
            <Collapse defaultActiveKey={['answer']} style={{ marginBottom: 16 }}>
              <Panel header="✅ 正确答案" key="answer">
                <div style={{ whiteSpace: 'pre-wrap', lineHeight: 1.8, color: '#52c41a' }}>
                  {mistake.correctAnswer}
                </div>
              </Panel>
            </Collapse>
          )}

          {/* Wrong Reason */}
          {mistake.wrongReason && (
            <Collapse defaultActiveKey={['reason']} style={{ marginBottom: 16 }}>
              <Panel header="💡 错误分析" key="reason">
                <div style={{ whiteSpace: 'pre-wrap', lineHeight: 1.8, color: '#ff4d4f' }}>
                  {mistake.wrongReason}
                </div>
              </Panel>
            </Collapse>
          )}

          {/* Action Buttons */}
          <Divider />
          <Space wrap>
            <Button
              type="primary"
              danger
              icon={<ThunderboltOutlined />}
              onClick={() => handleStatusChange(0)}
              disabled={mistake.status === 0}
            >
              未掌握
            </Button>
            <Button
              type="default"
              icon={<ThunderboltOutlined />}
              onClick={() => handleStatusChange(1)}
              disabled={mistake.status === 1}
            >
              半掌握
            </Button>
            <Button
              type="primary"
              style={{ background: '#52c41a', borderColor: '#52c41a' }}
              icon={<ThunderboltOutlined />}
              onClick={() => handleStatusChange(2)}
              disabled={mistake.status === 2}
            >
              已掌握
            </Button>
            <Button icon={<EditOutlined />} onClick={() => navigate(`/mistakes/edit/${mistake.id}`)}>
              编辑
            </Button>
            <Button danger onClick={handleDelete}>删除</Button>
          </Space>
        </Card>
      </div>
    </MainLayout>
  );
};

export default MistakeDetail;
