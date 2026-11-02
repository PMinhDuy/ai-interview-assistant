import { test as setup, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';
import { STORAGE_STATE_PATH } from '../../playwright.config';
import { setupApiMocks } from '../fixtures/test-fixtures';

setup('authenticate user and persist session', async ({ page }) => {
  // Ensure the .auth directory exists
  const authDir = path.dirname(STORAGE_STATE_PATH);
  if (!fs.existsSync(authDir)) {
    fs.mkdirSync(authDir, { recursive: true });
  }

  // Attach API mocks so login succeeds cleanly
  await setupApiMocks(page);

  // Navigate to login page
  await page.goto('/login');
  await expect(page).toHaveURL(/.*login/);

  // Fill credentials
  await page.getByPlaceholder('Email address').fill('candidate@example.com');
  await page.getByPlaceholder('Password').fill('SecurePassword123!');

  // Submit login form
  await page.getByRole('button', { name: 'Sign In' }).click();

  // Expect redirect to dashboard
  await page.waitForURL('**/dashboard', { timeout: 15000 });
  await expect(page.getByRole('heading', { level: 2, name: /Welcome back/i })).toBeVisible();

  // Save authenticated state (localStorage + cookies) to user.json
  await page.context().storageState({ path: STORAGE_STATE_PATH });
});
