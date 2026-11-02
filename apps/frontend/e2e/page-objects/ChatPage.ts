import { type Page, type Locator, expect } from '@playwright/test';

export class ChatPage {
  readonly page: Page;
  readonly chatInput: Locator;
  readonly sendButton: Locator;
  readonly newChatButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.chatInput = page.getByPlaceholder(/Type your message/i);
    this.sendButton = page.getByRole('button', { name: 'Send' });
    this.newChatButton = page.getByRole('button', { name: 'New' });
  }

  async goto() {
    await this.page.goto('/chat');
    await expect(this.chatInput).toBeVisible();
  }

  async sendMessage(messageText: string) {
    await this.chatInput.fill(messageText);
    await this.sendButton.click();
  }

  async expectMessagePresent(text: string) {
    await expect(this.page.getByText(text)).toBeVisible();
  }

  async startNewChat() {
    await this.newChatButton.click();
  }
}
