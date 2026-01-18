import { test, expect } from '@playwright/test';

test.describe('smoke', () => {
  test('home page loads and has title', async ({ page, baseURL }) => {
    await page.goto('/');
    const title = await page.title();
    expect(title.length).toBeGreaterThan(0);
    await expect(page.locator('body')).toBeVisible();
  });
});
