'use client';

import React, { useEffect, type ReactNode } from 'react';
import { AntdRegistry } from '@ant-design/nextjs-registry';
import { ConfigProvider, theme as antdTheme } from 'antd';
import { useAuthStore } from '../store/useAuthStore';

export function StyledComponentsRegistry({ children }: { children: ReactNode }) {
  const checkAuth = useAuthStore((state) => state.checkAuth);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  return (
    <AntdRegistry>
      <ConfigProvider
        theme={{
          algorithm: antdTheme.defaultAlgorithm,
          token: {
            colorPrimary: '#1677ff',
            colorLink: '#1677ff',
            borderRadius: 8,
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
          },
          components: {
            Button: {
              borderRadius: 6,
              fontWeight: 500,
            },
            Card: {
              borderRadiusLG: 12,
            },
            Layout: {
              bodyBg: '#f5f7fa',
              headerBg: '#ffffff',
              siderBg: '#001529',
            },
          },
        }}
      >
        {children}
      </ConfigProvider>
    </AntdRegistry>
  );
}
