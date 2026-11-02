import { test, expect } from '../fixtures/test-fixtures';
import { InterviewWizardPage, type InterviewTypeOptionTitle } from '../page-objects/InterviewWizardPage';
import { mockResumes, mockJobDescriptions } from '../fixtures/mock-data';

test.describe('Interviews New Page - Comprehensive E2E Automation Suite', () => {
  test('Case 1: should render default step state, wizard steps, and disabled previous button', async ({ page }) => {
    const wizardPage = new InterviewWizardPage(page);
    await wizardPage.goto();

    // Verify 4 steps in Steps header
    await expect(wizardPage.stepsContainer.getByText('Interview Type')).toBeVisible();
    await expect(wizardPage.stepsContainer.getByText('Difficulty & Count')).toBeVisible();
    await expect(wizardPage.stepsContainer.getByText('Resume & JD Context')).toBeVisible();
    await expect(wizardPage.stepsContainer.getByText('Review & Start')).toBeVisible();

    // Verify step title
    await expect(page.getByText('Select Interview Domain & Type')).toBeVisible();

    // Verify Previous button is disabled on step 1
    await expect(wizardPage.prevButton).toBeDisabled();
    await expect(wizardPage.nextButton).toBeEnabled();

    // Verify default selected type is 'Technical Core' (has selected background styling)
    const technicalCard = wizardPage.getTypeCard('Technical Core');
    await expect(technicalCard).toHaveCSS('background-color', 'rgb(230, 244, 255)');
  });

  test('Case 2: should allow selecting each of the 5 interview domain types', async ({ page }) => {
    const wizardPage = new InterviewWizardPage(page);
    await wizardPage.goto();

    const types: InterviewTypeOptionTitle[] = [
      'Behavioral & HR',
      'System Design',
      'Coding & Algorithms',
      'Comprehensive Mixed',
      'Technical Core',
    ];

    for (const typeName of types) {
      await wizardPage.selectType(typeName);
      const card = wizardPage.getTypeCard(typeName);
      await expect(card).toHaveCSS('background-color', 'rgb(230, 244, 255)');
    }
  });

  test('Case 3: should configure difficulty and question count boundary values', async ({ page }) => {
    const wizardPage = new InterviewWizardPage(page);
    await wizardPage.goto();
    await wizardPage.clickNext();

    // Step 2 header
    await expect(page.getByText('Set Difficulty & Question Count')).toBeVisible();

    // Test difficulty selection
    await wizardPage.selectDifficulty('Hard');
    const hardRadio = page.locator('label.ant-radio-button-wrapper').filter({ hasText: /Hard/i });
    await expect(hardRadio).toHaveClass(/ant-radio-button-wrapper-checked/);

    // Test question count boundary
    await expect(wizardPage.questionCountInput).toHaveValue('5');

    // Min boundary
    await wizardPage.setQuestionCount(3);
    await expect(wizardPage.questionCountInput).toHaveValue('3');

    // Max boundary
    await wizardPage.setQuestionCount(15);
    await expect(wizardPage.questionCountInput).toHaveValue('15');

    // Set to valid middle value
    await wizardPage.setQuestionCount(7);
    await expect(wizardPage.questionCountInput).toHaveValue('7');
  });

  test('Case 4: should select and clear Resume and Job Description options', async ({ page }) => {
    const wizardPage = new InterviewWizardPage(page);
    await wizardPage.goto();
    await wizardPage.clickNext(); // Step 2
    await wizardPage.clickNext(); // Step 3

    await expect(page.getByText('Attach Resume & Job Description (Optional)')).toBeVisible();

    const resumeName = mockResumes[0]?.originalName ?? 'Senior_Software_Engineer_Resume.pdf';
    const jdName = mockJobDescriptions[0]?.originalName ?? 'Senior_Backend_Engineer_JD.pdf';

    // Select Resume
    await wizardPage.selectResume(resumeName);
    await expect(wizardPage.resumeSelect).toContainText(resumeName);

    // Select Job Description
    await wizardPage.selectJobDescription(jdName);
    await expect(wizardPage.jobDescriptionSelect).toContainText(jdName);

    // Clear Resume
    await wizardPage.clearResume();
    await expect(wizardPage.resumeSelect).not.toContainText(resumeName);

    // Reselect Resume for forward flow
    await wizardPage.selectResume(resumeName);
    await expect(wizardPage.resumeSelect).toContainText(resumeName);
  });

  test('Case 5: should preserve user choices across backward and forward step navigation', async ({ page }) => {
    const wizardPage = new InterviewWizardPage(page);
    await wizardPage.goto();

    // Step 1: Select Coding & Algorithms
    await wizardPage.selectType('Coding & Algorithms');
    await wizardPage.clickNext();

    // Step 2: Select Hard & 8 questions
    await wizardPage.selectDifficulty('Hard');
    await wizardPage.setQuestionCount(8);
    await wizardPage.clickNext();

    // Step 3: Select Resume
    const resumeName = mockResumes[0]?.originalName ?? 'Senior_Software_Engineer_Resume.pdf';
    await wizardPage.selectResume(resumeName);
    await wizardPage.clickNext();

    // Step 4: Verify Review Card has all selections
    await expect(wizardPage.reviewCard).toContainText('CODING');
    await expect(wizardPage.reviewCard).toContainText('HARD');
    await expect(wizardPage.reviewCard).toContainText('8 Questions');
    await expect(wizardPage.reviewCard).toContainText(resumeName);

    // Navigate backwards to Step 1
    await wizardPage.clickPrevious(); // Back to Step 3
    await expect(wizardPage.resumeSelect).toContainText(resumeName);

    await wizardPage.clickPrevious(); // Back to Step 2
    const hardRadio = page.locator('label.ant-radio-button-wrapper').filter({ hasText: /Hard/i });
    await expect(hardRadio).toHaveClass(/ant-radio-button-wrapper-checked/);
    await expect(wizardPage.questionCountInput).toHaveValue('8');

    await wizardPage.clickPrevious(); // Back to Step 1
    const codingCard = wizardPage.getTypeCard('Coding & Algorithms');
    await expect(codingCard).toHaveCSS('background-color', 'rgb(230, 244, 255)');

    // Navigate forward back to Step 4
    await wizardPage.clickNext(); // Step 2
    await wizardPage.clickNext(); // Step 3
    await wizardPage.clickNext(); // Step 4
    await expect(wizardPage.reviewCard).toContainText('CODING');
  });

  test('Case 6: should display accurate review card summary before submission', async ({ page }) => {
    const wizardPage = new InterviewWizardPage(page);
    await wizardPage.goto();

    await wizardPage.selectType('System Design');
    await wizardPage.clickNext();

    await wizardPage.selectDifficulty('Easy');
    await wizardPage.setQuestionCount(6);
    await wizardPage.clickNext();

    const resumeName = mockResumes[0]?.originalName ?? 'Senior_Software_Engineer_Resume.pdf';
    const jdName = mockJobDescriptions[0]?.originalName ?? 'Senior_Backend_Engineer_JD.pdf';
    await wizardPage.selectResume(resumeName);
    await wizardPage.selectJobDescription(jdName);
    await wizardPage.clickNext();

    // Review Summary verification
    await expect(page.getByText('Review Session Settings')).toBeVisible();
    await expect(wizardPage.reviewCard).toContainText('SYSTEM_DESIGN');
    await expect(wizardPage.reviewCard).toContainText('EASY');
    await expect(wizardPage.reviewCard).toContainText('6 Questions');
    await expect(wizardPage.reviewCard).toContainText(resumeName);
    await expect(wizardPage.reviewCard).toContainText(jdName);

    // Verify readiness alert and start button
    await expect(page.getByText('Ready to start!')).toBeVisible();
    await expect(wizardPage.startInterviewButton).toBeEnabled();
  });

  test('Case 7: should successfully submit interview session and navigate to active interview view', async ({ page }) => {
    const wizardPage = new InterviewWizardPage(page);
    await wizardPage.goto();

    await wizardPage.selectType('Technical Core');
    await wizardPage.clickNext();

    await expect(page.getByText('Set Difficulty & Question Count')).toBeVisible();
    await wizardPage.selectDifficulty('Medium');
    await wizardPage.clickNext();

    await expect(page.getByText('Attach Resume & Job Description (Optional)')).toBeVisible();
    await wizardPage.clickNext(); // Step 3 (skip files)

    await expect(page.getByText('Review Session Settings')).toBeVisible();
    await expect(page.getByText('Ready to start!')).toBeVisible();

    // Step 4: Submit
    await wizardPage.submitAndStart();

    // Expect navigation to active interview screen
    await page.waitForURL(/\/interviews\/(?!new)/, { timeout: 15000 });
    await expect(page.getByText(/Question \d+ of 5/)).toBeVisible({ timeout: 10000 });
  });

  test('Case 8: should handle API errors gracefully during session creation without crashing UI', async ({ page }) => {
    // Override route for session creation failure (intercepts POST **/api/v1/interviews)
    await page.route('**/api/v1/interviews', async (route) => {
      if (route.request().method() === 'POST') {
        return route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({
            statusCode: 500,
            message: 'Simulated LLM service unavailable. Please try again.',
          }),
        });
      }
      return route.continue();
    });

    const wizardPage = new InterviewWizardPage(page);
    await wizardPage.goto();

    await wizardPage.clickNext(); // Step 2
    await expect(page.getByText('Set Difficulty & Question Count')).toBeVisible();
    await wizardPage.clickNext(); // Step 3
    await expect(page.getByText('Attach Resume & Job Description (Optional)')).toBeVisible();
    await wizardPage.clickNext(); // Step 4
    await expect(page.getByText('Review Session Settings')).toBeVisible();

    // Submit session with mocked 500 failure
    await wizardPage.submitAndStart();

    // Expect error toast notification from extractApiErrorMessage
    await expect(
      page.getByText(/Simulated LLM service unavailable|Failed to create interview session/i)
    ).toBeVisible();

    // Verify UI did not crash and user stays on Review page
    await expect(page.getByText('Review Session Settings')).toBeVisible();
    await expect(wizardPage.startInterviewButton).toBeEnabled();
  });
});
