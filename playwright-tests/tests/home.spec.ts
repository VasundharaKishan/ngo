import { test, expect } from '@playwright/test';

const homeSections = [
  {
    id: 'hero',
    type: 'hero_content',
    sortOrder: 1,
    configJson: JSON.stringify({
      title: 'Every Act of Kindness Changes Lives',
      subtitle: 'Help us feed, educate, and empower communities.',
      ctaText: 'Explore All Campaigns →',
      ctaLink: '/campaigns',
    }),
  },
  {
    id: 'featured',
    type: 'featured_campaigns',
    sortOrder: 2,
    configJson: JSON.stringify({
      title: 'Featured Campaigns',
    }),
  },
];

const campaigns = [
  {
    id: 'campaign-1',
    title: 'Education for All',
    slug: 'education-for-all',
    shortDescription: 'Build schools in underserved regions.',
    description: 'Full campaign details',
    targetAmount: 50000,
    currency: 'usd',
    active: true,
    featured: true,
  },
];

const stats = [
  { id: '1', statLabel: 'Lives Impacted', statValue: '5,000+' },
  { id: '2', statLabel: 'Campaigns', statValue: '35' },
];

test('homepage hero and navigation to campaigns works', async ({ page }) => {
  await page.route('**/api/public/home', route =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(homeSections) })
  );
  await page.route('**/api/campaigns**', route =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(campaigns) })
  );
  await page.route('**/api/public/stats', route =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(stats) })
  );

  await page.goto('/');
  await expect(page.getByRole('heading', { name: /Every Act of Kindness/i })).toBeVisible();
  await expect(page.getByText(/Help us feed, educate, and empower/)).toBeVisible();
  await expect(page.getByRole('link', { name: /Explore All Campaigns/i })).toHaveAttribute('href', '/campaigns');

  await page.getByRole('link', { name: /Explore All Campaigns/i }).click();
  await expect(page).toHaveURL(/\/campaigns/);
  await expect(page.getByRole('heading', { name: 'Education for All' })).toBeVisible();
  await expect(page.getByRole('link', { name: /Donate/ })).toHaveAttribute('href', '/donate/campaign-1');
});
