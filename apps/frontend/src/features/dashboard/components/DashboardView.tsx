'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { Typography, Button } from 'antd';
import { PlayCircleOutlined } from '@ant-design/icons';
import { useAuthStore } from '@/store/useAuthStore';
import { getSessionsQueryOptions } from '@/features/interviews';
import { DashboardMetrics } from './DashboardMetrics';
import { RecentSessionsTable } from './RecentSessionsTable';

const { Title, Text } = Typography;

export function DashboardView() {
  const { user } = useAuthStore();

  const { data: sessions = [], isLoading } = useQuery(getSessionsQueryOptions());

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

      <DashboardMetrics sessions={sessions} />
      <RecentSessionsTable sessions={sessions} isLoading={isLoading} />
    </div>
  );
}
