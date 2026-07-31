'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Card,
  Row,
  Col,
  List,
  Button,
  Input,
  Typography,
  Avatar,
  Space,
  Popconfirm,
  Spin,
  message,
} from 'antd';
import {
  PlusOutlined,
  SendOutlined,
  RobotOutlined,
  UserOutlined,
  DeleteOutlined,
  CommentOutlined,
} from '@ant-design/icons';
import { chatService, type ChatMessage } from '../../../services/chat.service';

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;

export default function ChatPage() {
  const queryClient = useQueryClient();
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [inputContent, setInputContent] = useState('');

  // Fetch Conversations List
  const { data: conversations = [], isLoading: isLoadingConversations } = useQuery({
    queryKey: ['chat-conversations'],
    queryFn: chatService.getConversations,
  });

  // Fetch Active Conversation Details (including messages)
  const { data: activeConversation, isLoading: isLoadingMessages } = useQuery({
    queryKey: ['chat-conversation', selectedConversationId],
    queryFn: () => (selectedConversationId ? chatService.getConversation(selectedConversationId) : null),
    enabled: !!selectedConversationId,
  });

  // Mutations
  const createConversationMutation = useMutation({
    mutationFn: (title?: string) => chatService.createConversation(title),
    onSuccess: (newConv) => {
      queryClient.invalidateQueries({ queryKey: ['chat-conversations'] });
      setSelectedConversationId(newConv.id);
    },
    onError: () => message.error('Failed to create new conversation'),
  });

  const deleteConversationMutation = useMutation({
    mutationFn: chatService.deleteConversation,
    onSuccess: (_, deletedId) => {
      message.success('Conversation deleted');
      queryClient.invalidateQueries({ queryKey: ['chat-conversations'] });
      if (selectedConversationId === deletedId) {
        setSelectedConversationId(null);
      }
    },
  });

  const sendMessageMutation = useMutation({
    mutationFn: async (content: string) => {
      let convId = selectedConversationId;
      if (!convId) {
        const newConv = await chatService.createConversation('Interview Prep Chat');
        convId = newConv.id;
        setSelectedConversationId(convId);
      }
      return chatService.sendMessage(convId, content);
    },
    onSuccess: () => {
      setInputContent('');
      queryClient.invalidateQueries({ queryKey: ['chat-conversation', selectedConversationId] });
      queryClient.invalidateQueries({ queryKey: ['chat-conversations'] });
    },
    onError: () => message.error('Failed to send message'),
  });

  const handleSend = () => {
    if (!inputContent.trim()) return;
    sendMessageMutation.mutate(inputContent.trim());
  };

  const messages: ChatMessage[] = activeConversation?.messages || [];

  return (
    <div style={{ height: 'calc(100vh - 120px)' }}>
      <Row gutter={16} style={{ height: '100%' }}>
        {/* Left Sidebar: Conversations */}
        <Col xs={24} sm={8} md={6} style={{ height: '100%' }}>
          <Card
            title="AI Chat Prep"
            extra={
              <Button
                type="primary"
                size="small"
                icon={<PlusOutlined />}
                loading={createConversationMutation.isPending}
                onClick={() => createConversationMutation.mutate('Interview Prep')}
              >
                New
              </Button>
            }
            style={{ height: '100%', display: 'flex', flexDirection: 'column' }}
            bodyStyle={{ flex: 1, overflowY: 'auto', padding: 12 }}
          >
            <List
              loading={isLoadingConversations}
              dataSource={conversations}
              renderItem={(conv) => (
                <List.Item
                  onClick={() => setSelectedConversationId(conv.id)}
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
                        deleteConversationMutation.mutate(conv.id);
                      }}
                    >
                      <Button type="text" danger size="small" icon={<DeleteOutlined />} />
                    </Popconfirm>,
                  ]}
                >
                  <Space>
                    <CommentOutlined style={{ color: '#1677ff' }} />
                    <Text ellipsis style={{ maxWidth: 120, fontWeight: conv.id === selectedConversationId ? 600 : 400 }}>
                      {conv.title || 'Conversation'}
                    </Text>
                  </Space>
                </List.Item>
              )}
            />
          </Card>
        </Col>

        {/* Right Area: Messages & Input */}
        <Col xs={24} sm={16} md={18} style={{ height: '100%' }}>
          <Card
            style={{ height: '100%', display: 'flex', flexDirection: 'column' }}
            bodyStyle={{ flex: 1, display: 'flex', flexDirection: 'column', padding: 16 }}
          >
            {/* Messages Scroll Area */}
            <div style={{ flex: 1, overflowY: 'auto', paddingRight: 8, marginBottom: 16 }}>
              {isLoadingMessages ? (
                <div style={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center' }}>
                  <Spin tip="Loading chat messages..." />
                </div>
              ) : messages.length === 0 ? (
                <div style={{ textAlign: 'center', marginTop: 80, color: '#8c8c8c' }}>
                  <RobotOutlined style={{ fontSize: 48, color: '#1677ff', marginBottom: 12 }} />
                  <Title level={4}>Ask AI Interview Assistant Anything!</Title>
                  <Paragraph type="secondary">
                    Ask questions about System Design, Behavioral answers, Data Structures, or Resume improvements.
                  </Paragraph>
                </div>
              ) : (
                messages.map((msg) => {
                  const isUser = msg.role === 'user';
                  return (
                    <div
                      key={msg.id}
                      style={{
                        display: 'flex',
                        flexDirection: isUser ? 'row-reverse' : 'row',
                        marginBottom: 16,
                        alignItems: 'flex-start',
                        gap: 12,
                      }}
                    >
                      <Avatar
                        style={{ backgroundColor: isUser ? '#1677ff' : '#001529' }}
                        icon={isUser ? <UserOutlined /> : <RobotOutlined />}
                      />
                      <div
                        style={{
                          maxWidth: '75%',
                          background: isUser ? '#1677ff' : '#f5f7fa',
                          color: isUser ? '#ffffff' : '#1f2937',
                          padding: '12px 16px',
                          borderRadius: isUser ? '16px 16px 2px 16px' : '16px 16px 16px 2px',
                          whiteSpace: 'pre-wrap',
                          fontSize: 14,
                        }}
                      >
                        {msg.content}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Input Bar */}
            <div style={{ display: 'flex', gap: 12 }}>
              <TextArea
                rows={2}
                value={inputContent}
                onChange={(e) => setInputContent(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                placeholder="Type your message... (Shift+Enter for new line)"
                size="large"
              />
              <Button
                type="primary"
                size="large"
                style={{ height: 'auto', padding: '0 24px' }}
                icon={<SendOutlined />}
                loading={sendMessageMutation.isPending}
                disabled={!inputContent.trim()}
                onClick={handleSend}
              >
                Send
              </Button>
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  );
}
