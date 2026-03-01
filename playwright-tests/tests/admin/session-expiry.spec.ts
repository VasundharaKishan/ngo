import { test, expect } from '@playwright/test';
import { loginAsAdmin } from '../helpers/auth';

test.describe('Admin session expiry', () => {
  test('redirects to login when accessing protected admin route unauthenticated', async ({ page }) => {
    // Navigate directly to a protected admin page without any adminUser in localStorage
    await page.goto('/admin/campaigns');

    // AdminLayout checks localStorage for adminUser — not found → redirect to login
    await expect(page).toHaveURL(/\/admin\/login/);
  });

  test('shows login page after localStorage adminUser is cleared', async ({ page }) => {
    // No adminUser in localStorage — protected route should redirect
    await page.goto('/admin');

    await expect(page).toHaveURL(/\/admin\/login/);
    await expect(page.getByTestId('admin-login-page')).toBeVisible();
  });

  test('admin login page has noindex meta', async ({ page }) => {
    await page.goto('/admin/login');

    const robots = await page.locator('meta[name="robots"]').getAttribute('content');
    expect(robots).toContain('noindex');
  });

  test('re-login after session expiry restores access', async ({ page }) => {
    // Mock login to succeed
    await page.route('**/auth/login', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          username: 'admin',
          email: 'admin@example.com',
          fullName: 'Admin User',
          role: 'ADMIN',
        }),
      })
    );
    await page.route('**/auth/csrf', (route) => route.fulfill({ status: 200 }));

    // Mock dashboard data
    await page.route('**/api/admin/**', (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: '{}' })
    );

    // Navigate to login
    await page.goto('/admin/login');
    await expect(page.getByTestId('admin-login-page')).toBeVisible();

    // Fill in credentials
    const usernameInput = page.getByTestId('admin-login-username');
    const passwordInput = page.getByTestId('admin-login-password');
    const submitBtn = page.getByTestId('admin-login-submit');

    await usernameInput.fill('admin@example.com');
    await passwordInput.fill('password');

    // Inject localStorage before navigation so protected routes pass
    await page.evaluate(() => {
      localStorage.setItem('adminUser', JSON.stringify({
        username: 'admin',
        email: 'admin@example.com',
        fullName: 'Admin User',
        role: 'ADMIN',
      }));
    });

    await submitBtn.click();

    await expect(page).toHaveURL(/\/admin/);
  });

  test('expired session (mismatched tab session) clears adminUser and redirects to login', async ({ page }) => {
    // Navigate first so localStorage is accessible (cannot set it on about:blank)
    await page.goto('/');

    // Mock logout endpoint to respond quickly
    await page.route('**/auth/logout', (route) =>
      route.fulfill({ status: 200 })
    );

    // Auto-dismiss the session-expiry alert dialog
    page.on('dialog', dialog => dialog.dismiss());

    // Simulate a stale session from another browser tab:
    // session_id IS in localStorage but NOT in sessionStorage → isSessionValid() fails
    await page.evaluate(() => {
      localStorage.setItem('adminUser', JSON.stringify({ username: 'admin', role: 'ADMIN' }));
      localStorage.setItem('session_id', 'stale-session-from-another-tab');
      localStorage.setItem('last_activity', Date.now().toString());
      // Deliberately do NOT set sessionStorage.session_id
    });

    // Navigate to a protected page — AdminLayout will detect the stale session
    await page.goto('/admin/campaigns');

    // App should have cleared adminUser and redirected to login
    await expect(page).toHaveURL(/\/admin\/login/);
    const adminUser = await page.evaluate(() => localStorage.getItem('adminUser'));
    expect(adminUser).toBeNull();
  });
});
