'use client';

import { Table, Space, Tag, Button, Popconfirm, Typography } from 'antd';
import { EyeOutlined, DeleteOutlined } from '@ant-design/icons';
import type { JobDescriptionItem } from '../api';

const { Text } = Typography;

export interface JobDescriptionTableProps {
  jds: JobDescriptionItem[];
  isLoading: boolean;
  onPreview: (title: string, text: string) => void;
  onDelete: (id: string) => void;
}

export function JobDescriptionTable({
  jds,
  isLoading,
  onPreview,
  onDelete,
}: JobDescriptionTableProps) {
  const columns = [
    {
      title: 'Filename / Title',
      dataIndex: 'originalName',
      key: 'originalName',
      render: (text: string) => (
        <Space>
          <Tag color="blue">JD</Tag>
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
      render: (_: unknown, record: JobDescriptionItem) => (
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
            title="Delete Job Description"
            description="Are you sure you want to delete this job description?"
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
      dataSource={jds}
      columns={columns}
      rowKey="id"
      loading={isLoading}
      pagination={{ pageSize: 5 }}
    />
  );
}
