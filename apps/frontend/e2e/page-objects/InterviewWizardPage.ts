import { type Page, type Locator, expect } from '@playwright/test';

export type InterviewTypeOptionTitle =
  | 'Technical Core'
  | 'Behavioral & HR'
  | 'System Design'
  | 'Coding & Algorithms'
  | 'Comprehensive Mixed';

export type DifficultyOption = 'Easy' | 'Medium' | 'Hard';

export class InterviewWizardPage {
  readonly page: Page;
  readonly pageTitle: Locator;
  readonly stepsContainer: Locator;
  readonly nextButton: Locator;
  readonly prevButton: Locator;
  readonly startInterviewButton: Locator;
  readonly questionCountInput: Locator;
  readonly resumeSelect: Locator;
  readonly jobDescriptionSelect: Locator;
  readonly reviewCard: Locator;

  constructor(page: Page) {
    this.page = page;
    this.pageTitle = page.getByRole('heading', { level: 2, name: 'Create New Interview Session' });
    this.stepsContainer = page.locator('.ant-steps');
    this.nextButton = page.getByRole('button', { name: /Next/i });
    this.prevButton = page.getByRole('button', { name: /Previous/i });
    this.startInterviewButton = page.getByRole('button', { name: 'Start Interview' });
    this.questionCountInput = page.getByRole('spinbutton');
    this.resumeSelect = page.locator('div').filter({ hasText: /^Candidate Resume:/ }).locator('.ant-select');
    this.jobDescriptionSelect = page.locator('div').filter({ hasText: /^Target Job Description:/ }).locator('.ant-select');
    this.reviewCard = page.locator('.ant-card.ant-card-bordered').filter({ hasText: 'Interview Focus:' });
  }

  async goto() {
    await this.page.goto('/interviews/new');
    await expect(this.pageTitle).toBeVisible();
  }

  getTypeCard(typeName: InterviewTypeOptionTitle): Locator {
    return this.page.locator('.ant-card-hoverable').filter({ hasText: typeName });
  }

  async selectType(typeName: InterviewTypeOptionTitle) {
    await this.page.getByText(typeName, { exact: true }).click();
  }

  async selectDifficulty(diffName: DifficultyOption) {
    await this.page.getByText(new RegExp(`^${diffName}`, 'i')).click();
  }

  async setQuestionCount(count: number) {
    await this.questionCountInput.fill(count.toString());
  }

  async selectResume(resumeName: string) {
    await this.resumeSelect.click();
    const dropdown = this.page.locator('.ant-select-dropdown:not(.ant-select-dropdown-hidden)');
    await dropdown.getByText(resumeName).click();
  }

  async clearResume() {
    await this.resumeSelect.hover();
    const clearButton = this.resumeSelect.locator('.ant-select-clear');
    if (await clearButton.isVisible()) {
      await clearButton.click();
    }
  }

  async selectJobDescription(jdName: string) {
    await this.jobDescriptionSelect.click();
    const dropdown = this.page.locator('.ant-select-dropdown:not(.ant-select-dropdown-hidden)');
    await dropdown.getByText(jdName).click();
  }

  async clearJobDescription() {
    await this.jobDescriptionSelect.hover();
    const clearButton = this.jobDescriptionSelect.locator('.ant-select-clear');
    if (await clearButton.isVisible()) {
      await clearButton.click();
    }
  }

  async clickNext() {
    await this.nextButton.click();
  }

  async clickPrevious() {
    await this.prevButton.click();
  }

  async submitAndStart() {
    await this.startInterviewButton.click();
  }
}
