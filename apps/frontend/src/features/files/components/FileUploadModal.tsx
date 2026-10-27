'use client';

import { Modal, Upload } from 'antd';
import { InboxOutlined } from '@ant-design/icons';
import type { FileCategory } from '../api';

const { Dragger } = Upload;

export interface FileUploadModalProps {
  open: boolean;
  category: FileCategory;
  onCancel: () => void;
  onUpload: (file: File) => void;
}

export function FileUploadModal({
  open,
  category,
  onCancel,
  onUpload,
}: FileUploadModalProps) {
  const isResume = category === 'RESUME';

  return (
    <Modal
      title={`Upload ${isResume ? 'Resume (PDF/TXT/DOCX)' : 'Job Description'}`}
      open={open}
      onCancel={onCancel}
      footer={null}
      destroyOnClose
    >
      <div style={{ padding: '16px 0' }}>
        <Dragger
          name="file"
          multiple={false}
          beforeUpload={(file) => {
            onUpload(file);
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
  );
}
