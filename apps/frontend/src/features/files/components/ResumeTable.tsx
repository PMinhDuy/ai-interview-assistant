'use client';

import { Table, Space, Button, Popconfirm, Typography } from 'antd';
import { FilePdfOutlined, EyeOutlined, DeleteOutlined } from '@ant-design/icons';
import type { ResumeItem } from '../api';

const { Text } = Typography;

export interface ResumeTableProps {
  resumes: ResumeItem[];
  isLoading: boolean;
  onPreview: (title: string, text: string) => void;
  onDelete: (id: string) => void;
}

export function ResumeTable({
  resumes,
  isLoading,
  onPreview,
  onDelete,
}: ResumeTableProps) {
  const columns = [
    {
      title: 'Filename',
      dataIndex: 'originalName',
      key: 'originalName',
      render: (text: string) => (
        <Space>
          <FilePdfOutlined style={{ color: '#ff4d4f', fontSize: 18 }} />
          <Text strong>{text}</Text>
        </Space>
      ),
    },
    {
      title: 'Size',
      dataIndex: 'fileSize',
      key: 'fileSize',
      render: (size: number) => (size ? `${(size / 1024).toFixed(1)} KB` : 'N/A'),
    },
    {
      title: 'Uploaded At',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date: string) => new Date(date).toLocaleDateString(),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: unknown, record: ResumeItem) => (
        <Space>
          {record.extractedText && (
            <Button
              type="text"
              icon={<EyeOutlined />}
              onClick={() => onPreview(record.originalName, record.extractedText || '')}
            >
              Preview Text
            </Button>
          )}
          <Popconfirm
            title="Delete Resume"
            description="Are you sure you want to delete this resume?"
            onConfirm={() => onDelete(record.id)}
            okText="Yes"
            cancelText="No"
          >
            <Button type="text" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <Table
      dataSource={resumes}
      columns={columns}
      rowKey="id"
      loading={isLoading}
      pagination={{ pageSize: 5 }}
    />
  );
}
