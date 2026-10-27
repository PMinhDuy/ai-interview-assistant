'use client';

import { Card, Row, Col, Statistic } from 'antd';
import {
  PlayCircleOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  TrophyOutlined,
} from '@ant-design/icons';
import type { InterviewSession } from '@/features/interviews';

export interface DashboardMetricsProps {
  sessions: InterviewSession[];
}

export function DashboardMetrics({ sessions }: DashboardMetricsProps) {
  const completedSessions = sessions.filter((s) => s.status === 'COMPLETED');
  const activeSessions = sessions.filter((s) => s.status === 'ACTIVE' || s.status === 'PENDING');
  const completionRate = sessions.length ? Math.round((completedSessions.length / sessions.length) * 100) : 0;

  return (
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
            value={completionRate}
            suffix="%"
            prefix={<PlayCircleOutlined style={{ color: '#722ed1' }} />}
          />
        </Card>
      </Col>
    </Row>
  );
}
