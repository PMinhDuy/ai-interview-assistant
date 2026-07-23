// ── Interview Session & Question types ───────────────────────

export type InterviewType =
  | 'TECHNICAL'
  | 'BEHAVIORAL'
  | 'SYSTEM_DESIGN'
  | 'CODING'
  | 'MIXED';

export type Difficulty = 'EASY' | 'MEDIUM' | 'HARD';

export type InterviewStatus = 'PENDING' | 'ACTIVE' | 'PAUSED' | 'COMPLETED' | 'CANCELLED';

export type QuestionCategory =
  | 'REACT'
  | 'NEXTJS'
  | 'NESTJS'
  | 'NODEJS'
  | 'AWS'
  | 'SYSTEM_DESIGN'
  | 'BEHAVIORAL'
  | 'CODING'
  | 'CUSTOM';

export type InterviewSession = {
  id: string;
  userId: string;
  resumeId?: string;
  jobDescriptionId?: string;
  type: InterviewType;
  difficulty: Difficulty;
  status: InterviewStatus;
  totalQuestions: number;
  currentQuestionIndex: number;
  model: string;
  provider: string;
  startedAt?: string;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
};

export type Question = {
  id: string;
  sessionId: string;
  category: QuestionCategory;
  difficulty: Difficulty;
  content: string;
  expectedAnswer?: string;
  hints?: string[];
  followUpQuestions?: string[];
  createdAt: string;
};

export type CreateSessionRequest = {
  type: InterviewType;
  difficulty: Difficulty;
  totalQuestions?: number;
  resumeId?: string;
  jobDescriptionId?: string;
  categories?: QuestionCategory[];
  model?: string;
};
