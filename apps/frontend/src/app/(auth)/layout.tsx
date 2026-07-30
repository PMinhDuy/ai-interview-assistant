'use client';

import type { ReactNode } from 'react';
import { Card, Typography } from 'antd';
import { RobotOutlined } from '@ant-design/icons';

const { Title, Text } = Typography;

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div
      style={{
        display: 'flex',
        minHeight: '100vh',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #001529 0%, #1677ff 100%)',
        padding: '24px 16px',
      }}
    >
      <Card
        style={{
          width: '100%',
          maxWidth: 440,
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
          borderRadius: 16,
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: 14,
              background: '#e6f4ff',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 12,
            }}
          >
            <RobotOutlined style={{ fontSize: 32, color: '#1677ff' }} />
          </div>
          <Title level={3} style={{ margin: 0, fontWeight: 700 }}>
            AI Interview Assistant
          </Title>
          <Text type="secondary">Master your technical interviews with AI feedback</Text>
        </div>
        {children}
      </Card>
    </div>
  );
}
