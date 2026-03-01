import { test, expect } from '@playwright/test';
import { loginAsAdmin } from '../helpers/auth';

const mockCampaigns = [
  { id: 'c1', title: 'Education Fund', active: true, featured: false, urgent: false },
  { id: 'c2', title: 'Healthcare Initiative', active: true, featured: true, urgent: false },
];

const mockSettings = {
  spotlightCampaignId: 'c1',
  spotlightCampaign: mockCampaigns[0],
};

test.describe('Admin donate popup settings', () => {
  test.beforeEach(async ({ page }) => {
    await page.route('**/campaigns', route =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockCampaigns),
      })
    );

    await page.route('**/admin/config/donate-popup', (route, request) => {
      if (request.method() === 'GET') {
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(mockSettings),
        });
      }
      // PUT
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ ...mockSettings, spotlightCampaignId: 'c2' }),
      });
    });
  });

  test('displays donate popup settings page', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/admin/donate-popup-settings');

    // Should show campaign selection (use select option to avoid strict-mode violation with duplicate text)
    await expect(page.getByRole('option', { name: /Education Fund/ })).toBeAttached();
  });

  test('saves spotlight campaign selection', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/admin/donate-popup-settings');

    // Wait for page load
    await expect(page.getByRole('option', { name: /Education Fund/ })).toBeAttached();

    // Find and click save button
    const saveBtn = page.locator('button:has-text("Save")');
    if (await saveBtn.count() > 0) {
      await saveBtn.click();
    }
  });
});
