import { apiClient } from '../lib/axios';

export type InterviewType = 'TECHNICAL' | 'BEHAVIORAL' | 'SYSTEM_DESIGN' | 'CODING' | 'MIXED';
export type Difficulty = 'EASY' | 'MEDIUM' | 'HARD';
export type InterviewStatus = 'PENDING' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED';

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

export const interviewsService = {
  async createSession(dto: CreateInterviewSessionDto): Promise<InterviewSession> {
    const { data } = await apiClient.post<InterviewSession>('/interviews', dto);
    return data;
  },

  async getSessions(): Promise<InterviewSession[]> {
    const { data } = await apiClient.get<InterviewSession[]>('/interviews');
    return data;
  },

  async getSession(id: string): Promise<InterviewSession> {
    const { data } = await apiClient.get<InterviewSession>(`/interviews/${id}`);
    return data;
  },

  async getCurrentQuestion(id: string) {
    const { data } = await apiClient.get(`/interviews/${id}/questions/current`);
    return data;
  },

  async submitAnswer(sessionId: string, questionId: string, userAnswer: string): Promise<SubmitAnswerResponse> {
    const { data } = await apiClient.post<SubmitAnswerResponse>(`/interviews/${sessionId}/answers`, {
      questionId,
      userAnswer,
    });
    return data;
  },
};
