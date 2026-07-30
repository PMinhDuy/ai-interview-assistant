import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { NotFoundException } from '@nestjs/common';
import { EvaluationsService } from './evaluations.service';
import { EvaluationsRepository } from '../repositories/evaluations.repository';
import { LLMProvider } from '../../../infrastructure/providers/provider.interface';
import { PrismaService } from '../../../infrastructure/database/prisma.service';
import { Difficulty, QuestionCategory } from '@prisma/client';

const mockEvaluationsRepository = {
  createEvaluation: jest.fn(),
  findByQuestionId: jest.fn(),
  findById: jest.fn(),
  findBySessionId: jest.fn(),
  createSessionReport: jest.fn(),
  findSessionReport: jest.fn(),
};

const mockLLMProvider = {
  complete: jest.fn(),
  stream: jest.fn(),
};

const mockPrismaService = {
  interviewSession: {
    findUnique: jest.fn(),
  },
};

const mockConfigService = {
  get: jest.fn((key: string, defaultVal: string) => defaultVal),
};

describe('EvaluationsService', () => {
  let service: EvaluationsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EvaluationsService,
        { provide: EvaluationsRepository, useValue: mockEvaluationsRepository },
        { provide: LLMProvider, useValue: mockLLMProvider },
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    service = module.get<EvaluationsService>(EvaluationsService);
    jest.clearAllMocks();
  });

  describe('evaluateAnswer', () => {
    it('should evaluate answer via LLM and persist evaluation record', async () => {
      const mockQuestion = {
        id: 'q-123',
        sessionId: 's-123',
        category: QuestionCategory.NESTJS,
        difficulty: Difficulty.MEDIUM,
        content: 'What is Dependency Injection in NestJS?',
        expectedAnswer: 'DI is a design pattern...',
        hints: [],
        followUpQuestions: [],
        userAnswer: null,
        answeredAt: null,
        createdAt: new Date(),
      };

      const mockLlmJson = JSON.stringify({
        scores: {
          overall: 88,
          technical: 90,
          communication: 85,
          problemSolving: 85,
          depth: 85,
        },
        feedback: 'Great answer explaining DI containers.',
        strengths: ['Clear terminology', 'Good structural overview'],
        improvements: ['Mention custom providers'],
        suggestedAnswer: 'Dependency injection in NestJS...',
      });

      mockLLMProvider.complete.mockResolvedValue({
        content: mockLlmJson,
        model: 'gemini-flash-latest',
        provider: 'gemini',
        usage: { inputTokens: 100, outputTokens: 50, totalTokens: 150 },
        latencyMs: 300,
      });

      mockEvaluationsRepository.createEvaluation.mockImplementation((data) => Promise.resolve({ id: 'eval-123', ...data }));

      const result = await service.evaluateAnswer({
        question: mockQuestion,
        userAnswer: 'NestJS manages dependencies via IoC container...',
      });

      expect(mockLLMProvider.complete).toHaveBeenCalled();
      expect(mockEvaluationsRepository.createEvaluation).toHaveBeenCalled();
      expect(result.id).toBe('eval-123');
      expect((result.scores as { overall: number }).overall).toBe(88);
    });

    it('should fallback gracefully if LLM output is non-JSON', async () => {
      const mockQuestion = {
        id: 'q-123',
        sessionId: 's-123',
        category: QuestionCategory.NESTJS,
        difficulty: Difficulty.EASY,
        content: 'What is NestJS?',
        expectedAnswer: null,
        hints: [],
        followUpQuestions: [],
        userAnswer: null,
        answeredAt: null,
        createdAt: new Date(),
      };

      mockLLMProvider.complete.mockResolvedValue({
        content: 'Solid explanation of NestJS framework principles.',
        model: 'gemini-flash-latest',
        provider: 'gemini',
        usage: { inputTokens: 50, outputTokens: 20, totalTokens: 70 },
        latencyMs: 200,
      });

      mockEvaluationsRepository.createEvaluation.mockImplementation((data) => Promise.resolve({ id: 'eval-123', ...data }));

      const result = await service.evaluateAnswer({
        question: mockQuestion,
        userAnswer: 'NestJS is a Node.js framework...',
      });

      expect(result.id).toBe('eval-123');
      expect(result.feedback).toBe('Solid explanation of NestJS framework principles.');
    });
  });

  describe('generateSessionReport', () => {
    it('should aggregate evaluation scores and persist session report', async () => {
      const sessionId = 's-123';
      const userId = 'u-123';

      const mockEvaluations = [
        {
          id: 'e-1',
          sessionId,
          questionId: 'q-1',
          userAnswer: 'A1',
          scores: { overall: 80, technical: 80, communication: 80, problemSolving: 80, depth: 80 },
          feedback: 'Good',
          strengths: ['S1'],
          improvements: ['I1'],
        },
        {
          id: 'e-2',
          sessionId,
          questionId: 'q-2',
          userAnswer: 'A2',
          scores: { overall: 90, technical: 90, communication: 90, problemSolving: 90, depth: 90 },
          feedback: 'Excellent',
          strengths: ['S2'],
          improvements: ['I2'],
        },
      ];

      mockEvaluationsRepository.findBySessionId.mockResolvedValue(mockEvaluations);
      mockPrismaService.interviewSession.findUnique.mockResolvedValue({
        id: sessionId,
        questions: [{ id: 'q-1' }, { id: 'q-2' }],
        startedAt: new Date(Date.now() - 300000),
        completedAt: new Date(),
      });
      mockEvaluationsRepository.createSessionReport.mockImplementation((data) => Promise.resolve({ id: 'rep-123', ...data }));

      const report = await service.generateSessionReport(sessionId, userId);

      expect(mockEvaluationsRepository.createSessionReport).toHaveBeenCalled();
      expect(report.id).toBe('rep-123');
      expect((report.overallScore as { overall: number }).overall).toBe(85);
    });

    it('should throw NotFoundException if no evaluations exist for session', async () => {
      mockEvaluationsRepository.findBySessionId.mockResolvedValue([]);

      await expect(service.generateSessionReport('s-empty', 'u-123')).rejects.toThrow(NotFoundException);
    });
  });
});
