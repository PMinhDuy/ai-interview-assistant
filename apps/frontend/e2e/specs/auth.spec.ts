import { test, expect } from '../fixtures/test-fixtures';
import { LoginPage } from '../page-objects/LoginPage';

test.describe('Authentication Flow', () => {
  // Use unauthenticated context for login test cases
  test.use({ storageState: { cookies: [], origins: [] } });

  test('should render login page with input fields and title', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();

    await expect(page.getByRole('heading', { name: 'AI Interview Assistant' })).toBeVisible();
    await expect(loginPage.emailInput).toBeVisible();
    await expect(loginPage.passwordInput).toBeVisible();
    await expect(loginPage.submitButton).toBeVisible();
  });

  test('should show validation messages when submitting empty form', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();

    await loginPage.submitButton.click();

    await expect(page.getByText('Please enter your email address')).toBeVisible();
    await expect(page.getByText('Please enter your password')).toBeVisible();
  });

  test('should display error message on invalid credentials', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();

    await loginPage.login('candidate@example.com', 'WrongPassword123!');

    await loginPage.expectErrorMessage(/Invalid email or password/i);
  });

  test('should log in successfully and redirect to dashboard', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();

    await loginPage.login('candidate@example.com', 'SecurePassword123!');

    await loginPage.expectRedirectToDashboard();
    await expect(page.getByRole('heading', { level: 2, name: /Welcome back/i })).toBeVisible();
  });
});
