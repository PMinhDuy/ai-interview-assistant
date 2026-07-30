import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InterviewsRepository } from '../repositories/interviews.repository';
import { QuestionGeneratorService } from './question-generator.service';
import { ResumesService } from '../../resumes/resumes.service';
import { JobDescriptionsService } from '../../job-descriptions/job-descriptions.service';
import {
  CreateInterviewSessionDto,
  GenerateQuestionsDto,
  SubmitAnswerDto,
  UpdateInterviewSessionStatusDto,
} from '../dto/interview.dto';

@Injectable()
export class InterviewsService {
  private readonly logger = new Logger(InterviewsService.name);
  private readonly defaultModel: string;

  constructor(
    private readonly interviewsRepo: InterviewsRepository,
    private readonly questionGenerator: QuestionGeneratorService,
    private readonly resumesService: ResumesService,
    private readonly jobDescriptionsService: JobDescriptionsService,
    private readonly config: ConfigService,
  ) {
    const provider = this.config.get<string>('AI_PROVIDER', 'gemini');
    this.defaultModel =
      provider.toLowerCase() === 'gemini'
        ? this.config.get<string>('GEMINI_MODEL', 'gemini-flash-latest')
        : this.config.get<string>('OLLAMA_DEFAULT_MODEL', 'llama3');
  }

  async createSession(userId: string, dto: CreateInterviewSessionDto) {
    let resumeText: string | undefined;
    let jobDescriptionText: string | undefined;

    // Validate Resume ownership & existence if provided
    if (dto.resumeId) {
      const resume = await this.resumesService.findOne(dto.resumeId, userId);
      resumeText = resume.extractedText || undefined;
    }

    // Validate Job Description ownership & existence if provided
    if (dto.jobDescriptionId) {
      const jd = await this.jobDescriptionsService.findOne(dto.jobDescriptionId, userId);
      jobDescriptionText = jd.extractedText || undefined;
    }

    const activeProvider = this.config.get<string>('AI_PROVIDER', 'local');
    const model = dto.model || this.defaultModel;

    // 1. Create Interview Session record
    const session = await this.interviewsRepo.createSession({
      userId,
      resumeId: dto.resumeId,
      jobDescriptionId: dto.jobDescriptionId,
      type: dto.type,
      difficulty: dto.difficulty,
      totalQuestions: dto.totalQuestions,
      model,
      provider: activeProvider,
    });

    this.logger.log(`Created interview session: ${session.id} for user ${userId}`);

    // 2. Generate initial batch of questions
    const initialCount = Math.min(dto.totalQuestions || 5, 5);
    const questions = await this.questionGenerator.generateQuestions({
      type: dto.type,
      difficulty: dto.difficulty,
      resumeText,
      jobDescriptionText,
      count: initialCount,
      model,
    });

    if (questions.length > 0) {
      await this.interviewsRepo.createQuestionsMany(
        questions.map((q) => ({
          sessionId: session.id,
          category: q.category,
          difficulty: q.difficulty,
          content: q.content,
          expectedAnswer: q.expectedAnswer,
          hints: q.hints,
          followUpQuestions: q.followUpQuestions,
        })),
      );
    }

    return this.getSession(session.id, userId);
  }

  async getSessions(userId: string) {
    return this.interviewsRepo.findSessionsByUserId(userId);
  }

  async getSession(id: string, userId: string) {
    const session = await this.interviewsRepo.findSessionById(id, userId);
    if (!session) {
      throw new NotFoundException(`Interview session with ID ${id} not found`);
    }
    return session;
  }

  async updateStatus(id: string, userId: string, dto: UpdateInterviewSessionStatusDto) {
    await this.getSession(id, userId);
    const updated = await this.interviewsRepo.updateSessionStatus(id, userId, dto.status);
    this.logger.log(`Updated interview session ${id} status to ${dto.status}`);
    return updated;
  }

  async generateMoreQuestions(sessionId: string, userId: string, dto: GenerateQuestionsDto) {
    const session = await this.getSession(sessionId, userId);

    const questions = await this.questionGenerator.generateQuestions({
      type: session.type,
      difficulty: session.difficulty,
      resumeText: session.resume?.extractedText,
      jobDescriptionText: session.jobDescription?.extractedText,
      count: dto.count || 5,
      category: dto.category,
      model: session.model,
    });

    const savedQuestions = await this.interviewsRepo.createQuestionsMany(
      questions.map((q) => ({
        sessionId: session.id,
        category: q.category,
        difficulty: q.difficulty,
        content: q.content,
        expectedAnswer: q.expectedAnswer,
        hints: q.hints,
        followUpQuestions: q.followUpQuestions,
      })),
    );

    return savedQuestions;
  }

  async getCurrentQuestion(sessionId: string, userId: string) {
    const session = await this.getSession(sessionId, userId);
    if (session.questions.length === 0) {
      throw new NotFoundException(`No questions available for interview session ${sessionId}`);
    }

    const currentIdx = session.currentQuestionIndex;
    if (currentIdx >= session.questions.length) {
      return {
        completed: true,
        message: 'All questions in this session have been completed.',
        totalQuestions: session.questions.length,
      };
    }

    return {
      completed: false,
      currentIndex: currentIdx,
      totalQuestions: session.questions.length,
      question: session.questions[currentIdx],
    };
  }

  async nextQuestion(sessionId: string, userId: string) {
    const session = await this.getSession(sessionId, userId);

    if (session.status !== 'ACTIVE') {
      if (session.status === 'PENDING') {
        await this.interviewsRepo.updateSessionStatus(sessionId, userId, 'ACTIVE');
      } else {
        throw new BadRequestException(`Cannot advance question in session with status ${session.status}`);
      }
    }

    const nextIndex = session.currentQuestionIndex + 1;

    if (nextIndex >= session.questions.length) {
      await this.interviewsRepo.updateSessionStatus(sessionId, userId, 'COMPLETED');
      await this.interviewsRepo.updateCurrentQuestionIndex(sessionId, userId, nextIndex);
      return {
        completed: true,
        message: 'Interview session completed!',
        currentIndex: nextIndex,
      };
    }

    await this.interviewsRepo.updateCurrentQuestionIndex(sessionId, userId, nextIndex);

    return {
      completed: false,
      currentIndex: nextIndex,
      totalQuestions: session.questions.length,
      question: session.questions[nextIndex],
    };
  }

  async submitAnswer(sessionId: string, userId: string, dto: SubmitAnswerDto) {
    await this.getSession(sessionId, userId);
    const question = await this.interviewsRepo.findQuestionById(dto.questionId);

    if (!question || question.sessionId !== sessionId) {
      throw new NotFoundException(`Question with ID ${dto.questionId} not found in this interview session`);
    }

    const recorded = await this.interviewsRepo.recordUserAnswer(dto.questionId, dto.userAnswer);
    this.logger.log(`Recorded candidate answer for question ${dto.questionId} in session ${sessionId}`);

    const nextResult = await this.nextQuestion(sessionId, userId);

    return {
      success: true,
      questionId: dto.questionId,
      userAnswer: dto.userAnswer,
      answeredAt: recorded.answeredAt,
      next: nextResult,
    };
  }
}
