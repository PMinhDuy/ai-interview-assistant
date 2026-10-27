'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
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
import { useAuthStore } from '@/store/useAuthStore';
import {
  getLatestPromptsQueryOptions,
  useCreatePromptMutation,
  useUpdatePromptMutation,
  useActivateVersionMutation,
  compilePrompt,
  type PromptTemplateItem,
} from '../api';
import { extractApiErrorMessage } from '@/lib/error';

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;

export function PromptsAdminView() {
  const { user } = useAuthStore();

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingPrompt, setEditingPrompt] = useState<PromptTemplateItem | null>(null);
  const [compilePromptItem, setCompilePromptItem] = useState<PromptTemplateItem | null>(null);
  const [compileVarsJson, setCompileVarsJson] = useState('{\n  "role": "Frontend Engineer",\n  "difficulty": "MEDIUM"\n}');
  const [compiledResult, setCompiledResult] = useState<string | null>(null);

  const [form] = Form.useForm();

  // Query prompts
  const { data: prompts = [], isLoading } = useQuery(
    getLatestPromptsQueryOptions(user?.role === 'ADMIN'),
  );

  // Mutations
  const createMutation = useCreatePromptMutation(() => {
    message.success('Prompt created successfully');
    setIsCreateModalOpen(false);
    form.resetFields();
  });

  const updateMutation = useUpdatePromptMutation(editingPrompt?.name || '', () => {
    message.success('New prompt version published successfully');
    setEditingPrompt(null);
    form.resetFields();
  });

  const activateMutation = useActivateVersionMutation(() => {
    message.success('Version activated successfully');
  });

  if (user?.role !== 'ADMIN') {
    return (
      <div style={{ textAlign: 'center', marginTop: 80 }}>
        <LockOutlined style={{ fontSize: 48, color: '#ff4d4f', marginBottom: 16 }} />
        <Title level={3}>Access Denied</Title>
        <Paragraph type="secondary">
          You must have the ADMIN role to view and manage AI prompt templates.
        </Paragraph>
      </div>
    );
  }

  const handleOpenEdit = (record: PromptTemplateItem) => {
    setEditingPrompt(record);
    form.setFieldsValue({
      name: record.name,
      description: record.description,
      template: record.template,
      variables: record.variables.join(', '),
    });
  };

  const handleFormSubmit = async (values: {
    name: string;
    description?: string;
    template: string;
    variables?: string;
  }) => {
    const varsArray = values.variables
      ? values.variables.split(',').map((v) => v.trim()).filter(Boolean)
      : [];

    try {
      if (editingPrompt) {
        await updateMutation.mutateAsync({
          description: values.description,
          template: values.template,
          variables: varsArray,
        });
      } else {
        await createMutation.mutateAsync({
          name: values.name,
          description: values.description,
          template: values.template,
          variables: varsArray,
        });
      }
    } catch (err: unknown) {
      message.error(extractApiErrorMessage(err, 'Failed to save prompt template'));
    }
  };

  const handleTestCompile = async () => {
    if (!compilePromptItem) return;
    try {
      const parsedVars = JSON.parse(compileVarsJson);
      const res = await compilePrompt({
        name: compilePromptItem.name,
        variables: parsedVars,
      });
      setCompiledResult(res.compiledText);
    } catch (err: unknown) {
      if (err instanceof SyntaxError) {
        message.error('Invalid JSON variables format');
      } else {
        message.error(extractApiErrorMessage(err, 'Failed to compile template'));
      }
    }
  };

  const columns = [
    {
      title: 'Prompt Name',
      dataIndex: 'name',
      key: 'name',
      render: (name: string, record: PromptTemplateItem) => (
        <Space>
          <Text strong style={{ color: '#1677ff' }}>{name}</Text>
          <Tag color="cyan">v{record.version}</Tag>
          {record.isActive && <Tag color="success">Active</Tag>}
        </Space>
      ),
    },
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
      render: (desc: string) => desc || <Text type="secondary">—</Text>,
    },
    {
      title: 'Variables',
      dataIndex: 'variables',
      key: 'variables',
      render: (vars: string[]) => (
        <Space size={4} wrap>
          {vars && vars.length > 0 ? (
            vars.map((v) => <Tag key={v} color="blue">{`{{${v}}}`}</Tag>)
          ) : (
            <Text type="secondary">—</Text>
          )}
        </Space>
      ),
    },
    {
      title: 'Created At',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (d: string) => new Date(d).toLocaleDateString(),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: unknown, record: PromptTemplateItem) => (
        <Space>
          <Button
            type="text"
            icon={<PlaySquareOutlined style={{ color: '#52c41a' }} />}
            onClick={() => {
              setCompilePromptItem(record);
              setCompiledResult(null);
            }}
          >
            Test
          </Button>
          <Button type="text" icon={<EditOutlined />} onClick={() => handleOpenEdit(record)}>
            New Version
          </Button>
          {!record.isActive && (
            <Button
              type="text"
              icon={<CheckCircleOutlined />}
              onClick={() => activateMutation.mutate({ name: record.name, version: record.version })}
            >
              Activate
            </Button>
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
            AI Prompt Templates Manager
          </Title>
          <Text type="secondary">Admin portal for viewing, versioning, and testing dynamic prompt templates</Text>
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
          Create Prompt
        </Button>
      </div>

      <Card bordered={false}>
        <Table dataSource={prompts} columns={columns} rowKey="id" loading={isLoading} pagination={{ pageSize: 10 }} />
      </Card>

      {/* Create / Edit Modal */}
      <Modal
        title={editingPrompt ? `Publish New Version: ${editingPrompt.name}` : 'Create New Prompt Template'}
        open={isCreateModalOpen || Boolean(editingPrompt)}
        onCancel={() => {
          setIsCreateModalOpen(false);
          setEditingPrompt(null);
        }}
        footer={null}
        width={720}
        destroyOnClose
      >
        <Form form={form} layout="vertical" onFinish={handleFormSubmit} style={{ marginTop: 16 }}>
          <Form.Item
            name="name"
            label="Template Name (Identifier)"
            rules={[{ required: true, message: 'Please input a unique prompt name' }]}
          >
            <Input placeholder="e.g. interview_question_generator" disabled={Boolean(editingPrompt)} />
          </Form.Item>

          <Form.Item name="description" label="Description">
            <Input placeholder="Brief description of the prompt role and usage context" />
          </Form.Item>

          <Form.Item
            name="variables"
            label="Variables (comma separated)"
            help="Placeholder tags used in the template, e.g.: role, difficulty, techStack"
          >
            <Input placeholder="role, difficulty, techStack" />
          </Form.Item>

          <Form.Item
            name="template"
            label="Prompt Template Content"
            rules={[{ required: true, message: 'Prompt template body cannot be empty' }]}
          >
            <TextArea
              rows={10}
              placeholder="You are an expert technical interviewer... Use {{role}} and {{difficulty}} to interpolate variables."
              style={{ fontFamily: 'monospace' }}
            />
          </Form.Item>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
            <Button
              onClick={() => {
                setIsCreateModalOpen(false);
                setEditingPrompt(null);
              }}
            >
              Cancel
            </Button>
            <Button
              type="primary"
              htmlType="submit"
              loading={createMutation.isPending || updateMutation.isPending}
            >
              {editingPrompt ? 'Publish Version' : 'Create Template'}
            </Button>
          </div>
        </Form>
      </Modal>

      {/* Test / Compile Drawer */}
      <Drawer
        title={`Test Template: ${compilePromptItem?.name}`}
        placement="right"
        width={680}
        onClose={() => setCompilePromptItem(null)}
        open={Boolean(compilePromptItem)}
      >
        {compilePromptItem && (
          <div>
            <Alert
              type="info"
              message="Interpolate Variables"
              description="Provide a JSON object containing key-value pairs matching this template's declared variables."
              style={{ marginBottom: 16 }}
            />

            <Title level={5}>Variables (JSON):</Title>
            <TextArea
              rows={5}
              value={compileVarsJson}
              onChange={(e) => setCompileVarsJson(e.target.value)}
              style={{ fontFamily: 'monospace', marginBottom: 16 }}
            />

            <Button type="primary" icon={<PlaySquareOutlined />} onClick={handleTestCompile} style={{ marginBottom: 24 }}>
              Compile Template
            </Button>

            {compiledResult && (
              <div>
                <Title level={5}>Compiled Prompt Output:</Title>
                <Paragraph
                  style={{
                    background: '#f5f7fa',
                    padding: 16,
                    borderRadius: 8,
                    whiteSpace: 'pre-wrap',
                    fontFamily: 'monospace',
                    border: '1px solid #d9d9d9',
                  }}
                >
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
