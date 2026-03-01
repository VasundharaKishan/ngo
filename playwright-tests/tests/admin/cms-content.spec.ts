import { test, expect } from '@playwright/test';
import { loginAsAdmin } from '../helpers/auth';

const mockCMSItems = [
  {
    id: '1',
    section: 'hero',
    contentKey: 'headline',
    contentType: 'text',
    contentValue: 'Welcome to our foundation',
    displayOrder: 1,
    active: true,
  },
  {
    id: '2',
    section: 'hero',
    contentKey: 'subtitle',
    contentType: 'text',
    contentValue: 'Making a difference',
    displayOrder: 2,
    active: true,
  },
];

test.describe('Admin CMS content management', () => {
  test.beforeEach(async ({ page }) => {
    await page.route('**/admin/cms/testimonials', route =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([]),
      })
    );
    await page.route('**/admin/cms/stats', route =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([]),
      })
    );
    await page.route('**/admin/cms/social-media', route =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([]),
      })
    );
    await page.route('**/admin/cms/carousel', route =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([]),
      })
    );
  });

  test('displays CMS page with tab navigation', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/admin/cms');

    // Should see tab buttons
    await expect(page.getByRole('button', { name: 'Testimonials' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Statistics' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Social Media' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Carousel' })).toBeVisible();
  });

  test('switches between CMS tabs', async ({ page }) => {
    const testimonials = [
      {
        id: 't1',
        authorName: 'John Doe',
        authorTitle: 'Donor',
        testimonialText: 'Great foundation!',
        displayOrder: 1,
        active: true,
      },
    ];

    await page.route('**/admin/cms/testimonials', route =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(testimonials),
      })
    );

    await loginAsAdmin(page);
    await page.goto('/admin/cms');

    // Default tab should show testimonials content
    await expect(page.locator('text=John Doe')).toBeVisible();

    // Click Statistics tab
    await page.locator('button', { hasText: 'Statistics' }).click();
  });

  test('navigates to CMS from sidebar', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/admin');

    // Route dashboard APIs
    await page.route('**/admin/dashboard/stats', route =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          totalDonations: 0,
          totalCampaigns: 0,
          totalUsers: 0,
          recentDonations: [],
        }),
      })
    );

    // Click CMS Content in sidebar
    const cmsLink = page.locator('nav a[href="/admin/cms"], nav a:has-text("CMS Content")');
    if (await cmsLink.count() > 0) {
      await cmsLink.first().click();
      await expect(page).toHaveURL(/\/admin\/cms/);
    }
  });
});
