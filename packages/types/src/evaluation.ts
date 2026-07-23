// ── Evaluation types ─────────────────────────────────────────

export type EvaluationScore = {
  overall: number; // 0-100
  technical: number;
  communication: number;
  problemSolving: number;
  depth: number;
};

export type Evaluation = {
  id: string;
  sessionId: string;
  questionId: string;
  userAnswer: string;
  score: EvaluationScore;
  feedback: string;
  strengths: string[];
  improvements: string[];
  suggestedAnswer?: string;
  complexity?: ComplexityAnalysis;
  createdAt: string;
};

export type ComplexityAnalysis = {
  timeComplexity: string;
  spaceComplexity: string;
  explanation: string;
  betterApproach?: string;
};

export type SessionReport = {
  sessionId: string;
  userId: string;
  overallScore: EvaluationScore;
  totalQuestions: number;
  answeredQuestions: number;
  duration: number; // seconds
  strengths: string[];
  areasToImprove: string[];
  learningRoadmap: LearningResource[];
  generatedAt: string;
};

export type LearningResource = {
  skill: string;
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  resources: string[];
  estimatedTime: string;
};
