import { Page } from '@playwright/test';

export async function mockPublicEndpoints(page: Page) {
  await page.route('**/api/public/config', route =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        'site.name': 'Test Foundation',
        'site.tagline': 'Empowering communities',
        'site.logo_url': '/logo.png',
      }),
    }),
  );

  await page.route('**/api/public/announcement-bar', route =>
    route.fulfill({ status: 204 }),
  );

  await page.route('**/api/public/hero-panel', route =>
    route.fulfill({ status: 204 }),
  );

  await page.route('**/api/public/footer-config', route =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        columns: [],
        showSocialLinks: false,
        showNewsletter: false,
      }),
    }),
  );

  await page.route('**/api/public/registration', route =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        status: 'APPROVED',
        registrationNumber: 'REG-TEST',
        eightyGActive: true,
        fcraActive: false,
        disclosureOverride: null,
      }),
    }),
  );

  await page.route('**/api/public/trust-badges', route =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([]),
    }),
  );

  await page.route('**/api/public/stories', route =>
    route.fulfill({ status: 204 }),
  );

  await page.route('**/api/public/money-allocations', route =>
    route.fulfill({ status: 204 }),
  );

  await page.route('**/api/public/donation-presets', route =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        presets: [
          { id: 1, amountMinorUnits: 50000, label: 'Feed a child' },
          { id: 2, amountMinorUnits: 150000, label: 'School kit' },
        ],
        defaultAmountMinorUnits: 50000,
      }),
    }),
  );
}

export async function mockAdminDashboard(page: Page) {
  await page.route('**/api/admin/dashboard**', route =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        totalDonations: 10,
        totalRaised: 50000,
        totalCampaigns: 3,
        totalUsers: 2,
        recentDonations: [],
      }),
    }),
  );

  await page.route('**/api/admin/campaigns', route =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([]),
    }),
  );
}
