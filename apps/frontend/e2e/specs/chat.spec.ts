import { test, expect } from '../fixtures/test-fixtures';
import { ChatPage } from '../page-objects/ChatPage';

test.describe('AI Chat Assistant Flow', () => {
  test('should display chat assistant, conversation history, and allow sending messages', async ({ page }) => {
    const chatPage = new ChatPage(page);
    await chatPage.goto();

    // Select existing conversation from sidebar
    await page.getByText('System Design Prep').click();
    await expect(page.getByText('What is CAP theorem?')).toBeVisible();

    // Send a new query
    const testMessage = 'Can you explain the event loop in Node.js?';
    await chatPage.sendMessage(testMessage);

    // Verify user message appears in chat area
    await expect(page.getByText(testMessage, { exact: true })).toBeVisible();

    // Verify mocked AI response appears
    await expect(page.getByText(/I received your message/i)).toBeVisible();
  });
});
