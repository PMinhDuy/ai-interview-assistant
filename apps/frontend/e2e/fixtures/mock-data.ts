import type {
  InterviewSession,
  SubmitAnswerResponse,
  CurrentQuestionResponse,
} from '@/features/interviews';
import type { User, AuthResponse } from '@/features/auth';
import type { ResumeItem, JobDescriptionItem } from '@/features/files';
import type { ConversationItem, ChatMessage } from '@/features/chat';
import type { PromptTemplateItem } from '@/features/prompts';

export const mockUser: User = {
  id: 'usr_test_123',
  email: 'candidate@example.com',
  firstName: 'Alex',
  lastName: 'Nguyen',
  role: 'USER',
  createdAt: '2026-01-15T08:00:00.000Z',
};

export const mockAuthResponse: AuthResponse = {
  user: mockUser,
  tokens: {
    accessToken: 'e2e-mock-access-token-valid-jwt',
    refreshToken: 'e2e-mock-refresh-token-valid-jwt',
  },
};

export const mockSessions: InterviewSession[] = [
  {
    id: 'session-101',
    userId: 'usr_test_123',
    type: 'TECHNICAL',
    difficulty: 'MEDIUM',
    status: 'COMPLETED',
    currentQuestionIndex: 5,
    totalQuestions: 5,
    createdAt: '2026-10-25T09:30:00.000Z',
  },
  {
    id: 'session-102',
    userId: 'usr_test_123',
    type: 'SYSTEM_DESIGN',
    difficulty: 'HARD',
    status: 'ACTIVE',
    currentQuestionIndex: 2,
    totalQuestions: 5,
    createdAt: '2026-10-28T14:15:00.000Z',
  },
];

export const mockCurrentQuestion: CurrentQuestionResponse = {
  question: {
    id: 'q-101',
    sessionId: 'session-102',
    category: 'SYSTEM_DESIGN',
    difficulty: 'HARD',
    content: 'How would you design a distributed rate limiter for multi-region microservices?',
    hints: ['Consider Token Bucket vs Leaky Bucket algorithms', 'Think about Redis cluster consistency'],
  },
  currentIndex: 0,
  totalQuestions: 5,
  completed: false,
};

export const mockSubmitAnswerResponse: SubmitAnswerResponse = {
  success: true,
  questionId: 'q-101',
  userAnswer: 'I would use Redis with a sliding window counter using Redis sorted sets (ZSET)...',
  answeredAt: '2026-10-30T10:00:00.000Z',
  evaluation: {
    id: 'eval-101',
    scores: {
      overall: 88,
      technical: 90,
      communication: 85,
      problemSolving: 88,
      depth: 89,
    },
    feedback: 'Solid explanation of Redis sliding window counter and concurrency handling.',
    strengths: ['Accurate data structure selection (ZSET)', 'Clear trade-off considerations'],
    improvements: ['Could elaborate more on Redis cluster synchronization across multi-regions'],
    suggestedAnswer: 'A hybrid approach using local in-memory token bucket + central Redis synchronization.',
  },
  next: {
    completed: false,
    currentIndex: 3,
    totalQuestions: 5,
  },
};

export const mockResumes: ResumeItem[] = [
  {
    id: 'res-1',
    userId: 'usr_test_123',
    originalName: 'Senior_Fullstack_Engineer_Resume.pdf',
    fileSize: 145000,
    extractedText: 'Senior Fullstack Engineer with 5+ years experience in React, Next.js, and NestJS.',
    createdAt: '2026-10-20T10:00:00.000Z',
  },
];

export const mockJobDescriptions: JobDescriptionItem[] = [
  {
    id: 'jd-1',
    userId: 'usr_test_123',
    originalName: 'Staff_Software_Engineer_JD.docx',
    fileSize: 85000,
    extractedText: 'Looking for a Staff Engineer to lead high-throughput microservice architecture.',
    createdAt: '2026-10-21T11:00:00.000Z',
  },
];

export const mockConversations: ConversationItem[] = [
  {
    id: 'conv-1',
    userId: 'usr_test_123',
    title: 'System Design Prep',
    createdAt: '2026-10-29T08:00:00.000Z',
    updatedAt: '2026-10-29T08:30:00.000Z',
    messages: [
      {
        id: 'msg-1',
        conversationId: 'conv-1',
        role: 'user',
        content: 'What is CAP theorem?',
        createdAt: '2026-10-29T08:01:00.000Z',
      },
      {
        id: 'msg-2',
        conversationId: 'conv-1',
        role: 'assistant',
        content: 'The CAP theorem states that a distributed data store can only guarantee at most two out of: Consistency, Availability, and Partition Tolerance.',
        createdAt: '2026-10-29T08:01:05.000Z',
      },
    ],
  },
];

export const mockPrompts: PromptTemplateItem[] = [
  {
    id: 'prompt-1',
    name: 'interview_question_generator',
    version: 1,
    template: 'You are an interviewer. Generate {{totalQuestions}} questions for {{role}}.',
    description: 'Generates mock interview questions',
    variables: ['totalQuestions', 'role'],
    isActive: true,
    createdAt: '2026-10-10T00:00:00.000Z',
  },
];
