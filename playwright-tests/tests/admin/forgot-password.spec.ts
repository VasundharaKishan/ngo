import { test, expect } from '@playwright/test';

test.describe('Admin Forgot Password', () => {
  test('forgot password link is visible on login page', async ({ page }) => {
    await page.goto('/admin/login');

    const link = page.getByTestId('admin-login-forgot-password');
    await expect(link).toBeVisible();
    await expect(link).toHaveText(/Forgot Password/i);
  });

  test('forgot password link navigates to forgot-password page', async ({ page }) => {
    await page.goto('/admin/login');

    await page.getByTestId('admin-login-forgot-password').click();
    await expect(page).toHaveURL(/\/admin\/forgot-password/);
    await expect(page.getByTestId('forgot-password-page')).toBeVisible();
  });

  test('forgot password page renders correctly', async ({ page }) => {
    await page.goto('/admin/forgot-password');

    await expect(page.getByTestId('forgot-password-page')).toBeVisible();
    await expect(page.getByRole('heading', { name: /Forgot Password/i })).toBeVisible();
    await expect(page.getByTestId('forgot-password-email')).toBeVisible();
    await expect(page.getByTestId('forgot-password-submit')).toBeVisible();
    await expect(page.getByRole('link', { name: /Back to Login/i })).toBeVisible();
  });

  test('forgot password submits and shows success message', async ({ page }) => {
    await page.route('**/auth/forgot-password', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ message: 'If an account with that email exists, a password reset link has been sent.' }),
      })
    );

    await page.goto('/admin/forgot-password');

    await page.getByTestId('forgot-password-email').fill('admin@example.com');
    await page.getByTestId('forgot-password-submit').click();

    await expect(page.getByTestId('forgot-password-success')).toBeVisible();
    await expect(page.getByTestId('forgot-password-success')).toContainText(/reset link/i);
  });

  test('forgot password shows error on network failure', async ({ page }) => {
    await page.route('**/auth/forgot-password', (route) => route.abort());

    await page.goto('/admin/forgot-password');

    await page.getByTestId('forgot-password-email').fill('admin@example.com');
    await page.getByTestId('forgot-password-submit').click();

    await expect(page.getByTestId('forgot-password-error')).toBeVisible();
    await expect(page.getByTestId('forgot-password-error')).toContainText(/error/i);
  });

  test('back to login link works from forgot password page', async ({ page }) => {
    await page.goto('/admin/forgot-password');

    await page.getByRole('link', { name: /Back to Login/i }).click();
    await expect(page).toHaveURL(/\/admin\/login/);
  });
});

test.describe('Admin Reset Password', () => {
  test('reset password page shows error with no token', async ({ page }) => {
    await page.goto('/admin/reset-password');

    await expect(page.getByTestId('reset-password-page')).toBeVisible();
    await expect(page.getByTestId('reset-password-error')).toContainText(/invalid|expired/i);
  });

  test('reset password page shows error with invalid token', async ({ page }) => {
    await page.route('**/auth/validate-token/bad-token', (route) =>
      route.fulfill({
        status: 400,
        contentType: 'application/json',
        body: JSON.stringify({ valid: false, message: 'Invalid or expired token' }),
      })
    );

    await page.goto('/admin/reset-password?token=bad-token');

    await expect(page.getByTestId('reset-password-error')).toContainText(/invalid|expired/i);
    await expect(page.getByRole('link', { name: /new reset link/i })).toBeVisible();
  });

  test('reset password form renders with valid token', async ({ page }) => {
    await page.route('**/auth/validate-token/good-token', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ valid: true, username: 'admin', email: 'admin@example.com', fullName: 'Admin User' }),
      })
    );

    await page.goto('/admin/reset-password?token=good-token');

    await expect(page.getByTestId('reset-password-password')).toBeVisible();
    await expect(page.getByTestId('reset-password-confirm')).toBeVisible();
    await expect(page.getByTestId('reset-password-submit')).toBeVisible();
  });

  test('reset password submit button is disabled until requirements are met', async ({ page }) => {
    await page.route('**/auth/validate-token/good-token', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ valid: true, username: 'admin', email: 'admin@example.com', fullName: 'Admin User' }),
      })
    );

    await page.goto('/admin/reset-password?token=good-token');

    // Initially disabled
    await expect(page.getByTestId('reset-password-submit')).toBeDisabled();

    // Fill a weak password — still disabled
    await page.getByTestId('reset-password-password').fill('short');
    await page.getByTestId('reset-password-confirm').fill('short');
    await expect(page.getByTestId('reset-password-submit')).toBeDisabled();

    // Fill a strong matching password — enabled
    await page.getByTestId('reset-password-password').fill('StrongPass1');
    await page.getByTestId('reset-password-confirm').fill('StrongPass1');
    await expect(page.getByTestId('reset-password-submit')).toBeEnabled();
  });

  test('reset password successfully resets and shows success', async ({ page }) => {
    await page.route('**/auth/validate-token/good-token', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ valid: true, username: 'admin', email: 'admin@example.com', fullName: 'Admin User' }),
      })
    );
    await page.route('**/auth/reset-password/good-token', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ message: 'Password reset completed successfully' }),
      })
    );

    await page.goto('/admin/reset-password?token=good-token');

    await page.getByTestId('reset-password-password').fill('NewPassword1');
    await page.getByTestId('reset-password-confirm').fill('NewPassword1');
    await page.getByTestId('reset-password-submit').click();

    await expect(page.getByTestId('reset-password-success')).toBeVisible();
    await expect(page.getByTestId('reset-password-success')).toContainText(/reset successfully/i);
  });

  test('reset password shows error on server failure', async ({ page }) => {
    await page.route('**/auth/validate-token/good-token', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ valid: true, username: 'admin', email: 'admin@example.com', fullName: 'Admin User' }),
      })
    );
    await page.route('**/auth/reset-password/good-token', (route) =>
      route.fulfill({
        status: 400,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Invalid or expired reset link' }),
      })
    );

    await page.goto('/admin/reset-password?token=good-token');

    await page.getByTestId('reset-password-password').fill('NewPassword1');
    await page.getByTestId('reset-password-confirm').fill('NewPassword1');
    await page.getByTestId('reset-password-submit').click();

    await expect(page.getByTestId('reset-password-error')).toBeVisible();
    await expect(page.getByTestId('reset-password-error')).toContainText(/invalid|expired/i);
  });
});
