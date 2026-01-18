import { test, expect } from '@playwright/test';

const heroSlides = [
  {
    id: 'slide-1',
    imageUrl: 'https://example.com/hero.jpg',
    altText: 'Hero one',
    focus: 'CENTER',
    enabled: true,
    sortOrder: 10,
    createdAt: '',
    updatedAt: ''
  }
];

const sections = [
  { id: 'section-1', type: 'featured_campaigns', enabled: true, sortOrder: 1, configJson: JSON.stringify({ title: 'Featured Section' }), createdAt: '', updatedAt: '' },
  { id: 'section-2', type: 'hero_content', enabled: true, sortOrder: 2, configJson: JSON.stringify({ title: 'Hero Copy' }), createdAt: '', updatedAt: '' }
];

test('admin homepage loads hero and sections data', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('adminToken', 'test');
    localStorage.setItem('adminUser', JSON.stringify({ username: 'admin', role: 'ADMIN' }));
  });

  await page.route('**/api/admin/hero-slides', route =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(heroSlides) })
  );
  await page.route('**/api/admin/home/sections', route =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(sections) })
  );

  await page.goto('/admin/homepage');

  await expect(page.getByText('Homepage Management')).toBeVisible();
  await expect(page.getByRole('button', { name: /Add New Slide/i })).toBeVisible();

  await page.getByRole('button', { name: /Content Sections/i }).click();
  await expect(page.getByText('Homepage Content Sections')).toBeVisible();
  await expect(page.locator('text=Configuration (JSON)').first()).toBeVisible();
});
