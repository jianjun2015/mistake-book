import React, { useEffect, useState } from 'react';
import { Card, Row, Col, Progress, Empty } from 'antd';
import { BookOutlined, FireOutlined, CheckCircleOutlined, ClockCircleOutlined } from '@ant-design/icons';
import MainLayout from '../components/layout/MainLayout';
import { getMistakeList } from '../api/mistake';
import type { Mistake } from '../types';
import type { PageResponse } from '../types';

const DashboardPage: React.FC = () => {
  const [stats, setStats] = useState({
    total: 0,
    unmastered: 0,
    mastered: 0,
    halfMastered: 0,
  });
  const [recentMistakes, setRecentMistakes] = useState<Mistake[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await getMistakeList(1, 5);
        const data = res.data as PageResponse<Mistake>;
        setRecentMistakes(data.content);

        // Count by status
        const all = data.content;
        setStats({
          total: data.totalElements,
          unmastered: all.filter((m) => m.status === 0).length,
          mastered: all.filter((m) => m.status === 2).length,
          halfMastered: all.filter((m) => m.status === 1).length,
        });
      } catch (error) {
        console.error('获取数据失败', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const masteryRate = stats.total > 0 ? Math.round((stats.mastered / stats.total) * 100) : 0;

  return (
    <MainLayout>
      <div style={{ padding: 24 }}>
        <h2 style={{ marginBottom: 24 }}>📊 学习概览</h2>

        {loading ? (
          <Empty description="加载中..." />
        ) : (
          <>
            {/* Stats Cards */}
            <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
              <Col xs={24} sm={12} lg={6}>
                <Card bordered={false}>
                  <div style={{ textAlign: 'center' }}>
                    <BookOutlined style={{ fontSize: 32, color: '#1890ff' }} />
                    <div style={{ fontSize: 32, fontWeight: 'bold', color: '#1890ff' }}>
                      {stats.total}
                    </div>
                    <div style={{ color: '#999' }}>错题总数</div>
                  </div>
                </Card>
              </Col>
              <Col xs={24} sm={12} lg={6}>
                <Card bordered={false}>
                  <div style={{ textAlign: 'center' }}>
                    <FireOutlined style={{ fontSize: 32, color: '#ff4d4f' }} />
                    <div style={{ fontSize: 32, fontWeight: 'bold', color: '#ff4d4f' }}>
                      {stats.unmastered}
                    </div>
                    <div style={{ color: '#999' }}>未掌握</div>
                  </div>
                </Card>
              </Col>
              <Col xs={24} sm={12} lg={6}>
                <Card bordered={false}>
                  <div style={{ textAlign: 'center' }}>
                    <ClockCircleOutlined style={{ fontSize: 32, color: '#faad14' }} />
                    <div style={{ fontSize: 32, fontWeight: 'bold', color: '#faad14' }}>
                      {stats.halfMastered}
                    </div>
                    <div style={{ color: '#999' }}>半掌握</div>
                  </div>
                </Card>
              </Col>
              <Col xs={24} sm={12} lg={6}>
                <Card bordered={false}>
                  <div style={{ textAlign: 'center' }}>
                    <CheckCircleOutlined style={{ fontSize: 32, color: '#52c41a' }} />
                    <div style={{ fontSize: 32, fontWeight: 'bold', color: '#52c41a' }}>
                      {stats.mastered}
                    </div>
                    <div style={{ color: '#999' }}>已掌握</div>
                  </div>
                </Card>
              </Col>
            </Row>

            {/* Mastery Progress */}
            <Card title="掌握进度" bordered={false} style={{ marginBottom: 24 }}>
              <div style={{ textAlign: 'center', padding: '20px 0' }}>
                <Progress
                  type="circle"
                  percent={masteryRate}
                  strokeColor={{
                    '0%': '#ff4d4f',
                    '50%': '#faad14',
                    '100%': '#52c41a',
                  }}
                />
                <div style={{ marginTop: 16, color: '#999' }}>
                  已掌握 {stats.mastered} / 共 {stats.total} 题
                </div>
              </div>
            </Card>

            {/* Recent Mistakes */}
            <Card title="最近添加" bordered={false}>
              {recentMistakes.length === 0 ? (
                <Empty description="还没有错题记录，快去添加第一道错题吧！" />
              ) : (
                recentMistakes.map((m) => (
                  <div key={m.id} style={{ padding: '8px 0', borderBottom: '1px solid #f0f0f0' }}>
                    <div style={{ fontWeight: 500 }}>{m.title || '（无标题）'}</div>
                    <div style={{ color: '#999', fontSize: 12 }}>
                      {new Date(m.createTime).toLocaleDateString('zh-CN')}
                    </div>
                  </div>
                ))
              )}
            </Card>
          </>
        )}
      </div>
    </MainLayout>
  );
};

export default DashboardPage;
