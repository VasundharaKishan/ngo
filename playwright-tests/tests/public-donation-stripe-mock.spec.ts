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

const stripeMockUrl = 'https://example.com/stripe-checkout-mock';

test('public donation initiates stripe redirect via mocked checkout url', async ({ page }) => {
  await page.addInitScript(() => {
    window.__SKIP_REDIRECT_TO_CHECKOUT = true;
  });

  await page.route('**/api/campaigns', route =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([mockCampaign]),
    })
  );

  await page.route(`**/api/campaigns/${mockCampaign.id}`, route =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(mockCampaign),
    })
  );

  await page.route('**/api/campaigns?*', route =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([mockCampaign]),
    })
  );

  await page.route('**/api/donations/stripe/create', route =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ checkoutUrl: stripeMockUrl }),
    })
  );

  await page.goto('/');
  await page.getByTestId('nav-campaigns').click();
  const firstCard = page.getByTestId('campaign-card').first();
  await firstCard.getByRole('link', { name: 'View Details' }).click();
  await page.getByTestId('donate-cta').click();
  await expect(page.getByTestId('donation-form')).toBeVisible();

  await page.getByTestId('donation-next-amount').click();
  await page.getByTestId('donation-name').fill('Test Donor');
  await page.getByTestId('donation-email').fill('donor@example.com');
  await page.getByTestId('donation-next-personal').click();

  const submitButton = page.getByTestId('donation-submit');
  await expect(submitButton).toBeVisible();

  await Promise.all([
    page.waitForResponse('**/api/donations/stripe/create'),
    submitButton.click(),
  ]);

  await expect(page.getByTestId('donation-redirecting')).toBeVisible();
  const redirectedUrl = await page.evaluate(() => window.__LAST_REDIRECT_URL);
  expect(redirectedUrl).toBe(stripeMockUrl);
});
