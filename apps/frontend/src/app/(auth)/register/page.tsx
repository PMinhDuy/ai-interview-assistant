'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Form, Input, Button, Alert, Typography, Row, Col } from 'antd';
import { MailOutlined, LockOutlined, UserOutlined } from '@ant-design/icons';
import { useAuthStore } from '../../../store/useAuthStore';

const { Text } = Typography;

export default function RegisterPage() {
  const router = useRouter();
  const register = useAuthStore((state) => state.register);

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const onFinish = async (values: { email: string; password?: string; firstName?: string; lastName?: string }) => {
    setLoading(true);
    setErrorMessage(null);
    try {
      await register({
        email: values.email,
        password: values.password,
        firstName: values.firstName,
        lastName: values.lastName,
      });
      router.push('/dashboard');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } }).response?.data?.message || 'Registration failed. Email may already be in use.';
      setErrorMessage(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      {errorMessage && (
        <Alert
          message={errorMessage}
          type="error"
          showIcon
          style={{ marginBottom: 20 }}
          closable
          onClose={() => setErrorMessage(null)}
        />
      )}

      <Form name="register_form" layout="vertical" onFinish={onFinish} requiredMark={false} size="large">
        <Row gutter={12}>
          <Col span={12}>
            <Form.Item name="firstName" label="First Name">
              <Input prefix={<UserOutlined style={{ color: '#bfbfbf' }} />} placeholder="John" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="lastName" label="Last Name">
              <Input prefix={<UserOutlined style={{ color: '#bfbfbf' }} />} placeholder="Doe" />
            </Form.Item>
          </Col>
        </Row>

        <Form.Item
          name="email"
          label="Email Address"
          rules={[
            { required: true, message: 'Please enter your email address' },
            { type: 'email', message: 'Please enter a valid email address' },
          ]}
        >
          <Input prefix={<MailOutlined style={{ color: '#bfbfbf' }} />} placeholder="john.doe@example.com" />
        </Form.Item>

        <Form.Item
          name="password"
          label="Password"
          rules={[
            { required: true, message: 'Please enter a password' },
            { min: 6, message: 'Password must be at least 6 characters' },
          ]}
        >
          <Input.Password prefix={<LockOutlined style={{ color: '#bfbfbf' }} />} placeholder="At least 6 characters" />
        </Form.Item>

        <Form.Item style={{ marginTop: 24, marginBottom: 16 }}>
          <Button type="primary" htmlType="submit" block loading={loading}>
            Create Account
          </Button>
        </Form.Item>
      </Form>

      <div style={{ textAlign: 'center', marginTop: 16 }}>
        <Text type="secondary">
          Already have an account?{' '}
          <Link href="/login" style={{ fontWeight: 600 }}>
            Sign in
          </Link>
        </Text>
      </div>
    </div>
  );
}
