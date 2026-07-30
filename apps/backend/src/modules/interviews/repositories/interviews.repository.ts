import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../infrastructure/database/prisma.service';
import { BaseRepository } from '../../../common/repositories/base.repository';
import type { Difficulty, InterviewStatus, InterviewType, Prisma, QuestionCategory } from '@prisma/client';

@Injectable()
export class InterviewsRepository extends BaseRepository {
  constructor(prisma: PrismaService) {
    super(prisma);
  }

  async createSession(data: {
    userId: string;
    resumeId?: string;
    jobDescriptionId?: string;
    type: InterviewType;
    difficulty: Difficulty;
    totalQuestions?: number;
    model: string;
    provider: string;
  }) {
    return this.prisma.interviewSession.create({
      data: {
        userId: data.userId,
        resumeId: data.resumeId || null,
        jobDescriptionId: data.jobDescriptionId || null,
        type: data.type,
        difficulty: data.difficulty,
        totalQuestions: data.totalQuestions ?? 10,
        model: data.model,
        provider: data.provider,
        status: 'PENDING',
      },
      include: {
        resume: true,
        jobDescription: true,
      },
    });
  }

  async findSessionById(id: string, userId?: string) {
    return this.prisma.interviewSession.findFirst({
      where: {
        id,
        ...(userId ? { userId } : {}),
      },
      include: {
        resume: true,
        jobDescription: true,
        questions: {
          orderBy: { createdAt: 'asc' },
          include: {
            evaluation: true,
          },
        },
        report: true,
      },
    });
  }

  async findSessionsByUserId(userId: string) {
    return this.prisma.interviewSession.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: {
        resume: {
          select: { id: true, filename: true, originalName: true },
        },
        jobDescription: {
          select: { id: true, title: true, company: true },
        },
        _count: {
          select: { questions: true, evaluations: true },
        },
      },
    });
  }

  async updateSessionStatus(id: string, userId: string, status: InterviewStatus) {
    const updateData: Prisma.InterviewSessionUpdateInput = { status };

    if (status === 'ACTIVE') {
      updateData.startedAt = new Date();
    } else if (status === 'COMPLETED' || status === 'CANCELLED') {
      updateData.completedAt = new Date();
    }

    return this.prisma.interviewSession.update({
      where: { id, userId },
      data: updateData,
    });
  }

  async updateCurrentQuestionIndex(id: string, userId: string, nextIndex: number) {
    return this.prisma.interviewSession.update({
      where: { id, userId },
      data: { currentQuestionIndex: nextIndex },
    });
  }

  async createQuestion(data: {
    sessionId: string;
    category: QuestionCategory;
    difficulty: Difficulty;
    content: string;
    expectedAnswer?: string;
    hints?: string[];
    followUpQuestions?: string[];
  }) {
    return this.prisma.question.create({
      data: {
        sessionId: data.sessionId,
        category: data.category,
        difficulty: data.difficulty,
        content: data.content,
        expectedAnswer: data.expectedAnswer || null,
        hints: data.hints || [],
        followUpQuestions: data.followUpQuestions || [],
      },
    });
  }

  async createQuestionsMany(
    questions: Array<{
      sessionId: string;
      category: QuestionCategory;
      difficulty: Difficulty;
      content: string;
      expectedAnswer?: string;
      hints?: string[];
      followUpQuestions?: string[];
    }>,
  ) {
    return this.prisma.$transaction(
      questions.map((q) =>
        this.prisma.question.create({
          data: {
            sessionId: q.sessionId,
            category: q.category,
            difficulty: q.difficulty,
            content: q.content,
            expectedAnswer: q.expectedAnswer || null,
            hints: q.hints || [],
            followUpQuestions: q.followUpQuestions || [],
          },
        }),
      ),
    );
  }

  async findQuestionsBySessionId(sessionId: string) {
    return this.prisma.question.findMany({
      where: { sessionId },
      orderBy: { createdAt: 'asc' },
      include: { evaluation: true },
    });
  }

  async findQuestionById(id: string) {
    return this.prisma.question.findUnique({
      where: { id },
      include: { evaluation: true, session: true },
    });
  }
}
