import { type Page, type Locator, expect } from '@playwright/test';

export class InterviewWizardPage {
  readonly page: Page;
  readonly pageTitle: Locator;
  readonly nextButton: Locator;
  readonly prevButton: Locator;
  readonly startInterviewButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.pageTitle = page.getByRole('heading', { level: 2, name: 'Create New Interview Session' });
    this.nextButton = page.getByRole('button', { name: /Next/i });
    this.prevButton = page.getByRole('button', { name: /Previous/i });
    this.startInterviewButton = page.getByRole('button', { name: 'Start Interview' });
  }

  async goto() {
    await this.page.goto('/interviews/new');
    await expect(this.pageTitle).toBeVisible();
  }

  async selectType(typeName: 'Technical Core' | 'Behavioral & HR' | 'System Design') {
    await this.page.getByText(typeName).click();
  }

  async selectDifficulty(diffName: 'Easy' | 'Medium' | 'Hard') {
    await this.page.getByText(new RegExp(`^${diffName}`, 'i')).click();
  }

  async clickNext() {
    await this.nextButton.click();
  }

  async submitAndStart() {
    await this.startInterviewButton.click();
  }
}
