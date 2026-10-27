'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, Tabs, Button, Drawer, Typography, message } from 'antd';
import { UploadOutlined } from '@ant-design/icons';
import {
  getResumesQueryOptions,
  getJobDescriptionsQueryOptions,
  useUploadFileMutation,
  useDeleteResumeMutation,
  useDeleteJobDescriptionMutation,
  type FileCategory,
} from '../api';
import { extractApiErrorMessage } from '@/lib/error';
import { ResumeTable } from './ResumeTable';
import { JobDescriptionTable } from './JobDescriptionTable';
import { FileUploadModal } from './FileUploadModal';

const { Title, Text, Paragraph } = Typography;

export function FilesView() {
  const [activeTab, setActiveTab] = useState<'resumes' | 'jds'>('resumes');
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [previewText, setPreviewText] = useState<{ title: string; text: string } | null>(null);

  // Queries
  const { data: resumes = [], isLoading: isLoadingResumes } = useQuery(getResumesQueryOptions());
  const { data: jds = [], isLoading: isLoadingJds } = useQuery(getJobDescriptionsQueryOptions());

  // Mutations
  const uploadMutation = useUploadFileMutation(() => {
    message.success('File uploaded and processed successfully!');
    setIsUploadModalOpen(false);
  });

  const deleteResumeMutation = useDeleteResumeMutation(() => {
    message.success('Resume deleted successfully');
  });

  const deleteJdMutation = useDeleteJobDescriptionMutation(() => {
    message.success('Job Description deleted successfully');
  });

  const handleUpload = async (file: File) => {
    const category: FileCategory = activeTab === 'resumes' ? 'RESUME' : 'JOB_DESCRIPTION';
    try {
      await uploadMutation.mutateAsync({ file, type: category });
    } catch (error: unknown) {
      message.error(extractApiErrorMessage(error, 'Failed to upload file'));
    }
  };

  const handleDeleteResume = async (id: string) => {
    try {
      await deleteResumeMutation.mutateAsync(id);
    } catch (error: unknown) {
      message.error(extractApiErrorMessage(error, 'Failed to delete resume'));
    }
  };

  const handleDeleteJd = async (id: string) => {
    try {
      await deleteJdMutation.mutateAsync(id);
    } catch (error: unknown) {
      message.error(extractApiErrorMessage(error, 'Failed to delete job description'));
    }
  };

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
                <ResumeTable
                  resumes={resumes}
                  isLoading={isLoadingResumes}
                  onPreview={(title, text) => setPreviewText({ title, text })}
                  onDelete={handleDeleteResume}
                />
              ),
            },
            {
              key: 'jds',
              label: `Job Descriptions (${jds.length})`,
              children: (
                <JobDescriptionTable
                  jds={jds}
                  isLoading={isLoadingJds}
                  onPreview={(title, text) => setPreviewText({ title, text })}
                  onDelete={handleDeleteJd}
                />
              ),
            },
          ]}
        />
      </Card>

      <FileUploadModal
        open={isUploadModalOpen}
        category={activeTab === 'resumes' ? 'RESUME' : 'JOB_DESCRIPTION'}
        onCancel={() => setIsUploadModalOpen(false)}
        onUpload={handleUpload}
      />

      <Drawer
        title={`Extracted Content: ${previewText?.title}`}
        placement="right"
        width={600}
        onClose={() => setPreviewText(null)}
        open={Boolean(previewText)}
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
