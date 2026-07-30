import { Injectable, Logger, InternalServerErrorException } from '@nestjs/common';
import { LLMProvider } from '../../../infrastructure/providers/provider.interface';
import { RAGService } from '../../rag/services/rag.service';
import { Difficulty, InterviewType, QuestionCategory } from '@prisma/client';

export interface GeneratedQuestionItem {
  category: QuestionCategory;
  difficulty: Difficulty;
  content: string;
  expectedAnswer?: string;
  hints?: string[];
  followUpQuestions?: string[];
}

export interface QuestionGeneratorContext {
  type: InterviewType;
  difficulty: Difficulty;
  resumeText?: string | null;
  jobDescriptionText?: string | null;
  count?: number;
  category?: QuestionCategory;
  model?: string;
}

@Injectable()
export class QuestionGeneratorService {
  private readonly logger = new Logger(QuestionGeneratorService.name);

  constructor(
    private readonly llmProvider: LLMProvider,
    private readonly ragService: RAGService,
  ) {}

  /**
   * Generates tailored interview questions based on session criteria and candidate/job context
   */
  async generateQuestions(context: QuestionGeneratorContext): Promise<GeneratedQuestionItem[]> {
    const count = context.count || 5;

    // Retrieve RAG context if resume or job description text are available
    let contextSnippet = '';
    if (context.resumeText) {
      contextSnippet += `\nCandidate Resume Highlights:\n${context.resumeText.slice(0, 1500)}\n`;
    }
    if (context.jobDescriptionText) {
      contextSnippet += `\nJob Description Requirements:\n${context.jobDescriptionText.slice(0, 1500)}\n`;
    }

    const prompt = this.buildPrompt({
      type: context.type,
      difficulty: context.difficulty,
      count,
      category: context.category,
      contextSnippet,
    });

    this.logger.debug(`Generating ${count} ${context.type} questions (difficulty: ${context.difficulty})...`);

    try {
      const response = await this.llmProvider.complete({
        messages: [
          {
            role: 'system',
            content:
              'You are an expert technical interviewer and AI system. You MUST output ONLY valid JSON matching the requested schema without conversational text.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        model: context.model || 'llama3.2',
      });

      const parsedQuestions = this.parseQuestionsResponse(response.content, context.difficulty);
      this.logger.log(`Successfully generated ${parsedQuestions.length} questions`);
      return parsedQuestions;
    } catch (error) {
      this.logger.error(`Failed to generate questions: ${(error as Error).message}`, (error as Error).stack);
      
      // Fallback questions in case of AI provider failure
      return this.getFallbackQuestions(context.type, context.difficulty, count, context.category);
    }
  }

  private buildPrompt(params: {
    type: InterviewType;
    difficulty: Difficulty;
    count: number;
    category?: QuestionCategory;
    contextSnippet: string;
  }): string {
    const validCategories = Object.keys(QuestionCategory).join(', ');

    return `Generate ${params.count} ${params.difficulty} level ${params.type} interview questions.

${params.contextSnippet}

Allowed Categories: ${validCategories}
${params.category ? `Target Category: ${params.category}` : ''}

CRITICAL RULES:
1. Output MUST be a valid JSON array of objects.
2. Each object MUST strictly follow this JSON schema:
[
  {
    "category": "one of allowed categories above",
    "difficulty": "${params.difficulty}",
    "content": "Clear, direct, realistic interview question",
    "expectedAnswer": "Key technical or behavioral points the candidate should address",
    "hints": ["Hint 1 to assist candidate", "Hint 2"],
    "followUpQuestions": ["Deep dive follow-up question"]
  }
]
3. DO NOT include markdown markdown headers, code block ticks, or introduction. Return JSON ONLY.`;
  }

  private parseQuestionsResponse(rawContent: string, defaultDifficulty: Difficulty): GeneratedQuestionItem[] {
    try {
      // Strip potential ```json markdown blocks
      let cleaned = rawContent.trim();
      if (cleaned.startsWith('```')) {
        cleaned = cleaned.replace(/^```(?:json)?\s*/, '').replace(/\s*```$/, '');
      }

      const parsed = JSON.parse(cleaned);

      if (!Array.isArray(parsed)) {
        throw new Error('Response is not a JSON array');
      }

      return parsed.map((item) => {
        const categoryStr = (item.category || 'CUSTOM').toUpperCase();
        const validCategory = Object.keys(QuestionCategory).includes(categoryStr)
          ? (categoryStr as QuestionCategory)
          : QuestionCategory.CUSTOM;

        return {
          category: validCategory,
          difficulty: item.difficulty || defaultDifficulty,
          content: item.content || 'Default Question Content',
          expectedAnswer: item.expectedAnswer || undefined,
          hints: Array.isArray(item.hints) ? item.hints : [],
          followUpQuestions: Array.isArray(item.followUpQuestions) ? item.followUpQuestions : [],
        };
      });
    } catch (err) {
      this.logger.warn(`Failed to parse AI question generation output as JSON: ${(err as Error).message}. Raw content: ${rawContent.slice(0, 200)}`);
      throw new InternalServerErrorException('AI returned invalid format for questions');
    }
  }

  private getFallbackQuestions(
    type: InterviewType,
    difficulty: Difficulty,
    count: number,
    category?: QuestionCategory,
  ): GeneratedQuestionItem[] {
    const fallbackList: GeneratedQuestionItem[] = [
      {
        category: category || QuestionCategory.NODEJS,
        difficulty,
        content: 'Explain how event loop works in Node.js and how non-blocking I/O operations are handled.',
        expectedAnswer: 'Should explain call stack, libuv thread pool, microtask queue (Promises), and macrotask queue (setTimeout, I/O).',
        hints: ['Mention libuv and task queues.', 'Differentiate microtasks vs macrotasks.'],
        followUpQuestions: ['What happens when process.nextTick() is called repeatedly?'],
      },
      {
        category: category || QuestionCategory.SYSTEM_DESIGN,
        difficulty,
        content: 'How would you design a rate limiter for an API gateway supporting 100k requests per second?',
        expectedAnswer: 'Should cover algorithms (Token Bucket, Leaky Bucket, Sliding Window Log, Sliding Window Counter), Redis sliding window implementation, distributed synchronization.',
        hints: ['Consider Redis data structures.', 'Think about latency overhead.'],
        followUpQuestions: ['How to handle rate limiting across multiple geographic regions?'],
      },
      {
        category: category || QuestionCategory.BEHAVIORAL,
        difficulty,
        content: 'Describe a situation where you had a disagreement with a team member on technical architecture. How did you resolve it?',
        expectedAnswer: 'STAR method response highlighting constructive feedback, trade-off evaluation, and team consensus.',
        hints: ['Use STAR structure: Situation, Task, Action, Result.'],
        followUpQuestions: ['What would you do differently if the same situation happens again?'],
      },
    ];

    return fallbackList.slice(0, count);
  }
}
