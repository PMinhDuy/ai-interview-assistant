'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Card,
  Table,
  Button,
  Tag,
  Space,
  Modal,
  Form,
  Input,
  Typography,
  Alert,
  message,
  Drawer,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  PlaySquareOutlined,
  LockOutlined,
  CheckCircleOutlined,
} from '@ant-design/icons';
import { useAuthStore } from '../../../../store/useAuthStore';
import { promptsService, type PromptTemplateItem } from '../../../../services/prompts.service';

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;

export default function AdminPromptsPage() {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingPrompt, setEditingPrompt] = useState<PromptTemplateItem | null>(null);
  const [compilePrompt, setCompilePrompt] = useState<PromptTemplateItem | null>(null);
  const [compileVarsJson, setCompileVarsJson] = useState('{\n  "role": "Frontend Engineer",\n  "difficulty": "MEDIUM"\n}');
  const [compiledResult, setCompiledResult] = useState<string | null>(null);

  const [form] = Form.useForm();

  // Query prompts
  const { data: prompts = [], isLoading } = useQuery({
    queryKey: ['prompts'],
    queryFn: promptsService.getLatestPrompts,
    enabled: user?.role === 'ADMIN',
  });

  // Mutations
  const createPromptMutation = useMutation({
    mutationFn: promptsService.createPrompt,
    onSuccess: () => {
      message.success('Prompt template created!');
      setIsCreateModalOpen(false);
      form.resetFields();
      queryClient.invalidateQueries({ queryKey: ['prompts'] });
    },
    onError: () => message.error('Failed to create prompt template'),
  });

  const updatePromptMutation = useMutation({
    mutationFn: ({ name, template, description }: { name: string; template: string; description?: string }) =>
      promptsService.updatePrompt(name, { template, description }),
    onSuccess: () => {
      message.success('Prompt template version updated!');
      setEditingPrompt(null);
      form.resetFields();
      queryClient.invalidateQueries({ queryKey: ['prompts'] });
    },
    onError: () => message.error('Failed to update prompt template'),
  });

  const compileMutation = useMutation({
    mutationFn: async () => {
      if (!compilePrompt) return;
      const vars = JSON.parse(compileVarsJson);
      return promptsService.compilePrompt(compilePrompt.name, vars, compilePrompt.version);
    },
    onSuccess: (data) => {
      if (data) setCompiledResult(data.compiledText);
    },
    onError: () => {
      message.error('Compilation failed. Check JSON variable format.');
    },
  });

  // Guard: Only ADMIN role
  if (user?.role !== 'ADMIN') {
    return (
      <Card bordered={false}>
        <Alert
          type="error"
          showIcon
          icon={<LockOutlined />}
          message="403 — Unauthorized Access"
          description="Prompt Template Management is strictly restricted to System Administrator accounts."
        />
      </Card>
    );
  }

  const columns = [
    {
      title: 'Prompt Name',
      dataIndex: 'name',
      key: 'name',
      render: (name: string) => <Text strong>{name}</Text>,
    },
    {
      title: 'Active Version',
      dataIndex: 'version',
      key: 'version',
      render: (version: number, record: PromptTemplateItem) => (
        <Space>
          <Tag color="blue">v{version}</Tag>
          {record.isActive && <Tag color="green" icon={<CheckCircleOutlined />}>Active</Tag>}
        </Space>
      ),
    },
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
      render: (desc: string) => desc || '—',
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: unknown, record: PromptTemplateItem) => (
        <Space>
          <Button
            type="text"
            icon={<EditOutlined />}
            onClick={() => {
              setEditingPrompt(record);
              form.setFieldsValue({
                name: record.name,
                template: record.template,
                description: record.description,
              });
            }}
          >
            New Version
          </Button>

          <Button
            type="text"
            icon={<PlaySquareOutlined />}
            onClick={() => {
              setCompilePrompt(record);
              setCompiledResult(null);
            }}
          >
            Compile Test
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <Title level={2} style={{ margin: 0 }}>
            Prompt Template Management (Admin)
          </Title>
          <Text type="secondary">Manage System Prompts, versioning, and variable placeholders</Text>
        </div>

        <Button
          type="primary"
          icon={<PlusOutlined />}
          size="large"
          onClick={() => {
            setEditingPrompt(null);
            form.resetFields();
            setIsCreateModalOpen(true);
          }}
        >
          Create New Template
        </Button>
      </div>

      <Card bordered={false}>
        <Table dataSource={prompts} columns={columns} rowKey="id" loading={isLoading} pagination={{ pageSize: 10 }} />
      </Card>

      {/* Create / Edit Version Modal */}
      <Modal
        title={editingPrompt ? `Create New Version for: ${editingPrompt.name}` : 'Create New Prompt Template'}
        open={isCreateModalOpen || !!editingPrompt}
        onCancel={() => {
          setIsCreateModalOpen(false);
          setEditingPrompt(null);
        }}
        onOk={() => form.submit()}
        confirmLoading={createPromptMutation.isPending || updatePromptMutation.isPending}
        width={680}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={(values) => {
            if (editingPrompt) {
              updatePromptMutation.mutate({
                name: editingPrompt.name,
                template: values.template,
                description: values.description,
              });
            } else {
              createPromptMutation.mutate(values);
            }
          }}
        >
          {!editingPrompt && (
            <Form.Item name="name" label="Template Name" rules={[{ required: true, message: 'Please enter template name' }]}>
              <Input placeholder="e.g. SYSTEM_INTERVIEW_EVALUATION" />
            </Form.Item>
          )}

          <Form.Item name="description" label="Description">
            <Input placeholder="Short description of this prompt version" />
          </Form.Item>

          <Form.Item
            name="template"
            label="Prompt Template Text"
            rules={[{ required: true, message: 'Please enter prompt template text' }]}
            help="Use {{variableName}} syntax for variable placeholders."
          >
            <TextArea rows={8} style={{ fontFamily: 'monospace' }} placeholder="You are an expert interviewer..." />
          </Form.Item>
        </Form>
      </Modal>

      {/* Compile Test Drawer */}
      <Drawer
        title={`Compile Test: ${compilePrompt?.name}`}
        placement="right"
        width={600}
        onClose={() => setCompilePrompt(null)}
        open={!!compilePrompt}
      >
        {compilePrompt && (
          <div>
            <Paragraph strong>Template Text (v{compilePrompt.version}):</Paragraph>
            <Paragraph style={{ background: '#f5f7fa', padding: 12, borderRadius: 8, fontFamily: 'monospace', fontSize: 12 }}>
              {compilePrompt.template}
            </Paragraph>

            <Paragraph strong style={{ marginTop: 16 }}>
              JSON Variables Input:
            </Paragraph>
            <TextArea
              rows={5}
              value={compileVarsJson}
              onChange={(e) => setCompileVarsJson(e.target.value)}
              style={{ fontFamily: 'monospace', marginBottom: 16 }}
            />

            <Button
              type="primary"
              icon={<PlaySquareOutlined />}
              loading={compileMutation.isPending}
              onClick={() => compileMutation.mutate()}
            >
              Compile Prompt
            </Button>

            {compiledResult && (
              <div style={{ marginTop: 24 }}>
                <Paragraph strong style={{ color: '#1677ff' }}>
                  Compiled Result String:
                </Paragraph>
                <Paragraph style={{ background: '#e6f4ff', padding: 12, borderRadius: 8, fontFamily: 'monospace', fontSize: 12 }}>
                  {compiledResult}
                </Paragraph>
              </div>
            )}
          </div>
        )}
      </Drawer>
    </div>
  );
}
