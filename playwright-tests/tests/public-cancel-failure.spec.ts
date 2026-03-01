import { test, expect } from '@playwright/test';

test.describe('Payment Cancel & Failure flows', () => {
  test('cancel page renders correct content', async ({ page }) => {
    await page.goto('/donate/cancel');

    await expect(page).toHaveTitle(/cancelled/i);
    await expect(page.getByRole('heading', { name: /cancelled/i })).toBeVisible();
    // Should offer a way back to the campaigns page (use .first() — footer also has a campaigns link)
    await expect(page.getByRole('link', { name: /campaigns|donate|try again/i }).first()).toBeVisible();
  });

  test('cancel page has noindex meta tag', async ({ page }) => {
    await page.goto('/donate/cancel');

    const robots = await page.locator('meta[name="robots"]').getAttribute('content');
    expect(robots).toContain('noindex');
  });

  test('cancel page Back to Campaigns link navigates correctly', async ({ page }) => {
    await page.goto('/donate/cancel');

    const link = page.getByRole('link', { name: /campaign|donate|home/i }).first();
    const href = await link.getAttribute('href');
    expect(href).toBeTruthy();
    // Should not point to an external domain
    expect(href).not.toMatch(/^https?:\/\//);
  });

  test('success page renders thank-you content after valid session ID', async ({ page }) => {
    // Mock the donation-details API to avoid requiring a real DB record
    await page.route('**/api/donations/**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 'don-test-001',
          amount: 100,
          donorName: 'Test Donor',
          campaignName: 'Test Campaign',
          status: 'COMPLETED',
        }),
      });
    });

    await page.goto('/donate/success?session_id=cs_test_abc123');

    await expect(page).toHaveTitle(/thank you/i);
    await expect(page.getByRole('heading', { name: /thank you/i })).toBeVisible();
  });

  test('success page has noindex meta tag', async ({ page }) => {
    await page.goto('/donate/success');

    const robots = await page.locator('meta[name="robots"]').getAttribute('content');
    expect(robots).toContain('noindex');
  });

  test('404 page renders for unknown route', async ({ page }) => {
    await page.goto('/this-page-does-not-exist-xyz');

    await expect(page.getByText('404')).toBeVisible();
    await expect(page).toHaveTitle(/not found/i);
  });

  test('404 page has noindex meta tag', async ({ page }) => {
    await page.goto('/this-page-does-not-exist-xyz');

    const robots = await page.locator('meta[name="robots"]').getAttribute('content');
    expect(robots).toContain('noindex');
  });
});
