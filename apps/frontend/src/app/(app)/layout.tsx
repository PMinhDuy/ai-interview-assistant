'use client';

import { useState, type ReactNode } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Layout, Menu, Avatar, Dropdown, Button, Typography, Space, Tag } from 'antd';
import {
  DashboardOutlined,
  PlayCircleOutlined,
  FolderOutlined,
  CommentOutlined,
  FileTextOutlined,
  UserOutlined,
  LogoutOutlined,
  SettingOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  RobotOutlined,
} from '@ant-design/icons';
import { AuthGuard } from '../../components/auth/AuthGuard';
import { useAuthStore } from '../../store/useAuthStore';

const { Header, Sider, Content } = Layout;
const { Text } = Typography;

export default function AppLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);
  const { user, logout } = useAuthStore();

  const handleLogout = async () => {
    await logout();
    router.replace('/login');
  };

  const userMenuItems = [
    {
      key: 'user-info',
      disabled: true,
      label: (
        <div style={{ padding: '4px 0' }}>
          <Text strong>{user?.firstName ? `${user.firstName} ${user.lastName || ''}` : user?.email}</Text>
          <div>
            <Text type="secondary" style={{ fontSize: 12 }}>
              {user?.email}
            </Text>
          </div>
          {user?.role === 'ADMIN' && (
            <Tag color="blue" style={{ marginTop: 4 }}>
              ADMIN
            </Tag>
          )}
        </div>
      ),
    },
    { type: 'divider' as const },
    {
      key: 'settings',
      icon: <SettingOutlined />,
      label: <Link href="/settings">Account Settings</Link>,
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: 'Sign Out',
      danger: true,
      onClick: handleLogout,
    },
  ];

  const sidebarMenuItems = [
    {
      key: '/dashboard',
      icon: <DashboardOutlined />,
      label: <Link href="/dashboard">Dashboard</Link>,
    },
    {
      key: '/interviews/new',
      icon: <PlayCircleOutlined />,
      label: <Link href="/interviews/new">New Interview</Link>,
    },
    {
      key: '/files',
      icon: <FolderOutlined />,
      label: <Link href="/files">Resumes & JDs</Link>,
    },
    {
      key: '/chat',
      icon: <CommentOutlined />,
      label: <Link href="/chat">AI Assistant</Link>,
    },
    ...(user?.role === 'ADMIN'
      ? [
          {
            key: '/admin/prompts',
            icon: <FileTextOutlined />,
            label: <Link href="/admin/prompts">Prompt Templates</Link>,
          },
        ]
      : []),
  ];

  return (
    <AuthGuard>
      <Layout style={{ minHeight: '100vh' }}>
        <Sider trigger={null} collapsible collapsed={collapsed} width={240} style={{ background: '#001529' }}>
          <div
            style={{
              height: 64,
              display: 'flex',
              alignItems: 'center',
              padding: '0 16px',
              gap: 12,
              borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
            }}
          >
            <RobotOutlined style={{ fontSize: 28, color: '#1677ff' }} />
            {!collapsed && (
              <Text strong style={{ color: '#ffffff', fontSize: 16, whiteSpace: 'nowrap' }}>
                AI Assistant
              </Text>
            )}
          </div>
          <Menu
            theme="dark"
            mode="inline"
            selectedKeys={[pathname]}
            items={sidebarMenuItems}
            style={{ borderRight: 0, marginTop: 8 }}
          />
        </Sider>

        <Layout>
          <Header
            style={{
              padding: '0 24px',
              background: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              boxShadow: '0 1px 4px rgba(0, 21, 41, 0.08)',
              zIndex: 1,
            }}
          >
            <Button
              type="text"
              icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
              onClick={() => setCollapsed(!collapsed)}
              style={{ fontSize: 16, width: 40, height: 40 }}
            />

            <Space size={16}>
              <Dropdown menu={{ items: userMenuItems }} placement="bottomRight" arrow>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                  <Avatar style={{ backgroundColor: '#1677ff' }} icon={<UserOutlined />}>
                    {user?.firstName?.[0]?.toUpperCase()}
                  </Avatar>
                  <Text strong>{user?.firstName || user?.email?.split('@')[0]}</Text>
                </div>
              </Dropdown>
            </Space>
          </Header>

          <Content style={{ margin: 24, minHeight: 280 }}>{children}</Content>
        </Layout>
      </Layout>
    </AuthGuard>
  );
}
