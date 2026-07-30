import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';
import { QuestionGeneratorService } from './question-generator.service';
import { LLMProvider } from '../../../infrastructure/providers/provider.interface';
import { RAGService } from '../../rag/services/rag.service';
import { Difficulty, InterviewType, QuestionCategory } from '@prisma/client';

const mockLLMProvider = {
  complete: jest.fn(),
  stream: jest.fn(),
};

const mockRAGService = {
  retrieveRelevantContext: jest.fn(),
};

describe('QuestionGeneratorService', () => {
  let service: QuestionGeneratorService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        QuestionGeneratorService,
        { provide: LLMProvider, useValue: mockLLMProvider },
        { provide: RAGService, useValue: mockRAGService },
      ],
    }).compile();

    service = module.get<QuestionGeneratorService>(QuestionGeneratorService);
    jest.clearAllMocks();
  });

  describe('generateQuestions', () => {
    it('should correctly parse LLM JSON output into structured question objects', async () => {
      const mockLLMResult = JSON.stringify([
        {
          category: 'NESTJS',
          difficulty: 'MEDIUM',
          content: 'What is dynamic module in NestJS?',
          expectedAnswer: 'Dynamic modules allow configuring modules asynchronously.',
          hints: ['Think registerAsync'],
          followUpQuestions: ['How does ConfigModule work?'],
        },
      ]);

      mockLLMProvider.complete.mockResolvedValue({
        content: mockLLMResult,
        usage: { promptTokens: 100, outputTokens: 100, totalTokens: 200 },
      });

      const result = await service.generateQuestions({
        type: InterviewType.TECHNICAL,
        difficulty: Difficulty.MEDIUM,
        count: 1,
      });

      expect(result).toHaveLength(1);
      const q = result[0];
      expect(q).toBeDefined();
      if (q) {
        expect(q.category).toBe(QuestionCategory.NESTJS);
        expect(q.content).toBe('What is dynamic module in NestJS?');
      }
    });

    it('should strip markdown codeblocks from LLM response before JSON parsing', async () => {
      const mockLLMResult = `\`\`\`json
[
  {
    "category": "REACT",
    "difficulty": "EASY",
    "content": "What is useEffect hook?",
    "expectedAnswer": "Handles side effects.",
    "hints": [],
    "followUpQuestions": []
  }
]
\`\`\``;

      mockLLMProvider.complete.mockResolvedValue({
        content: mockLLMResult,
        usage: { promptTokens: 100, outputTokens: 100, totalTokens: 200 },
      });

      const result = await service.generateQuestions({
        type: InterviewType.TECHNICAL,
        difficulty: Difficulty.EASY,
        count: 1,
      });

      expect(result).toHaveLength(1);
      const q = result[0];
      expect(q).toBeDefined();
      if (q) {
        expect(q.category).toBe(QuestionCategory.REACT);
        expect(q.content).toBe('What is useEffect hook?');
      }
    });

    it('should return fallback questions if LLM fails or returns invalid JSON', async () => {
      mockLLMProvider.complete.mockRejectedValue(new Error('LLM connection error'));

      const result = await service.generateQuestions({
        type: InterviewType.TECHNICAL,
        difficulty: Difficulty.MEDIUM,
        count: 2,
      });

      expect(result.length).toBeGreaterThan(0);
      const q = result[0];
      expect(q).toBeDefined();
      if (q) {
        expect(q.content).toBeDefined();
      }
    });
  });
});
