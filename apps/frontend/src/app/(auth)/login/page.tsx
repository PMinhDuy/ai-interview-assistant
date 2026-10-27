'use client';

import { Suspense } from 'react';
import { Spin } from 'antd';
import { LoginForm } from '@/features/auth';

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div style={{ display: 'flex', justifyContent: 'center', padding: 24 }}>
          <Spin size="large" />
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
