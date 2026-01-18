import { test, expect } from '@playwright/test';

const mockCampaigns = [
  {
    id: 'camp-1',
    title: 'Education First',
    slug: 'education-first',
    shortDescription: 'Build classrooms for underserved children.',
    description: 'Detailed narrative about education campaign.',
    targetAmount: 50000,
    currentAmount: 10000,
    currency: 'usd',
    active: true,
    imageUrl: 'https://example.com/education.jpg',
    categoryId: 'cat-edu',
    categoryName: 'Education',
    categoryIcon: '🎓',
    beneficiariesCount: 200,
  },
  {
    id: 'camp-2',
    title: 'Clean Water Initiative',
    slug: 'clean-water',
    shortDescription: 'Provide clean water to remote villages.',
    description: 'In-depth story on wells and filters.',
    targetAmount: 30000,
    currentAmount: 12000,
    currency: 'usd',
    active: true,
    imageUrl: 'https://example.com/water.jpg',
    categoryId: 'cat-health',
    categoryName: 'Health',
    categoryIcon: '🩺',
    beneficiariesCount: 150,
  },
  {
    id: 'camp-3',
    title: 'Global Health Support',
    slug: 'global-health',
    shortDescription: 'Vaccines and outreach across continents.',
    description: 'Detailed description of the global health work.',
    targetAmount: 75000,
    currentAmount: 42000,
    currency: 'usd',
    active: true,
    imageUrl: 'https://example.com/health.jpg',
    categoryId: 'cat-health',
    categoryName: 'Health',
    categoryIcon: '🩺',
    beneficiariesCount: 500,
  },
];

const campaignDetail = {
  ...mockCampaigns[2],
  description: 'Expanded detail for Global Health Support campaign.',
};

test.describe('Public navigation and campaigns', () => {
  const stubConfig = async (page: Parameters<typeof page.route>[0]) => {
    await page.route('**/settings/public', route =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          'site.name': 'Yugal Savitri Seva',
          'campaigns_page.items_per_page': '2',
        }),
      })
    );
  };

  const stubStaticCms = async (page: Parameters<typeof page.route>[0]) => {
    await page.route('**/config/public/contact', route =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ email: 'info@yugal.org', locations: [], showInFooter: true }),
      })
    );
    await page.route('**/cms/content/site-settings', route =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) })
    );
    await page.route('**/cms/social-media', route =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) })
    );
    await page.route('**/cms/content/footer', route =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) })
    );
  };

  const stubCampaignRoutes = async (page: Parameters<typeof page.route>[0]) => {
    await page.route('**/campaigns**', async route => {
      if (route.request().resourceType() === 'document') {
        await route.continue();
        return;
      }

      const url = new URL(route.request().url());
      const parts = url.pathname.split('/').filter(Boolean);
      const campaignsIndex = parts.findIndex(segment => segment === 'campaigns');

      if (campaignsIndex !== -1 && parts.length === campaignsIndex + 1) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(mockCampaigns),
        });
        return;
      }
      const campaignId = parts[campaignsIndex + 1];
      const candidate = campaignId === campaignDetail.id ? campaignDetail : mockCampaigns.find(c => c.id === campaignId);
      if (!candidate) {
        await route.fulfill({ status: 404, body: 'Not found' });
        return;
      }

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(candidate),
      });
    });
  };

  test('homepage -> campaign list -> detail navigation', async ({ page }) => {
    await stubConfig(page);
    await stubStaticCms(page);
    await stubCampaignRoutes(page);

    await page.goto('/');
    await expect(page.getByTestId('site-header')).toBeVisible();
    await expect(page.getByTestId('nav-campaigns')).toBeVisible();

    await Promise.all([
      page.waitForURL('**/campaigns'),
      page.getByTestId('nav-campaigns').click(),
    ]);

    await expect(page.getByTestId('campaign-list')).toBeVisible();
    await expect(page.getByTestId('campaign-card')).toHaveCount(2);
    await expect(page.getByTestId('campaigns-next')).toBeVisible();
    await page.getByTestId('campaigns-next').click();

    await expect(page.getByTestId('campaign-card')).toHaveCount(1);
    await expect(page.getByTestId('campaigns-prev')).toBeEnabled();
    await expect(page.getByTestId(`campaigns-page-2`)).toHaveClass(/active/);

    const thirdCard = page.getByTestId('campaign-card').first();
    await thirdCard.getByRole('link', { name: 'View Details' }).click();

    await expect(page.getByTestId('campaign-details')).toBeVisible();
    await expect(page.getByTestId('donate-cta')).toBeVisible();
    await expect(page.getByTestId('campaign-details')).toContainText('Global Health Support');
  });
});
