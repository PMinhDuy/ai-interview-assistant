'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Form, Input, Button, Alert, Typography, Row, Col } from 'antd';
import { MailOutlined, LockOutlined, UserOutlined } from '@ant-design/icons';
import axios from 'axios';
import { useAuthStore } from '../../../store/useAuthStore';

const { Text } = Typography;

interface ApiErrorResponse {
  message?: string | string[];
}

function isApiErrorResponse(data: unknown): data is ApiErrorResponse {
  return typeof data === 'object' && data !== null && 'message' in data;
}

export default function RegisterPage() {
  const router = useRouter();
  const register = useAuthStore((state) => state.register);

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const onFinish = async (values: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
  }) => {
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
      let msg = 'Registration failed. Email may already be in use.';
      if (axios.isAxiosError(err)) {
        const responseData = err.response?.data;
        if (isApiErrorResponse(responseData)) {
          if (typeof responseData.message === 'string') {
            msg = responseData.message;
          } else if (Array.isArray(responseData.message)) {
            msg = responseData.message.join(', ');
          }
        }
      } else if (err instanceof Error) {
        msg = err.message;
      }
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
            <Form.Item
              name="firstName"
              label="First Name"
              rules={[
                { required: true, message: 'Please enter your first name' },
                { max: 50, message: 'First name must not exceed 50 characters' },
              ]}
            >
              <Input prefix={<UserOutlined style={{ color: '#bfbfbf' }} />} placeholder="John" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="lastName"
              label="Last Name"
              rules={[
                { required: true, message: 'Please enter your last name' },
                { max: 50, message: 'Last name must not exceed 50 characters' },
              ]}
            >
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
            { min: 8, message: 'Password must be at least 8 characters' },
            { max: 128, message: 'Password must not exceed 128 characters' },
          ]}
        >
          <Input.Password prefix={<LockOutlined style={{ color: '#bfbfbf' }} />} placeholder="At least 8 characters" />
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
