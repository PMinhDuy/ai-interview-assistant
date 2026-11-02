import { type Page, type Locator, expect } from '@playwright/test';

export class DashboardPage {
  readonly page: Page;
  readonly welcomeHeading: Locator;
  readonly startNewInterviewButton: Locator;
  readonly totalSessionsCard: Locator;
  readonly completedSessionsCard: Locator;
  readonly sessionsTable: Locator;

  constructor(page: Page) {
    this.page = page;
    this.welcomeHeading = page.getByRole('heading', { level: 2, name: /Welcome back/i });
    this.startNewInterviewButton = page.getByRole('button', { name: 'Start New Interview' });
    this.totalSessionsCard = page.getByText('Total Sessions');
    this.completedSessionsCard = page.getByText('Completed Sessions');
    this.sessionsTable = page.getByText('Interview Sessions History');
  }

  async goto() {
    await this.page.goto('/dashboard');
    await expect(this.welcomeHeading).toBeVisible();
  }

  async expectMetricsVisible() {
    await expect(this.totalSessionsCard).toBeVisible();
    await expect(this.completedSessionsCard).toBeVisible();
    await expect(this.sessionsTable).toBeVisible();
  }

  async clickStartNewInterview() {
    await this.startNewInterviewButton.click();
    await this.page.waitForURL('**/interviews/new');
  }
}
