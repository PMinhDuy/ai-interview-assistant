'use client';

import Link from 'next/link';
import { Card, Row, Col, Typography, Button, Statistic, Empty, Space } from 'antd';
import { PlayCircleOutlined, CheckCircleOutlined, ClockCircleOutlined, TrophyOutlined } from '@ant-design/icons';
import { useAuthStore } from '../../../store/useAuthStore';

const { Title, Text } = Typography;

export default function DashboardPage() {
  const { user } = useAuthStore();

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <Title level={2} style={{ margin: 0 }}>
            Welcome back, {user?.firstName || user?.email?.split('@')[0]}! 👋
          </Title>
          <Text type="secondary">Ready to practice and improve your interview skills today?</Text>
        </div>
        <Link href="/interviews/new">
          <Button type="primary" size="large" icon={<PlayCircleOutlined />}>
            Start New Interview
          </Button>
        </Link>
      </div>

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} lg={6}>
          <Card bordered={false}>
            <Statistic
              title="Total Sessions"
              value={0}
              prefix={<ClockCircleOutlined style={{ color: '#1677ff' }} />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card bordered={false}>
            <Statistic
              title="Completed"
              value={0}
              prefix={<CheckCircleOutlined style={{ color: '#52c41a' }} />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card bordered={false}>
            <Statistic
              title="Average Score"
              value={0}
              suffix="/ 100"
              prefix={<TrophyOutlined style={{ color: '#faad14' }} />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card bordered={false}>
            <Statistic
              title="Questions Practiced"
              value={0}
              prefix={<PlayCircleOutlined style={{ color: '#722ed1' }} />}
            />
          </Card>
        </Col>
      </Row>

      <Card title="Recent Interview Sessions" bordered={false}>
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description="You haven't completed any interview sessions yet."
        >
          <Space>
            <Link href="/interviews/new">
              <Button type="primary">Create Your First Session</Button>
            </Link>
          </Space>
        </Empty>
      </Card>
    </div>
  );
}
