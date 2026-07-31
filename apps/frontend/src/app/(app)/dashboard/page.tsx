'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { Card, Row, Col, Typography, Button, Statistic, Empty, Tag, Table, Space } from 'antd';
import {
  PlayCircleOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  TrophyOutlined,
  RightOutlined,
  FileTextOutlined,
} from '@ant-design/icons';
import { useAuthStore } from '../../../store/useAuthStore';
import { interviewsService, type InterviewSession } from '../../../services/interviews.service';

const { Title, Text } = Typography;

export default function DashboardPage() {
  const { user } = useAuthStore();

  const { data: sessions = [], isLoading } = useQuery({
    queryKey: ['sessions'],
    queryFn: interviewsService.getSessions,
  });

  const completedSessions = sessions.filter((s) => s.status === 'COMPLETED');
  const activeSessions = sessions.filter((s) => s.status === 'ACTIVE' || s.status === 'PENDING');

  const sessionColumns = [
    {
      title: 'Interview Type',
      dataIndex: 'type',
      key: 'type',
      render: (type: string) => <Tag color="blue">{type}</Tag>,
    },
    {
      title: 'Difficulty',
      dataIndex: 'difficulty',
      key: 'difficulty',
      render: (diff: string) => (
        <Tag color={diff === 'HARD' ? 'red' : diff === 'MEDIUM' ? 'orange' : 'green'}>{diff}</Tag>
      ),
    },
    {
      title: 'Progress',
      key: 'progress',
      render: (_: unknown, record: InterviewSession) => (
        <Text>
          {record.currentQuestionIndex} / {record.totalQuestions} questions
        </Text>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={status === 'COMPLETED' ? 'success' : status === 'ACTIVE' ? 'processing' : 'default'}>
          {status}
        </Tag>
      ),
    },
    {
      title: 'Created At',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date: string) => new Date(date).toLocaleDateString(),
    },
    {
      title: 'Action',
      key: 'action',
      render: (_: unknown, record: InterviewSession) => (
        <Space>
          {record.status === 'COMPLETED' ? (
            <Link href={`/interviews/${record.id}/report`}>
              <Button type="default" size="small" icon={<FileTextOutlined />}>
                View Report
              </Button>
            </Link>
          ) : (
            <Link href={`/interviews/${record.id}`}>
              <Button type="primary" size="small" icon={<RightOutlined />}>
                Continue
              </Button>
            </Link>
          )}
        </Space>
      ),
    },
  ];

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
              value={sessions.length}
              prefix={<ClockCircleOutlined style={{ color: '#1677ff' }} />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card bordered={false}>
            <Statistic
              title="Completed Sessions"
              value={completedSessions.length}
              prefix={<CheckCircleOutlined style={{ color: '#52c41a' }} />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card bordered={false}>
            <Statistic
              title="Active Sessions"
              value={activeSessions.length}
              prefix={<TrophyOutlined style={{ color: '#faad14' }} />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card bordered={false}>
            <Statistic
              title="Completion Rate"
              value={sessions.length ? Math.round((completedSessions.length / sessions.length) * 100) : 0}
              suffix="%"
              prefix={<PlayCircleOutlined style={{ color: '#722ed1' }} />}
            />
          </Card>
        </Col>
      </Row>

      <Card title="Interview Sessions History" bordered={false}>
        {sessions.length === 0 && !isLoading ? (
          <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="You haven't created any interview sessions yet.">
            <Space>
              <Link href="/interviews/new">
                <Button type="primary">Create Your First Session</Button>
              </Link>
            </Space>
          </Empty>
        ) : (
          <Table
            dataSource={sessions}
            columns={sessionColumns}
            rowKey="id"
            loading={isLoading}
            pagination={{ pageSize: 5 }}
          />
        )}
      </Card>
    </div>
  );
}
