import {
  Injectable,
  Logger,
  NotFoundException,
  InternalServerErrorException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EvaluationsRepository } from '../repositories/evaluations.repository';
import { LLMProvider } from '../../../infrastructure/providers/provider.interface';
import { PrismaService } from '../../../infrastructure/database/prisma.service';
import { Prisma, type Question } from '@prisma/client';
import { EvaluationScoreDto } from '../dto/evaluation.dto';

const EVALUATION_SYSTEM_PROMPT = `
You are a Senior Technical Interview Evaluator. Evaluate the candidate's answer objectively.

Return ONLY a valid JSON object with no additional text or explanations. Follow this exact JSON structure:
{
  "scores": {
    "overall": 85,
    "technical": 90,
    "communication": 80,
    "problemSolving": 85,
    "depth": 80
  },
  "feedback": "2-3 sentences of constructive feedback explaining strengths and areas of growth.",
  "strengths": ["Clear explanation of core concept", "Good practical example"],
  "improvements": ["Could mention trade-offs or edge cases"],
  "suggestedAnswer": "A comprehensive model answer highlighting key principles.",
  "complexityAnalysis": null
}

Scoring Rubric (0-100 scale):
- technical (40%): Correctness, technical precision, framework/language accurate terminology
- communication (20%): Structure, clarity, coherence, concise explanation
- problemSolving (20%): Logical reasoning, approach, architectural sound principles
- depth (20%): Comprehensive coverage, awareness of edge cases or trade-offs
- overall: Weighted calculation = (technical * 0.4) + (communication * 0.2) + (problemSolving * 0.2) + (depth * 0.2)
`;

@Injectable()
export class EvaluationsService {
  private readonly logger = new Logger(EvaluationsService.name);

