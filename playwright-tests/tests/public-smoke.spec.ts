import { test, expect } from '@playwright/test';

const mockCampaign = {
  id: 'campaign-1',
  title: 'Test Campaign',
  slug: 'test-campaign',
  shortDescription: 'Short description',
  description: 'Full description',
  targetAmount: 10000,
  currency: 'usd',
  active: true,
};

test('public flows: home -> campaigns -> details', async ({ page }) => {
  await page.route('**/api/campaigns', route =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([mockCampaign]) })
  );
  await page.route(`**/api/campaigns/${mockCampaign.id}`, route =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(mockCampaign) })
  );

  await page.goto('/');
  await expect(page.getByTestId('site-header')).toBeVisible();

  await page.getByTestId('nav-campaigns').click();
  await expect(page.getByTestId('campaign-list')).toBeVisible();

  const firstCard = page.getByTestId('campaign-card').first();
  await expect(firstCard).toBeVisible();
  await firstCard.getByRole('link', { name: 'View Details' }).click();

  await expect(page.getByTestId('campaign-details')).toBeVisible();
  await expect(page.getByTestId('donate-cta')).toBeVisible();
});
