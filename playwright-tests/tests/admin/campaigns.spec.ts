import { test, expect } from '@playwright/test';
import { loginAsAdmin } from '../helpers/auth';

const categories = [
  { id: 'cat-1', name: 'Education', icon: '🎓' },
  { id: 'cat-2', name: 'Health', icon: '🩺' },
];

const existingCampaign = {
  id: 'camp-1',
  title: 'Education for All',
  targetAmount: 500000,
  currentAmount: 150000,
  active: true,
  featured: false,
  urgent: false,
  category: categories[0],
};

test.describe('Admin campaign management', () => {
  test('create new campaign and update toggles', async ({ page }) => {
    await page.route('**/admin/categories', route =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(categories),
      })
    );

    let campaigns = [existingCampaign];
    let createdPayload: Record<string, any> | null = null;

    await page.route(`**/admin/campaigns/${existingCampaign.id}`, async (route, request) => {
      if (request.method() === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(existingCampaign),
        });
        return;
      }

      if (request.method() === 'PUT') {
        const body = request.postDataJSON();
        Object.assign(existingCampaign, body);
        campaigns = campaigns.map(c => (c.id === existingCampaign.id ? existingCampaign : c));
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(existingCampaign),
        });
        return;
      }

      await route.continue();
    });

    await page.route('**/admin/campaigns', async (route, request) => {
      if (request.method() === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(campaigns),
        });
        return;
      }

      if (request.method() === 'POST') {
        const payload = request.postDataJSON();
        createdPayload = payload;
        const newCampaign = {
          id: 'camp-new',
          title: payload.title,
          targetAmount: payload.targetAmount,
          currentAmount: payload.currentAmount,
          active: payload.active,
          featured: payload.featured,
          urgent: payload.urgent,
          category: categories.find(cat => cat.id === payload.categoryId) ?? null,
        };
        campaigns = [newCampaign, ...campaigns];
        await route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify(newCampaign),
        });
        return;
      }

      await route.continue();
    });

    await loginAsAdmin(page);
    await page.getByTestId('nav-campaigns').click();
    await expect(page.getByTestId('campaigns-list')).toBeVisible();

    await page.getByTestId('campaigns-add-new').click();
    await expect(page.getByTestId('campaign-form')).toBeVisible();

    await page.getByTestId('campaign-short-description').fill('Provide clean water access');
    await page.getByTestId('campaign-full-description').fill('Detailed plan for wells and filters.');
    await page.getByTestId('campaign-category').selectOption('cat-2');
    await page.getByTestId('campaign-target-amount').fill('1000');

    await page.getByTestId('campaign-title').fill(' ');
    await page.getByTestId('campaign-submit').click();
    await expect(page.getByTestId('toast-error')).toHaveText(/Title is required/i);

    await page.getByTestId('campaign-title').fill('Clean Water Initiative');
    await page.getByTestId('campaign-category').selectOption('cat-2');
    await page.getByTestId('campaign-location').fill('Kerala, India');
    await page.getByTestId('campaign-target-amount').fill('1000');
    await page.getByTestId('campaign-current-amount').fill('250');
    await page.getByTestId('campaign-beneficiaries-count').fill('500');
    await page.getByTestId('campaign-featured-toggle').check();
    await page.getByTestId('campaign-urgent-toggle').check();
    await page.getByTestId('campaign-active-toggle').check();

    await Promise.all([
      page.waitForResponse(response => response.url().includes('/admin/campaigns') && response.request().method() === 'POST'),
      page.getByTestId('campaign-submit').click(),
    ]);

    await page.waitForURL('**/admin/campaigns');
    await expect(page.getByTestId('toast-success', { hasText: /Campaign created/i })).toBeVisible();
    expect(createdPayload).not.toBeNull();
    expect(createdPayload?.title).toBe('Clean Water Initiative');
    expect(createdPayload?.categoryId).toBe('cat-2');
    expect(createdPayload?.featured).toBe(true);
    expect(createdPayload?.urgent).toBe(true);
    expect(createdPayload?.active).toBe(true);

    await page.getByTestId(`campaign-edit-${existingCampaign.id}`).click();
    await expect(page.getByTestId('campaign-form')).toBeVisible();

    await page.getByTestId('campaign-featured-toggle').check();
    await expect(page.getByTestId('campaign-featured-toggle')).toBeChecked();
    await page.getByTestId('campaign-urgent-toggle').check();
    await expect(page.getByTestId('campaign-urgent-toggle')).toBeChecked();
    await page.getByTestId('campaign-active-toggle').uncheck();
    await expect(page.getByTestId('campaign-active-toggle')).not.toBeChecked();

    await page.getByTestId('campaign-submit').click();
    await expect(page.getByTestId('toast-success', { hasText: /Campaign updated/i })).toBeVisible();
  });
});
