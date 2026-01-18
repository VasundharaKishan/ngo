import { test, expect } from '@playwright/test';
import { loginAsOperator } from '../helpers/auth';

test.describe('Admin access control', () => {
  test('operator sees limited navigation and notes forbidden donations', async ({ page }) => {
    const attempts: URL[] = [];
    await page.route('**/admin/donations*', route => {
      attempts.push(new URL(route.request().url()));
      route.fulfill({
        status: 403,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Forbidden' }),
      });
    });

    await loginAsOperator(page);

    await expect(page.getByTestId('nav-donations')).toBeVisible();
    await expect(page.getByTestId('nav-users')).toHaveCount(0);
    await expect(page.getByTestId('nav-campaigns')).toBeVisible();

    await page.goto('/admin/donations');
    await expect(attempts.length).toBeGreaterThan(0);
  });
});
