import { test, expect } from '@playwright/test';
import { loginAsAdmin } from '../helpers/auth';

const generalSettings = [
  {
    key: 'site.name',
    value: 'Hope Foundation',
    type: 'STRING',
    isPublic: true,
    description: 'Site name displayed in header and footer',
    createdAt: '',
    updatedAt: '',
    updatedBy: 'admin'
  },
  {
    key: 'site.tagline',
    value: 'Spreading hope globally',
    type: 'STRING',
    isPublic: true,
    description: 'Site tagline or slogan',
    createdAt: '',
    updatedAt: '',
    updatedBy: 'admin'
  }
];

const contactInfo = {
  email: 'info@yugal.org',
  locations: [],
  showInFooter: true
};

const footerConfig = {
  tagline: 'Supporting communities worldwide',
  socialMedia: { facebook: '', twitter: '', instagram: '', youtube: '', linkedin: '' },
  showQuickLinks: true,
  showGetInvolved: true,
  copyrightText: '© 2025 Yugal Savitri Seva',
  disclaimerText: ''
};

const bannerContent = [
  {
    key: 'development_banner',
    value: 'This site is under development',
    active: true
  }
];

test.describe('Admin site settings', () => {
  test('updates general settings and shows success toast', async ({ page }) => {
    let lastBatchRequest: Record<string, any> | null = null;

    await page.route('**/admin/settings', route =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(generalSettings),
      })
    );

    await page.route('**/admin/settings/batch', async route => {
      lastBatchRequest = route.request().postDataJSON();
      await route.fulfill({ status: 200 });
    });

    await page.route('**/admin/config/contact', route =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(contactInfo),
      })
    );

    await page.route('**/admin/config/footer', route =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(footerConfig),
      })
    );

    await page.route('**/admin/cms/content/site-settings', route =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(bannerContent),
      })
    );

    await loginAsAdmin(page);

    await Promise.all([
      page.waitForResponse(response => response.url().endsWith('/admin/settings') && response.request().method() === 'GET'),
      page.getByTestId('nav-settings').click(),
    ]);

    await expect(page.getByTestId('settings-input-site-name')).toHaveValue('Hope Foundation');
    await expect(page.getByTestId('settings-input-site-tagline')).toHaveValue('Spreading hope globally');

    await page.getByTestId('settings-input-site-name').fill('Yugal Savitri Seva');
    await page.getByTestId('settings-input-site-tagline').fill('Service beyond borders');

    await Promise.all([
      page.waitForResponse(response => response.url().endsWith('/admin/settings/batch') && response.request().method() === 'PUT'),
      page.getByTestId('settings-save-button').click(),
    ]);

    await page.waitForResponse(response => response.url().endsWith('/admin/settings') && response.request().method() === 'GET');

    await expect(page.locator('[data-testid="toast-success"]').filter({ hasText: /General settings saved successfully/i })).toHaveCount(1);
    expect(lastBatchRequest).not.toBeNull();
    expect(lastBatchRequest?.settings).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ key: 'site.name', value: 'Yugal Savitri Seva' }),
        expect.objectContaining({ key: 'site.tagline', value: 'Service beyond borders' }),
      ])
    );
  });
});
