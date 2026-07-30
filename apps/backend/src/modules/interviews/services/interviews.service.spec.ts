import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { NotFoundException } from '@nestjs/common';
import { InterviewsService } from './interviews.service';
import { InterviewsRepository } from '../repositories/interviews.repository';
import { QuestionGeneratorService } from './question-generator.service';
import { ResumesService } from '../../resumes/resumes.service';
import { JobDescriptionsService } from '../../job-descriptions/job-descriptions.service';
import { Difficulty, InterviewStatus, InterviewType, QuestionCategory } from '@prisma/client';

const mockInterviewsRepository = {
  createSession: jest.fn(),
  findSessionById: jest.fn(),
  findSessionsByUserId: jest.fn(),
  updateSessionStatus: jest.fn(),
  updateCurrentQuestionIndex: jest.fn(),
  createQuestionsMany: jest.fn(),
};

const mockQuestionGenerator = {
  generateQuestions: jest.fn(),
};

const mockResumesService = {
  findOne: jest.fn(),
};

const mockJobDescriptionsService = {
  findOne: jest.fn(),
};

const mockConfigService = {
  get: jest.fn((key: string, defaultVal: string) => defaultVal),
};

describe('InterviewsService', () => {
  let service: InterviewsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InterviewsService,
        { provide: InterviewsRepository, useValue: mockInterviewsRepository },
        { provide: QuestionGeneratorService, useValue: mockQuestionGenerator },
        { provide: ResumesService, useValue: mockResumesService },
        { provide: JobDescriptionsService, useValue: mockJobDescriptionsService },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    service = module.get<InterviewsService>(InterviewsService);
    jest.clearAllMocks();
  });

  describe('createSession', () => {
    it('should create interview session and initial set of questions', async () => {
      const userId = 'user-123';
      const mockSession = {
        id: 'session-123',
        userId,
        type: InterviewType.TECHNICAL,
        difficulty: Difficulty.MEDIUM,
        status: InterviewStatus.PENDING,
        totalQuestions: 10,
        model: 'llama3',
        provider: 'local',
        questions: [],
      };

      mockInterviewsRepository.createSession.mockResolvedValue(mockSession);
      mockQuestionGenerator.generateQuestions.mockResolvedValue([
        {
          category: QuestionCategory.NESTJS,
          difficulty: Difficulty.MEDIUM,
          content: 'What is a provider?',
        },
      ]);
      mockInterviewsRepository.findSessionById.mockResolvedValue({
        ...mockSession,
        questions: [{ id: 'q-1', content: 'What is a provider?' }],
      });

      const result = await service.createSession(userId, {
        type: InterviewType.TECHNICAL,
        difficulty: Difficulty.MEDIUM,
      });

      expect(mockInterviewsRepository.createSession).toHaveBeenCalled();
      expect(mockQuestionGenerator.generateQuestions).toHaveBeenCalled();
      expect(mockInterviewsRepository.createQuestionsMany).toHaveBeenCalled();
      expect(result.id).toBe('session-123');
    });

    it('should throw NotFoundException if specified resumeId does not exist', async () => {
      mockResumesService.findOne.mockRejectedValue(new NotFoundException());

      await expect(
        service.createSession('user-123', {
          type: InterviewType.TECHNICAL,
          difficulty: Difficulty.EASY,
          resumeId: 'non-existent-resume',
        }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('nextQuestion', () => {
    it('should advance to next question in active session', async () => {
      const session = {
        id: 'session-123',
        status: 'ACTIVE',
        currentQuestionIndex: 0,
        questions: [
          { id: 'q-1', content: 'Q1' },
          { id: 'q-2', content: 'Q2' },
        ],
      };

      mockInterviewsRepository.findSessionById.mockResolvedValue(session);

      const result = await service.nextQuestion('session-123', 'user-123');

      expect(mockInterviewsRepository.updateCurrentQuestionIndex).toHaveBeenCalledWith(
        'session-123',
        'user-123',
        1,
      );
      expect(result.completed).toBe(false);
      expect(result.currentIndex).toBe(1);
    });

    it('should mark session as COMPLETED when advancing past last question', async () => {
      const session = {
        id: 'session-123',
        status: 'ACTIVE',
        currentQuestionIndex: 1,
        questions: [
          { id: 'q-1', content: 'Q1' },
          { id: 'q-2', content: 'Q2' },
        ],
      };

      mockInterviewsRepository.findSessionById.mockResolvedValue(session);

      const result = await service.nextQuestion('session-123', 'user-123');

      expect(mockInterviewsRepository.updateSessionStatus).toHaveBeenCalledWith(
        'session-123',
        'user-123',
        'COMPLETED',
      );
      expect(result.completed).toBe(true);
    });
  });
});