  constructor(
    private readonly repo: EvaluationsRepository,
    private readonly llmProvider: LLMProvider,
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  /**
   * Evaluates a candidate's answer to a specific interview question
   */
  async evaluateAnswer(params: {
    question: Question;
    userAnswer: string;
    resumeText?: string;
    jobDescriptionText?: string;
  }) {
    const { question, userAnswer, resumeText, jobDescriptionText } = params;

    const userPrompt = `
Question Category: ${question.category}
Difficulty Level: ${question.difficulty}
Question Content:
${question.content}

Expected Model Answer / Key Points:
${question.expectedAnswer || 'N/A'}

Candidate Answer:
${userAnswer}

${resumeText ? `Candidate Resume Context:\n${resumeText.slice(0, 500)}...` : ''}
${jobDescriptionText ? `Job Description Context:\n${jobDescriptionText.slice(0, 500)}...` : ''}

Evaluate the candidate's answer and return JSON only.
`;

    try {
      const activeModel =
        this.config.get<string>('AI_PROVIDER', 'gemini').toLowerCase() === 'gemini'
          ? this.config.get<string>('GEMINI_MODEL', 'gemini-flash-latest')
          : this.config.get<string>('OLLAMA_DEFAULT_MODEL', 'llama3');

      const llmResponse = await this.llmProvider.complete({
        messages: [{ role: 'user', content: userPrompt }],
        model: activeModel,
        temperature: 0.3,
        systemPrompt: EVALUATION_SYSTEM_PROMPT,
      });

      const parsed = this.parseEvaluationResponse(llmResponse.content);

      const evaluation = await this.repo.createEvaluation({
        sessionId: question.sessionId,
        questionId: question.id,
        userAnswer,
        scores: parsed.scores as unknown as Prisma.InputJsonValue,
        feedback: parsed.feedback,
        strengths: parsed.strengths,
        improvements: parsed.improvements,
        suggestedAnswer: parsed.suggestedAnswer || undefined,
        complexityAnalysis: (parsed.complexityAnalysis as unknown as Prisma.InputJsonValue) ?? undefined,
      });

      this.logger.log(`Created evaluation for question ${question.id} (Score: ${parsed.scores.overall})`);
      return evaluation;
    } catch (error) {
      this.logger.error(`Failed to evaluate question ${question.id}: ${(error as Error).message}`, (error as Error).stack);
      throw new InternalServerErrorException(`Failed to evaluate candidate answer: ${(error as Error).message}`);
    }
  }

  /**
   * Generates a comprehensive summary report for a completed interview session
   */
  async generateSessionReport(sessionId: string, userId: string) {
    const evaluations = await this.repo.findBySessionId(sessionId);
    if (evaluations.length === 0) {
      throw new NotFoundException(`No evaluations found for session ${sessionId}`);
    }

    const session = await this.prisma.interviewSession.findUnique({
      where: { id: sessionId },
      include: { questions: true },
    });

    if (!session) {
      throw new NotFoundException(`Interview session ${sessionId} not found`);
    }

    // Aggregate scores across all evaluated questions
    let totalOverall = 0;
    let totalTechnical = 0;
    let totalCommunication = 0;
    let totalProblemSolving = 0;
    let totalDepth = 0;

    const allStrengths: string[] = [];
    const allImprovements: string[] = [];

    evaluations.forEach((evalItem) => {
      const scores = evalItem.scores as unknown as EvaluationScoreDto;
      totalOverall += scores.overall || 0;
      totalTechnical += scores.technical || 0;
      totalCommunication += scores.communication || 0;
      totalProblemSolving += scores.problemSolving || 0;
      totalDepth += scores.depth || 0;

      if (Array.isArray(evalItem.strengths)) {
        allStrengths.push(...evalItem.strengths);
      }
      if (Array.isArray(evalItem.improvements)) {
        allImprovements.push(...evalItem.improvements);
      }
    });

    const count = evaluations.length;
    const aggregatedScores: EvaluationScoreDto = {
      overall: Math.round(totalOverall / count),
      technical: Math.round(totalTechnical / count),
      communication: Math.round(totalCommunication / count),
      problemSolving: Math.round(totalProblemSolving / count),
      depth: Math.round(totalDepth / count),
    };

    // Calculate duration in seconds
    const durationSeconds =
      session.completedAt && session.startedAt
        ? Math.max(0, Math.round((session.completedAt.getTime() - session.startedAt.getTime()) / 1000))
        : 0;

    // Remove duplicates
    const uniqueStrengths = Array.from(new Set(allStrengths)).slice(0, 5);
    const uniqueImprovements = Array.from(new Set(allImprovements)).slice(0, 5);

    // Generate actionable learning roadmap suggestions
    const learningRoadmap = uniqueImprovements.map((area, index) => ({
      step: index + 1,
      topic: area,
      action: `Review core concepts and practice code examples related to: ${area}`,
      resource: 'https://developer.mozilla.org / https://nestjs.com / Official docs',
    }));

    const report = await this.repo.createSessionReport({
      sessionId,
      userId,
      overallScore: aggregatedScores as unknown as Prisma.InputJsonValue,
      totalQuestions: session.questions.length,
      answeredQuestions: evaluations.length,
      durationSeconds,
      strengths: uniqueStrengths,
      areasToImprove: uniqueImprovements,
      learningRoadmap: learningRoadmap as unknown as Prisma.InputJsonValue,
    });

    this.logger.log(`Generated session report for session ${sessionId} (Overall Score: ${aggregatedScores.overall})`);
    return report;
  }

  async getSessionReport(sessionId: string) {
    const report = await this.repo.findSessionReport(sessionId);
    if (!report) {
      throw new NotFoundException(`Session report for session ${sessionId} not found`);
    }
    return report;
  }

  async getEvaluationsBySession(sessionId: string) {
    return this.repo.findBySessionId(sessionId);
  }

  async getEvaluationById(id: string) {
    const evaluation = await this.repo.findById(id);
    if (!evaluation) {
      throw new NotFoundException(`Evaluation with ID ${id} not found`);
    }
    return evaluation;
  }

  private parseEvaluationResponse(raw: string) {
    try {
      let cleanJson = raw.trim();
      const codeBlockMatch = cleanJson.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
      if (codeBlockMatch && codeBlockMatch[1]) {
        cleanJson = codeBlockMatch[1];
      }

      const parsed = JSON.parse(cleanJson);

      const technical = Math.min(100, Math.max(0, parsed.scores?.technical ?? 70));
      const communication = Math.min(100, Math.max(0, parsed.scores?.communication ?? 70));
      const problemSolving = Math.min(100, Math.max(0, parsed.scores?.problemSolving ?? 70));
      const depth = Math.min(100, Math.max(0, parsed.scores?.depth ?? 70));

      const computedOverall = Math.round(
        technical * 0.4 + communication * 0.2 + problemSolving * 0.2 + depth * 0.2,
      );

      return {
        scores: {
          overall: parsed.scores?.overall ? Math.min(100, Math.max(0, parsed.scores.overall)) : computedOverall,
          technical,
          communication,
          problemSolving,
          depth,
        },
        feedback: parsed.feedback || 'Answer evaluated.',
        strengths: Array.isArray(parsed.strengths) ? parsed.strengths : [],
        improvements: Array.isArray(parsed.improvements) ? parsed.improvements : [],
        suggestedAnswer: (parsed.suggestedAnswer as string) || null,
        complexityAnalysis: (parsed.complexityAnalysis as object) || null,
      };
    } catch {
      this.logger.warn(`Failed to parse evaluation LLM output as JSON. Output was: ${raw}`);
      return {
        scores: { overall: 70, technical: 70, communication: 70, problemSolving: 70, depth: 70 },
        feedback: raw,
        strengths: ['Addressed the question'],
        improvements: ['Could provide more detail'],
        suggestedAnswer: null,
        complexityAnalysis: null,
      };
    }
  }
}
