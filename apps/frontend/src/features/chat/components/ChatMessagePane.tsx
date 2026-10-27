'use client';

import { useState } from 'react';
import { Card, Input, Button, Avatar, Spin, Typography } from 'antd';
import { SendOutlined, RobotOutlined, UserOutlined } from '@ant-design/icons';
import type { ChatMessage } from '../api';

const { Title, Paragraph } = Typography;
const { TextArea } = Input;

export interface ChatMessagePaneProps {
  messages: ChatMessage[];
  isLoading: boolean;
  isSending: boolean;
  onSendMessage: (content: string) => void;
}

export function ChatMessagePane({
  messages,
  isLoading,
  isSending,
  onSendMessage,
}: ChatMessagePaneProps) {
  const [inputContent, setInputContent] = useState('');

  const handleSend = () => {
    if (!inputContent.trim() || isSending) return;
    onSendMessage(inputContent.trim());
    setInputContent('');
  };

  return (
    <Card
      style={{ height: '100%', display: 'flex', flexDirection: 'column' }}
      styles={{ body: { flex: 1, display: 'flex', flexDirection: 'column', padding: 16 } }}
    >
      {/* Messages Scroll Area */}
      <div style={{ flex: 1, overflowY: 'auto', paddingRight: 8, marginBottom: 16 }}>
        {isLoading ? (
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
          loading={isSending}
          disabled={!inputContent.trim()}
          onClick={handleSend}
        >
          Send
        </Button>
      </div>
    </Card>
  );
}
