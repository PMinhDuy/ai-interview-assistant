import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../infrastructure/database/prisma.service';
import { BaseRepository } from '../../../common/repositories/base.repository';
import { Prisma } from '@prisma/client';

@Injectable()
export class EvaluationsRepository extends BaseRepository {
  constructor(prisma: PrismaService) {
    super(prisma);
  }

  async createEvaluation(data: {
    sessionId: string;
    questionId: string;
    userAnswer: string;
    scores: Prisma.InputJsonValue;
    feedback: string;
    strengths: string[];
    improvements: string[];
    suggestedAnswer?: string;
    complexityAnalysis?: Prisma.InputJsonValue;
  }) {
    return this.prisma.evaluation.upsert({
      where: { questionId: data.questionId },
      create: {
        sessionId: data.sessionId,
        questionId: data.questionId,
        userAnswer: data.userAnswer,
        scores: data.scores,
        feedback: data.feedback,
        strengths: data.strengths,
        improvements: data.improvements,
        suggestedAnswer: data.suggestedAnswer || null,
        complexityAnalysis: data.complexityAnalysis ?? Prisma.JsonNull,
      },
      update: {
        userAnswer: data.userAnswer,
        scores: data.scores,
        feedback: data.feedback,
        strengths: data.strengths,
        improvements: data.improvements,
        suggestedAnswer: data.suggestedAnswer || null,
        complexityAnalysis: data.complexityAnalysis ?? Prisma.JsonNull,
      },
    });
  }

  async findByQuestionId(questionId: string) {
    return this.prisma.evaluation.findUnique({
      where: { questionId },
      include: { question: true },
    });
  }

  async findById(id: string) {
    return this.prisma.evaluation.findUnique({
      where: { id },
      include: { question: true },
    });
  }

  async findBySessionId(sessionId: string) {
    return this.prisma.evaluation.findMany({
      where: { sessionId },
      include: { question: true },
      orderBy: { createdAt: 'asc' },
    });
  }

  async createSessionReport(data: {
    sessionId: string;
    userId: string;
    overallScore: Prisma.InputJsonValue;
    totalQuestions: number;
    answeredQuestions: number;
    durationSeconds: number;
    strengths: string[];
    areasToImprove: string[];
    learningRoadmap: Prisma.InputJsonValue;
  }) {
    return this.prisma.sessionReport.upsert({
      where: { sessionId: data.sessionId },
      create: {
        sessionId: data.sessionId,
        userId: data.userId,
        overallScore: data.overallScore,
        totalQuestions: data.totalQuestions,
        answeredQuestions: data.answeredQuestions,
        durationSeconds: data.durationSeconds,
        strengths: data.strengths,
        areasToImprove: data.areasToImprove,
        learningRoadmap: data.learningRoadmap,
      },
      update: {
        overallScore: data.overallScore,
        totalQuestions: data.totalQuestions,
        answeredQuestions: data.answeredQuestions,
        durationSeconds: data.durationSeconds,
        strengths: data.strengths,
        areasToImprove: data.areasToImprove,
        learningRoadmap: data.learningRoadmap,
      },
    });
  }

  async findSessionReport(sessionId: string) {
    return this.prisma.sessionReport.findUnique({
      where: { sessionId },
    });
  }
}
