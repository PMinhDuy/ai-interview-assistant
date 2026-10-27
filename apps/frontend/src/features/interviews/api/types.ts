import type {
  InterviewType,
  Difficulty,
  InterviewStatus,
} from '@repo/types';

export type { InterviewType, Difficulty, InterviewStatus };

export interface QuestionItem {
  id: string;
  sessionId: string;
  category: string;
  difficulty: Difficulty;
  content: string;
  expectedAnswer?: string;
  hints?: string[];
  followUpQuestions?: string[];
  userAnswer?: string;
  answeredAt?: string;
}

export interface InterviewSession {
  id: string;
  userId: string;
  type: InterviewType;
  difficulty: Difficulty;
  status: InterviewStatus;
  currentQuestionIndex: number;
  totalQuestions: number;
  resumeId?: string;
  jobDescriptionId?: string;
  createdAt: string;
  questions?: QuestionItem[];
}

export interface CreateInterviewSessionDto {
  type: InterviewType;
  difficulty: Difficulty;
  resumeId?: string;
  jobDescriptionId?: string;
  totalQuestions?: number;
}

export interface CurrentQuestionResponse {
  question?: QuestionItem;
  currentIndex?: number;
  totalQuestions?: number;
  completed?: boolean;
}

export interface SubmitAnswerResponse {
  success: boolean;
  questionId: string;
  userAnswer: string;
  answeredAt: string;
  evaluation?: {
    id: string;
    scores: {
      overall: number;
      technical: number;
      communication: number;
      problemSolving: number;
      depth: number;
    };
    feedback: string;
    strengths: string[];
    improvements: string[];
    suggestedAnswer?: string;
  };
  next: {
    completed: boolean;
    currentIndex: number;
    totalQuestions?: number;
    question?: QuestionItem;
    message?: string;
  };
}

export interface EvaluationItem {
  id: string;
  sessionId: string;
  questionId: string;
  userAnswer: string;
  scores: {
    overall: number;
    technical: number;
    communication: number;
    problemSolving: number;
    depth: number;
  };
  feedback: string;
  strengths: string[];
  improvements: string[];
  suggestedAnswer?: string;
  createdAt: string;
  question?: {
    content: string;
    category: string;
    difficulty: string;
  };
}

export interface SessionReportItem {
  id: string;
  sessionId: string;
  userId: string;
  overallScore: {
    overall: number;
    technical: number;
    communication: number;
    problemSolving: number;
    depth: number;
  };
  totalQuestions: number;
  answeredQuestions: number;
  durationSeconds: number;
  strengths: string[];
  areasToImprove: string[];
  learningRoadmap: Array<{
    step: number;
    topic: string;
    action: string;
    resource: string;
  }>;
  createdAt: string;
}
