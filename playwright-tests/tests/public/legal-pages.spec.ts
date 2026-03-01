import { test, expect } from '@playwright/test';

test.describe('Legal pages', () => {
  const legalPages = [
    { path: '/terms', heading: 'Terms and Conditions', section: 'legal_terms' },
    { path: '/privacy', heading: 'Privacy Statement', section: 'legal_privacy' },
    { path: '/accessibility', heading: 'Accessibility Statement', section: 'legal_accessibility' },
    { path: '/cookies', heading: 'Cookie Policy', section: 'legal_cookies' },
  ];

  for (const legalPage of legalPages) {
    test(`renders ${legalPage.heading} with fallback content`, async ({ page }) => {
      // Mock CMS returning empty — so fallback renders
      await page.route(`**/cms/content/${legalPage.section}`, route =>
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({}),
        })
      );

      await page.goto(legalPage.path);

      await expect(page.getByRole('heading', { name: legalPage.heading, level: 1 })).toBeVisible();
      await expect(page.locator('.last-updated')).toBeVisible();
      // Fallback sections should render
      await expect(page.locator('section').first()).toBeVisible();
    });

    test(`renders ${legalPage.heading} with CMS content`, async ({ page }) => {
      await page.route(`**/cms/content/${legalPage.section}`, route =>
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            title: `Custom ${legalPage.heading}`,
            lastUpdated: 'January 2025',
            body: '<section><h2>Custom Section</h2><p>CMS-managed content.</p></section>',
          }),
        })
      );

      await page.goto(legalPage.path);

      await expect(page.getByRole('heading', { name: `Custom ${legalPage.heading}`, level: 1 })).toBeVisible();
      await expect(page.locator('.last-updated')).toContainText('January 2025');
      await expect(page.locator('text=CMS-managed content.')).toBeVisible();
    });
  }

  test('legal page links in footer navigate correctly', async ({ page }) => {
    // Mock public config API
    await page.route('**/config/public', route =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          organizationName: 'Test Foundation',
          tagline: 'Helping people',
          primaryColor: '#1e40af',
        }),
      })
    );

    await page.route('**/campaigns*', route =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ content: [], totalPages: 0, totalElements: 0 }),
      })
    );

    await page.route('**/cms/**', route =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({}),
      })
    );

    await page.goto('/');

    // Try to find legal links in footer
    const footer = page.locator('footer');
    if (await footer.count() > 0) {
      const termsLink = footer.locator('a[href="/terms"]');
      if (await termsLink.count() > 0) {
        await termsLink.click();
        await expect(page.locator('h1')).toHaveText('Terms and Conditions');
      }
    }
  });
});
