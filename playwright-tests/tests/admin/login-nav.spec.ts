import { test, expect } from '@playwright/test';

const adminLoginUrl = '/admin/login';
const adminDashboardUrl = '/admin';

const successResponse = {
  username: 'admin',
  email: 'admin@example.com',
  fullName: 'Super Admin',
  role: 'ADMIN',
};

test.describe('Admin login/navigation hooks', () => {
  test('valid credentials show sidebar and navigation links', async ({ page }) => {
    await page.route('**/auth/login', route =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(successResponse),
      })
    );

    await page.route('**/auth/csrf', route =>
      route.fulfill({
        status: 200,
        body: '',
      })
    );

    await page.goto(adminLoginUrl);
    await page.getByTestId('admin-login-username').fill('admin@example.com');
    await page.getByTestId('admin-login-password').fill('password');

    await Promise.all([
      page.waitForResponse('**/auth/login'),
      page.getByTestId('admin-login-submit').click(),
    ]);

    await expect(page).toHaveURL(adminDashboardUrl);
    await expect(page.getByTestId('admin-sidebar')).toBeVisible();
    await expect(page.getByTestId('admin-nav')).toBeVisible();
    await expect(page.getByTestId('nav-donations')).toBeVisible();
    await expect(page.getByTestId('nav-campaigns')).toBeVisible();

    await page.reload();
    await expect(page.getByTestId('admin-sidebar')).toBeVisible();
  });

  test('invalid login surfaces error message', async ({ page }) => {
    await page.route('**/auth/login', route =>
      route.fulfill({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Invalid credentials' }),
      })
    );

    await page.goto(adminLoginUrl);
    await page.getByTestId('admin-login-username').fill('wrong@example.com');
    await page.getByTestId('admin-login-password').fill('wrong');

    await Promise.all([
      page.waitForResponse('**/auth/login'),
      page.getByTestId('admin-login-submit').click(),
    ]);

    await expect(page.getByTestId('admin-login-error')).toHaveText(/invalid credentials/i);
    await expect(page.locator('[data-testid="admin-sidebar"]')).toHaveCount(0);
  });
});
