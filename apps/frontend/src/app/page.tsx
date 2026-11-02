'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '../store/useAuthStore';
import { Spin, Typography } from 'antd';

export default function RootPage() {
  const router = useRouter();
  const { isAuthenticated, isInitialized } = useAuthStore();

  useEffect(() => {
    if (isInitialized) {
      if (isAuthenticated) {
        router.replace('/dashboard');
      } else {
        router.replace('/login');
      }
    }
  }, [isInitialized, isAuthenticated, router]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', alignItems: 'center', justifyContent: 'center', background: '#f5f7fa', gap: 16 }}>
      <Spin size="large" />
      <Typography.Text type="secondary">Redirecting...</Typography.Text>
    </div>
  );
}
