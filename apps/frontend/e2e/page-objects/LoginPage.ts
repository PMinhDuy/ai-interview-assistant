import { type Page, type Locator, expect } from '@playwright/test';

export class LoginPage {
  readonly page: Page;
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly submitButton: Locator;
  readonly alertError: Locator;
  readonly signUpLink: Locator;

  constructor(page: Page) {
    this.page = page;
    this.emailInput = page.getByPlaceholder('Email address');
    this.passwordInput = page.getByPlaceholder('Password');
    this.submitButton = page.getByRole('button', { name: 'Sign In' });
    this.alertError = page.locator('.ant-alert-error');
    this.signUpLink = page.getByRole('link', { name: 'Sign up now' });
  }

  async goto() {
    await this.page.goto('/login');
    await expect(this.page).toHaveURL(/.*login/);
  }

  async login(email: string, password?: string) {
    await this.emailInput.fill(email);
    if (password) {
      await this.passwordInput.fill(password);
    }
    await this.submitButton.click();
  }

  async expectErrorMessage(message: string | RegExp) {
    await expect(this.alertError).toBeVisible();
    await expect(this.alertError).toContainText(message);
  }

  async expectRedirectToDashboard() {
    await this.page.waitForURL('**/dashboard', { timeout: 15000 });
  }
}
