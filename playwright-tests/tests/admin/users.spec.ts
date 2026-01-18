import { test, expect } from '@playwright/test';

const adminUsers = [
  { id: 'user-1', username: 'operator1', email: 'op1@yugal.org', fullName: 'Operator One', role: 'OPERATOR', active: true, createdAt: '', lastLoginAt: '' },
  { id: 'user-2', username: 'admin', email: 'admin@yugal.org', fullName: 'Default Admin', role: 'ADMIN', active: true, createdAt: '', lastLoginAt: '' }
];

test('admin users list renders and toggles form', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('adminToken', 'token-123');
    localStorage.setItem('adminUser', JSON.stringify({ username: 'admin', role: 'ADMIN' }));
  });

  await page.route('**/api/admin/users', route =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(adminUsers) })
  );

  await page.goto('/admin/users');

  await expect(page.getByText('operator1')).toBeVisible();
  await expect(page.getByText('Default Admin')).toBeVisible();

  await expect(page.getByRole('button', { name: '\+ Add New User' })).toBeVisible();
  await page.getByRole('button', { name: '\+ Add New User' }).click();
  await expect(page.getByRole('heading', { name: 'Create New User' })).toBeVisible();
});
