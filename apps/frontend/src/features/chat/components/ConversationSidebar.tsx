'use client';

import { Card, List, Button, Space, Popconfirm, Typography } from 'antd';
import { PlusOutlined, DeleteOutlined, CommentOutlined } from '@ant-design/icons';
import type { ConversationItem } from '../api';

const { Text } = Typography;

export interface ConversationSidebarProps {
  conversations: ConversationItem[];
  selectedConversationId: string | null;
  isLoading: boolean;
  isCreating: boolean;
  onSelectConversation: (id: string) => void;
  onCreateConversation: () => void;
  onDeleteConversation: (id: string) => void;
}

export function ConversationSidebar({
  conversations,
  selectedConversationId,
  isLoading,
  isCreating,
  onSelectConversation,
  onCreateConversation,
  onDeleteConversation,
}: ConversationSidebarProps) {
  return (
    <Card
      title="AI Chat Prep"
      extra={
        <Button
          type="primary"
          size="small"
          icon={<PlusOutlined />}
          loading={isCreating}
          onClick={onCreateConversation}
        >
          New
        </Button>
      }
      style={{ height: '100%', display: 'flex', flexDirection: 'column' }}
      styles={{ body: { flex: 1, overflowY: 'auto', padding: 12 } }}
    >
      <List
        loading={isLoading}
        dataSource={conversations}
        renderItem={(conv) => (
          <List.Item
            onClick={() => onSelectConversation(conv.id)}
            style={{
              cursor: 'pointer',
              borderRadius: 8,
              padding: '10px 12px',
              marginBottom: 6,
              background: conv.id === selectedConversationId ? '#e6f4ff' : 'transparent',
              border: conv.id === selectedConversationId ? '1px solid #91caff' : 'none',
            }}
            actions={[
              <Popconfirm
                key="del"
                title="Delete chat"
                onConfirm={(e) => {
                  e?.stopPropagation();
                  onDeleteConversation(conv.id);
                }}
              >
                <Button type="text" danger size="small" icon={<DeleteOutlined />} />
              </Popconfirm>,
            ]}
          >
            <Space>
              <CommentOutlined style={{ color: '#1677ff' }} />
              <Text
                ellipsis
                style={{
                  maxWidth: 120,
                  fontWeight: conv.id === selectedConversationId ? 600 : 400,
                }}
              >
                {conv.title || 'Conversation'}
              </Text>
            </Space>
          </List.Item>
        )}
      />
    </Card>
  );
}
