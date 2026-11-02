import { test, expect } from '../fixtures/test-fixtures';
import { InterviewWizardPage } from '../page-objects/InterviewWizardPage';

test.describe('Interview Creation Wizard Flow', () => {
  test('should step through wizard and create an interview session', async ({ page }) => {
    const wizardPage = new InterviewWizardPage(page);
    await wizardPage.goto();

    // Step 1: Select Domain & Type
    await expect(page.getByText('Select Interview Domain & Type')).toBeVisible();
    await wizardPage.selectType('Technical Core');
    await wizardPage.clickNext();

    // Step 2: Set Difficulty & Question Count
    await expect(page.getByText('Set Difficulty & Question Count')).toBeVisible();
    await wizardPage.selectDifficulty('Medium');
    await wizardPage.clickNext();

    // Step 3: Link Resume & JD
    await expect(page.getByText('Attach Resume & Job Description (Optional)')).toBeVisible();
    await wizardPage.clickNext();

    // Step 4: Review & Start
    await expect(page.getByText('Review Session Settings')).toBeVisible();
    await expect(page.getByText('Ready to start!')).toBeVisible();

    await wizardPage.submitAndStart();

    // Expect navigation to active interview screen
    await page.waitForURL(/\/interviews\/(?!new)/, { timeout: 15000 });
    await expect(page.getByText(/Question \d+ of 5/)).toBeVisible({ timeout: 10000 });
    await expect(page.getByRole('heading', { level: 3 })).toBeVisible();
  });
});
