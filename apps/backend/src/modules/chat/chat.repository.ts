import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import { BaseRepository } from '../../common/repositories/base.repository';
import type { MessageRole } from '@prisma/client';

@Injectable()
export class ChatRepository extends BaseRepository {
  constructor(prisma: PrismaService) {
    super(prisma);
  }

  async createConversation(data: {
    userId: string;
    sessionId?: string;
    title?: string;
    model: string;
    provider: string;
  }) {
    return this.prisma.conversation.create({
      data: {
        userId: data.userId,
        sessionId: data.sessionId || null,
        title: data.title || 'New Chat',
        model: data.model,
        provider: data.provider,
      },
    });
  }

  async findConversationById(id: string, userId?: string) {
    return this.prisma.conversation.findFirst({
      where: { id, ...(userId ? { userId } : {}) },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' },
        },
      },
    });
  }

  async findConversationBySessionId(sessionId: string, userId: string) {
    return this.prisma.conversation.findFirst({
      where: { sessionId, userId },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' },
        },
      },
    });
  }

  async findConversationsByUserId(userId: string) {
    return this.prisma.conversation.findMany({
      where: { userId },
      orderBy: { updatedAt: 'desc' },
      select: {
        id: true,
        userId: true,
        sessionId: true,
        title: true,
        model: true,
        provider: true,
        totalTokens: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async createMessage(data: {
    conversationId: string;
    role: MessageRole;
    content: string;
    tokenCount?: number;
    latencyMs?: number;
    model?: string;
  }) {
    return this.prisma.$transaction(async (tx) => {
      const message = await tx.message.create({
        data,
      });

      if (data.tokenCount) {
        await tx.conversation.update({
          where: { id: data.conversationId },
          data: {
            totalTokens: {
              increment: data.tokenCount,
            },
          },
        });
      }

      return message;
    });
  }

  async deleteConversation(id: string, userId: string) {
    return this.prisma.conversation.delete({
      where: { id, userId },
    });
  }

  async updateConversationTitle(id: string, userId: string, title: string) {
    return this.prisma.conversation.update({
      where: { id, userId },
      data: { title },
    });
  }
}
