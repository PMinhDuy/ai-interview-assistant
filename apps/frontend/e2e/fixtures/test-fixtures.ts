import { test as base, type Page } from '@playwright/test';
import {
  mockUser,
  mockAuthResponse,
  mockSessions,
  mockCurrentQuestion,
  mockSubmitAnswerResponse,
  mockResumes,
  mockJobDescriptions,
  mockConversations,
  mockPrompts,
} from './mock-data';

import type { InterviewSession } from '@/features/interviews';
import type { ChatMessage } from '@/features/chat';

export interface MockApiOptions {
  user?: typeof mockUser;
  sessions?: typeof mockSessions;
  conversations?: typeof mockConversations;
  resumes?: typeof mockResumes;
  jobDescriptions?: typeof mockJobDescriptions;
}

/**
 * Attaches route interceptors to mock backend REST endpoints.
 * All responses wrap data in the standard `{ success: true, data: ... }` envelope.
 */
export async function setupApiMocks(page: Page, options: MockApiOptions = {}) {
  const user = options.user || mockUser;
  const sessions = options.sessions || [...mockSessions];
  const conversations = options.conversations || [...mockConversations];
  const resumes = options.resumes || [...mockResumes];
  const jobDescriptions = options.jobDescriptions || [...mockJobDescriptions];

  // Helper to respond with JSON envelope
  const jsonResponse = (data: unknown, status = 200) => ({
    status,
    contentType: 'application/json',
    body: JSON.stringify({
      success: status >= 200 && status < 300,
      data,
      timestamp: new Date().toISOString(),
    }),
  });

  // 1. Auth routes
  await page.route('**/api/v1/auth/login', async (route) => {
    const postData = route.request().postDataJSON() as { email?: string; password?: string } | null;
    if (postData?.password === 'WrongPassword123!') {
      return route.fulfill({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify({
          success: false,
          error: 'Unauthorized',
          message: 'Invalid email or password',
          statusCode: 401,
          timestamp: new Date().toISOString(),
        }),
      });
    }
    return route.fulfill(jsonResponse(mockAuthResponse));
  });

  await page.route('**/api/v1/auth/register', async (route) => {
    return route.fulfill(jsonResponse(mockAuthResponse));
  });

  await page.route('**/api/v1/auth/me', async (route) => {
    return route.fulfill(jsonResponse(user));
  });

  await page.route('**/api/v1/auth/logout', async (route) => {
    return route.fulfill(jsonResponse({ message: 'Logged out successfully' }));
  });

  // 2. Interviews routes
  await page.route('**/api/v1/interviews/*/questions/current', async (route) => {
    return route.fulfill(jsonResponse(mockCurrentQuestion));
  });

  await page.route('**/api/v1/interviews/*/answers', async (route) => {
    return route.fulfill(jsonResponse(mockSubmitAnswerResponse));
  });

  await page.route('**/api/v1/interviews/*', async (route) => {
    if (route.request().method() === 'GET') {
      const url = route.request().url();
      const id = url.split('/interviews/')[1]?.split('?')[0];
      const found = sessions.find((s) => s.id === id) || sessions[0];
      return route.fulfill(jsonResponse(found));
    }
    return route.continue();
  });

  await page.route('**/api/v1/interviews', async (route) => {
    if (route.request().method() === 'GET') {
      return route.fulfill(jsonResponse(sessions));
    }
    if (route.request().method() === 'POST') {
      const newSession: InterviewSession = {
        id: 'session',
        userId: user.id,
        type: 'TECHNICAL',
        difficulty: 'MEDIUM',
        status: 'PENDING',
        currentQuestionIndex: 0,
        totalQuestions: 5,
        createdAt: new Date().toISOString(),
      };
      sessions.unshift(newSession);
      return route.fulfill(jsonResponse(newSession, 201));
    }
    return route.continue();
  });

  // 3. Evaluations / Reports
  await page.route('**/api/v1/evaluations/sessions/*/report', async (route) => {
    return route.fulfill(
      jsonResponse({
        id: 'rep-101',
        sessionId: 'session-101',
        userId: user.id,
        overallScore: {
          overall: 88,
          technical: 90,
          communication: 85,
          problemSolving: 88,
          depth: 89,
        },
        totalQuestions: 5,
        answeredQuestions: 5,
        durationSeconds: 940,
        strengths: ['Strong React 19 knowledge', 'Clean architecture understanding'],
        areasToImprove: ['Deep dive into distributed cache invalidation'],
        learningRoadmap: [
          {
            step: 1,
            topic: 'Distributed Systems',
            action: 'Review Raft consensus and Redis cluster partitioning',
            resource: 'Designing Data-Intensive Applications',
          },
        ],
        createdAt: new Date().toISOString(),
      }),
    );
  });

  await page.route('**/api/v1/evaluations/sessions/*', async (route) => {
    return route.fulfill(jsonResponse([]));
  });

  // 4. Files routes
  await page.route('**/api/v1/resumes*', async (route) => {
    if (route.request().method() === 'GET') {
      return route.fulfill(jsonResponse(resumes));
    }
    if (route.request().method() === 'DELETE') {
      return route.fulfill(jsonResponse({ message: 'Deleted' }));
    }
    return route.continue();
  });

  await page.route('**/api/v1/job-descriptions*', async (route) => {
    if (route.request().method() === 'GET') {
      return route.fulfill(jsonResponse(jobDescriptions));
    }
    if (route.request().method() === 'DELETE') {
      return route.fulfill(jsonResponse({ message: 'Deleted' }));
    }
    return route.continue();
  });

  // 5. Chat routes
  await page.route('**/api/v1/chat/conversations', async (route) => {
    return route.fulfill(jsonResponse(conversations));
  });

  await page.route('**/api/v1/chat/conversation/*', async (route) => {
    if (route.request().method() === 'GET') {
      return route.fulfill(jsonResponse(conversations[0]));
    }
    if (route.request().method() === 'DELETE') {
      return route.fulfill(jsonResponse({ message: 'Conversation deleted' }));
    }
    return route.continue();
  });

  await page.route('**/api/v1/chat/conversation', async (route) => {
    if (route.request().method() === 'POST') {
      const newConv = {
        id: `conv-new-${Date.now()}`,
        userId: user.id,
        title: 'New Chat Session',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        messages: [],
      };
      conversations.unshift(newConv);
      return route.fulfill(jsonResponse(newConv, 201));
    }
    return route.continue();
  });

  await page.route('**/api/v1/chat/message', async (route) => {
    const postData = route.request().postDataJSON() as { conversationId: string; content: string } | null;
    const convId = postData?.conversationId || 'conv-1';
    const userMessage: ChatMessage = {
      id: `msg-user-${Date.now()}`,
      conversationId: convId,
      role: 'user',
      content: postData?.content || '',
      createdAt: new Date().toISOString(),
    };
    const replyMessage: ChatMessage = {
      id: `msg-ai-${Date.now()}`,
      conversationId: convId,
      role: 'assistant',
      content: `I received your message: "${postData?.content}". How can I help you practice further?`,
      createdAt: new Date().toISOString(),
    };

    const targetConv = conversations.find((c) => c.id === convId) || conversations[0];
    if (targetConv) {
      targetConv.messages = targetConv.messages || [];
      targetConv.messages.push(userMessage, replyMessage);
    }

    return route.fulfill(jsonResponse(replyMessage, 201));
  });

  // 6. Prompts (admin)
  await page.route('**/api/v1/prompts*', async (route) => {
    return route.fulfill(jsonResponse(mockPrompts));
  });
}

/**
 * Custom Playwright test fixture that automatically sets up API route mocks for every test
 */
export const test = base.extend<{
  mockApi: (options?: MockApiOptions) => Promise<void>;
}>({
  mockApi: [
    async ({ page }, use) => {
      await setupApiMocks(page);
      const fn = async (options?: MockApiOptions) => {
        await setupApiMocks(page, options);
      };
      await use(fn);
    },
    { auto: true },
  ],
});

export { expect } from '@playwright/test';
