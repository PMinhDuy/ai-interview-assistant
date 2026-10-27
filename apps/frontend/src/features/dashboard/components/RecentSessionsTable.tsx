'use client';

import Link from 'next/link';
import { Card, Table, Tag, Typography, Button, Space, Empty } from 'antd';
import { RightOutlined, FileTextOutlined } from '@ant-design/icons';
import type { InterviewSession } from '@/features/interviews';

const { Text } = Typography;

export interface RecentSessionsTableProps {
  sessions: InterviewSession[];
  isLoading: boolean;
}

export function RecentSessionsTable({ sessions, isLoading }: RecentSessionsTableProps) {
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
  );
}
