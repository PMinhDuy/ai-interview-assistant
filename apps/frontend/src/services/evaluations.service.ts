import { apiClient } from '../lib/axios';

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

export const evaluationsService = {
  async getEvaluationsBySession(sessionId: string): Promise<EvaluationItem[]> {
    const { data } = await apiClient.get<EvaluationItem[]>(`/evaluations/sessions/${sessionId}`);
    return data;
  },

  async getSessionReport(sessionId: string): Promise<SessionReportItem> {
    const { data } = await apiClient.get<SessionReportItem>(`/evaluations/sessions/${sessionId}/report`);
    return data;
  },

  async getEvaluationById(id: string): Promise<EvaluationItem> {
    const { data } = await apiClient.get<EvaluationItem>(`/evaluations/${id}`);
    return data;
  },
};
