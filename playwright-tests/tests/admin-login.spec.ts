import { test, expect } from '@playwright/test';
import { loginAsAdmin } from './helpers/auth';

test('admin login exposes dashboard navigation', async ({ page }) => {
  await loginAsAdmin(page);
  const sidebar = page.locator('.admin-sidebar');
  await expect(sidebar).toBeVisible();
});
