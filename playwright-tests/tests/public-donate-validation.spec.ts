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

const stripeMockUrl = 'http://localhost:5173/stripe-mock';

test('donation form shows validation errors and handles submission state', async ({ page }) => {
  await page.route(`**/api/campaigns/${mockCampaign.id}`, route =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(mockCampaign),
    })
  );

  await page.route('**/api/campaigns', route =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([mockCampaign]),
    })
  );

  await page.route('**/api/campaigns?*', route =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([mockCampaign]),
    })
  );

  await page.route('**/api/donations/stripe/create', async route => {
    await new Promise(resolve => setTimeout(resolve, 250));
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ url: stripeMockUrl }),
    });
  });

  await page.goto('/');
  await page.getByTestId('nav-campaigns').click();
  const firstCard = page.getByTestId('campaign-card').first();
  await firstCard.getByRole('link', { name: 'View Details' }).click();

  await page.getByTestId('donate-cta').click();
  await expect(page.getByTestId('donation-form')).toBeVisible();

  await page.getByTestId('donation-amount').fill('25');
  await page.getByTestId('donation-next-amount').click();

  await page.getByTestId('donation-next-personal').click();
  await expect(page.getByTestId('donation-error')).toHaveText(/provide your name and email/i);

  await page.getByTestId('donation-name').fill('Test Donor');
  await page.getByTestId('donation-email').fill('invalid-email');
  await page.getByTestId('donation-next-personal').click();
  await expect(page.getByTestId('donation-error')).toHaveText(/valid email/i);

  await page.getByTestId('donation-email').fill('donor@example.com');
  await page.getByTestId('donation-next-personal').click();

  const submitButton = page.getByTestId('donation-submit');
  await expect(submitButton).toBeVisible();

  await submitButton.click();
  await expect(submitButton).toBeDisabled();
  await expect(page.getByTestId('donation-loading')).toBeVisible();
  await page.waitForURL('**/stripe-mock', { timeout: 5000 });
});
