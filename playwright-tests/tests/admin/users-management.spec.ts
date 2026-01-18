import { test, expect } from '@playwright/test';
import { loginAsAdmin } from '../helpers/auth';

const initialUsers = [
  { id: 'user-admin', username: 'admin', email: 'admin@yugal.org', fullName: 'Admin User', role: 'ADMIN', active: true, lastLoginAt: '', createdAt: '' },
  { id: 'user-operator', username: 'operator1', email: 'operator@yugal.org', fullName: 'Operator One', role: 'OPERATOR', active: true, lastLoginAt: '', createdAt: '' },
];

test.describe('Admin user management', () => {
  test('creates a new user and refreshes the list', async ({ page }) => {
    let users = [...initialUsers];

    await page.route('**/admin/users*', async route => {
      const request = route.request();
      const method = request.method();
      const url = new URL(request.url());
      const pathSegments = url.pathname.split('/').filter(Boolean);
      const lastSegment = pathSegments[pathSegments.length - 1];
      const userId = lastSegment && lastSegment !== 'users' ? lastSegment : undefined;

      if (method === 'GET' && !userId) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(users),
        });
        return;
      }

      if (method === 'POST' && !userId) {
        const payload = request.postDataJSON();
        const newUser = {
          id: 'user-new',
          username: payload.username,
          email: payload.email,
          fullName: payload.fullName,
          role: payload.role,
          active: payload.active ?? true,
          lastLoginAt: '',
          createdAt: new Date().toISOString(),
        };
        users = [newUser, ...users];
        await route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify(newUser),
        });
        return;
      }

      await route.continue();
    });

    await loginAsAdmin(page);
    await Promise.all([
      page.waitForResponse(response => response.url().endsWith('/admin/users') && response.request().method() === 'GET'),
      page.getByTestId('nav-users').click(),
    ]);

    await expect(page.getByTestId('admin-users-table')).toBeVisible();

    await page.getByTestId('admin-users-toggle-form').click();
    await page.getByTestId('admin-users-input-username').fill('newoperator');
    await page.getByTestId('admin-users-input-email').fill('new@ngo.org');
    await page.getByTestId('admin-users-input-fullname').fill('New Operator');
    await page.getByTestId('admin-users-input-role').selectOption('OPERATOR');

    await Promise.all([
      page.waitForResponse(response => response.url().endsWith('/admin/users') && response.request().method() === 'POST'),
      page.getByTestId('admin-users-submit').click(),
    ]);
    await page.waitForResponse(response => response.url().endsWith('/admin/users') && response.request().method() === 'GET');

    await expect(page.getByTestId('admin-user-row-user-new')).toBeVisible();
  });
});
