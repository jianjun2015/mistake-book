import React from 'react';
import { Card, Statistic, Row, Col } from 'antd';
import {
  BookOutlined,
  FireOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
} from '@ant-design/icons';

interface DashboardStats {
  totalMistakes: number;
  unmasteredCount: number;
  masteredCount: number;
  dueForReviewCount: number;
}

interface DashboardProps {
  stats: DashboardStats;
}

const Dashboard: React.FC<DashboardProps> = ({ stats }) => {
  return (
    <Row gutter={[16, 16]}>
      <Col xs={24} sm={12} lg={6}>
        <Card bordered={false}>
          <Statistic
            title="错题总数"
            value={stats.totalMistakes}
            prefix={<BookOutlined />}
            valueStyle={{ color: '#1890ff' }}
          />
        </Card>
      </Col>
      <Col xs={24} sm={12} lg={6}>
        <Card bordered={false}>
          <Statistic
            title="未掌握"
            value={stats.unmasteredCount}
            prefix={<FireOutlined />}
            valueStyle={{ color: '#ff4d4f' }}
          />
        </Card>
      </Col>
      <Col xs={24} sm={12} lg={6}>
        <Card bordered={false}>
          <Statistic
            title="已掌握"
            value={stats.masteredCount}
            prefix={<CheckCircleOutlined />}
            valueStyle={{ color: '#52c41a' }}
          />
        </Card>
      </Col>
      <Col xs={24} sm={12} lg={6}>
        <Card bordered={false}>
          <Statistic
            title="待复习"
            value={stats.dueForReviewCount}
            prefix={<ClockCircleOutlined />}
            valueStyle={{ color: '#faad14' }}
          />
        </Card>
      </Col>
    </Row>
  );
};

export default Dashboard;
