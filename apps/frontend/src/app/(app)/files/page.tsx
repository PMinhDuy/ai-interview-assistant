'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Card,
  Tabs,
  Table,
  Button,
  Upload,
  message,
  Popconfirm,
  Drawer,
  Typography,
  Space,
  Tag,
  Modal,
} from 'antd';
import {
  UploadOutlined,
  DeleteOutlined,
  FilePdfOutlined,
  EyeOutlined,
  InboxOutlined,
} from '@ant-design/icons';
import { filesService, type ResumeItem, type JobDescriptionItem } from '../../../services/files.service';

const { Title, Text, Paragraph } = Typography;
const { Dragger } = Upload;

export default function FilesPage() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'resumes' | 'jds'>('resumes');
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [previewText, setPreviewText] = useState<{ title: string; text: string } | null>(null);

  // Queries
  const { data: resumes = [], isLoading: isLoadingResumes } = useQuery({
    queryKey: ['resumes'],
    queryFn: filesService.getResumes,
  });

  const { data: jds = [], isLoading: isLoadingJds } = useQuery({
    queryKey: ['job-descriptions'],
    queryFn: filesService.getJobDescriptions,
  });

  // Mutations
  const deleteResumeMutation = useMutation({
    mutationFn: filesService.deleteResume,
    onSuccess: () => {
      message.success('Resume deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['resumes'] });
    },
    onError: () => message.error('Failed to delete resume'),
  });

  const deleteJdMutation = useMutation({
    mutationFn: filesService.deleteJobDescription,
    onSuccess: () => {
      message.success('Job Description deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['job-descriptions'] });
    },
    onError: () => message.error('Failed to delete Job Description'),
  });

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const type = activeTab === 'resumes' ? 'RESUME' : 'JOB_DESCRIPTION';
      return filesService.uploadFile(file, type);
    },
    onSuccess: () => {
      message.success(`File uploaded and processed successfully!`);
      setIsUploadModalOpen(false);
      queryClient.invalidateQueries({ queryKey: [activeTab === 'resumes' ? 'resumes' : 'job-descriptions'] });
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { message?: string } } }).response?.data?.message || 'Failed to upload file';
      message.error(msg);
    },
  });

  const resumeColumns = [
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
              onClick={() => setPreviewText({ title: record.originalName, text: record.extractedText || '' })}
            >
              Preview Text
            </Button>
          )}
          <Popconfirm
            title="Delete Resume"
            description="Are you sure you want to delete this resume?"
            onConfirm={() => deleteResumeMutation.mutate(record.id)}
            okText="Yes"
            cancelText="No"
          >
            <Button type="text" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const jdColumns = [
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
              onClick={() => setPreviewText({ title: record.originalName, text: record.extractedText || '' })}
            >
              Preview Text
            </Button>
          )}
          <Popconfirm
            title="Delete Job Description"
            description="Are you sure you want to delete this job description?"
            onConfirm={() => deleteJdMutation.mutate(record.id)}
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
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <Title level={2} style={{ margin: 0 }}>
            Resumes & Job Descriptions
          </Title>
          <Text type="secondary">Upload and manage your documents to customize AI interview questions</Text>
        </div>
        <Button
          type="primary"
          icon={<UploadOutlined />}
          size="large"
          onClick={() => setIsUploadModalOpen(true)}
        >
          Upload {activeTab === 'resumes' ? 'Resume' : 'Job Description'}
        </Button>
      </div>

      <Card bordered={false}>
        <Tabs
          activeKey={activeTab}
          onChange={(key) => setActiveTab(key as 'resumes' | 'jds')}
          items={[
            {
              key: 'resumes',
              label: `Resumes (${resumes.length})`,
              children: (
                <Table
                  dataSource={resumes}
                  columns={resumeColumns}
                  rowKey="id"
                  loading={isLoadingResumes}
                  pagination={{ pageSize: 5 }}
                />
              ),
            },
            {
              key: 'jds',
              label: `Job Descriptions (${jds.length})`,
              children: (
                <Table
                  dataSource={jds}
                  columns={jdColumns}
                  rowKey="id"
                  loading={isLoadingJds}
                  pagination={{ pageSize: 5 }}
                />
              ),
            },
          ]}
        />
      </Card>

      {/* Upload Modal */}
      <Modal
        title={`Upload ${activeTab === 'resumes' ? 'Resume (PDF/TXT/DOCX)' : 'Job Description'}`}
        open={isUploadModalOpen}
        onCancel={() => setIsUploadModalOpen(false)}
        footer={null}
        destroyOnClose
      >
        <div style={{ padding: '16px 0' }}>
          <Dragger
            name="file"
            multiple={false}
            beforeUpload={(file) => {
              uploadMutation.mutate(file);
              return false;
            }}
            showUploadList={false}
          >
            <p className="ant-upload-drag-icon">
              <InboxOutlined style={{ color: '#1677ff', fontSize: 48 }} />
            </p>
            <p className="ant-upload-text">Click or drag file to this area to upload</p>
            <p className="ant-upload-hint">
              Supports PDF, DOCX, TXT files up to 10MB. Text will be extracted for AI RAG context.
            </p>
          </Dragger>
        </div>
      </Modal>

      {/* Extracted Text Preview Drawer */}
      <Drawer
        title={`Extracted Content: ${previewText?.title}`}
        placement="right"
        width={600}
        onClose={() => setPreviewText(null)}
        open={!!previewText}
      >
        {previewText && (
          <Paragraph style={{ whiteSpace: 'pre-wrap', fontFamily: 'monospace', fontSize: 13 }}>
            {previewText.text}
          </Paragraph>
        )}
      </Drawer>
    </div>
  );
}
