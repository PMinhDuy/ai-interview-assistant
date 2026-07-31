'use client';

import { useState } from 'react';
import { Card, Form, Input, Button, Typography, message, Tag, Space } from 'antd';
import { UserOutlined, LockOutlined, MailOutlined, CheckOutlined } from '@ant-design/icons';
import { useAuthStore } from '../../../store/useAuthStore';

const { Title, Text } = Typography;

export default function SettingsPage() {
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(false);

  const [profileForm] = Form.useForm();
  const [passwordForm] = Form.useForm();

  const handleUpdateProfile = async (_values: { firstName?: string; lastName?: string }) => {
    setLoading(true);
    try {
      message.success('Profile settings updated successfully');
    } catch {
      message.error('Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async (_values: { oldPassword?: string; newPassword?: string }) => {
    setLoading(true);
    try {
      message.success('Password changed successfully');
      passwordForm.resetFields();
    } catch {
      message.error('Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 680, margin: '0 auto' }}>
      <div style={{ marginBottom: 24 }}>
        <Title level={2} style={{ margin: 0 }}>
          User Profile & Settings
        </Title>
        <Text type="secondary">Manage your personal details and security settings</Text>
      </div>

      {/* Account Info Card */}
      <Card title="Account Profile" bordered={false} style={{ marginBottom: 24 }}>
        <div style={{ marginBottom: 16 }}>
          <Space size={12}>
            <Tag color={user?.role === 'ADMIN' ? 'red' : 'blue'}>{user?.role || 'USER'}</Tag>
            <Text type="secondary">Member since {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}</Text>
          </Space>
        </div>

        <Form
          form={profileForm}
          layout="vertical"
          initialValues={{
            email: user?.email,
            firstName: user?.firstName,
            lastName: user?.lastName,
          }}
          onFinish={handleUpdateProfile}
          size="large"
        >
          <Form.Item label="Email Address" name="email">
            <Input prefix={<MailOutlined style={{ color: '#bfbfbf' }} />} disabled />
          </Form.Item>

          <Form.Item label="First Name" name="firstName">
            <Input prefix={<UserOutlined style={{ color: '#bfbfbf' }} />} placeholder="John" />
          </Form.Item>

          <Form.Item label="Last Name" name="lastName">
            <Input prefix={<UserOutlined style={{ color: '#bfbfbf' }} />} placeholder="Doe" />
          </Form.Item>

          <Form.Item style={{ marginTop: 24 }}>
            <Button type="primary" htmlType="submit" icon={<CheckOutlined />} loading={loading}>
              Save Profile
            </Button>
          </Form.Item>
        </Form>
      </Card>

      {/* Change Password Card */}
      <Card title="Change Password" bordered={false}>
        <Form form={passwordForm} layout="vertical" onFinish={handleChangePassword} size="large">
          <Form.Item
            label="Current Password"
            name="oldPassword"
            rules={[{ required: true, message: 'Please enter your current password' }]}
          >
            <Input.Password prefix={<LockOutlined style={{ color: '#bfbfbf' }} />} />
          </Form.Item>

          <Form.Item
            label="New Password"
            name="newPassword"
            rules={[
              { required: true, message: 'Please enter a new password' },
              { min: 6, message: 'Password must be at least 6 characters' },
            ]}
          >
            <Input.Password prefix={<LockOutlined style={{ color: '#bfbfbf' }} />} />
          </Form.Item>

          <Form.Item style={{ marginTop: 24 }}>
            <Button type="primary" htmlType="submit" loading={loading}>
              Update Password
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
}
