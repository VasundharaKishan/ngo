import { test, expect } from '@playwright/test';
import { loginAsAdmin } from '../helpers/auth';

const initialCategories = [
  { id: 'cat-1', name: 'Education', slug: 'education', icon: '🎓', displayOrder: 1, active: true },
  { id: 'cat-2', name: 'Health', slug: 'health', icon: '🩺', displayOrder: 2, active: true },
];

test.describe('Admin category management', () => {
  test('loads categories list, shows info toast, and deletes a category', async ({ page }) => {
    let categories = [...initialCategories];

    await page.route('**/admin/categories', async (route, request) => {
      if (request.method() === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(categories),
        });
        return;
      }

      if (request.method() === 'DELETE') {
        const id = request.url().split('/').pop();
        categories = categories.filter(cat => cat.id !== id);
        await route.fulfill({ status: 204 });
        return;
      }

      await route.continue();
    });

    await loginAsAdmin(page);
    await page.getByTestId('nav-categories').click();

    await expect(page.getByTestId('categories-header')).toBeVisible();
    await expect(page.getByTestId('categories-table')).toBeVisible();
    await expect(page.getByTestId(`category-row-${initialCategories[0].id}`)).toBeVisible();

    await page.getByTestId('categories-add-new').click();
    await expect(
      page.locator('[data-testid="toast-info"]').filter({ hasText: /coming soon/i })
    ).toBeVisible();

    let confirmMessage = '';
    page.once('dialog', dialog => {
      confirmMessage = dialog.message();
      dialog.accept();
    });

    await page.getByTestId(`category-delete-${initialCategories[0].id}`).click();

    expect(confirmMessage).toMatch(/delete this category/i);
  });
});
