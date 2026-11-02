import { test, expect } from '../fixtures/test-fixtures';
import { DashboardPage } from '../page-objects/DashboardPage';

test.describe('Dashboard & Navigation Flow', () => {
  test('should display dashboard overview, user greeting, and metrics', async ({ page }) => {
    const dashboardPage = new DashboardPage(page);
    await dashboardPage.goto();

    await expect(dashboardPage.welcomeHeading).toBeVisible();
    await dashboardPage.expectMetricsVisible();

    // Check table headers
    await expect(page.getByRole('columnheader', { name: 'Interview Type' })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: 'Difficulty' })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: 'Progress' })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: 'Status' })).toBeVisible();
  });

  test('should navigate to interview creation wizard when clicking CTA button', async ({ page }) => {
    const dashboardPage = new DashboardPage(page);
    await dashboardPage.goto();

    await dashboardPage.clickStartNewInterview();
    await expect(page).toHaveURL(/.*interviews\/new/);
    await expect(page.getByRole('heading', { level: 2, name: 'Create New Interview Session' })).toBeVisible();
  });
});
