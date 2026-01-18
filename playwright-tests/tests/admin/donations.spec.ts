import { test, expect } from '@playwright/test';
import { loginAsAdmin } from '../helpers/auth';

const mockDonations = [
  {
    id: 'don-1',
    donorName: 'Alice',
    donorEmail: 'alice@example.com',
    amount: 5000,
    currency: 'usd',
    campaignTitle: 'Education Fund',
    status: 'SUCCESS',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'don-2',
    donorName: 'Bob',
    donorEmail: 'bob@example.com',
    amount: 2500,
    currency: 'usd',
    campaignTitle: 'Health Drive',
    status: 'PENDING',
    createdAt: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
  },
];

const responses = {
  all: {
    totalItems: mockDonations.length,
    totalPages: 2,
    page: 0,
    size: 10,
    items: mockDonations,
  },
};

test.describe('Admin donations table', () => {
  test('loads donations, filters, and sorts results', async ({ page }) => {
    const requests: URL[] = [];

    await page.route('**/admin/donations*', async route => {
      const url = new URL(route.request().url());
      requests.push(url);
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(responses.all),
      });
    });

    await loginAsAdmin(page);
    await page.getByTestId('nav-donations').click();

    await expect(page.getByTestId('donations-header')).toBeVisible();
    await expect(page.getByTestId('donations-table')).toBeVisible();
    await expect(page.getByTestId('donation-row-don-1')).toBeVisible();
    await expect(page.getByTestId('donation-status-don-2')).toBeVisible();

    expect(requests.length).toBeGreaterThanOrEqual(1);

    // Filter by status
    await page.getByTestId('donations-status-filter').selectOption('PENDING');
    await expect(page.locator('[data-testid^="donation-row-"]')).toHaveCount(mockDonations.length);
    const lastFilter = requests[requests.length - 1];
    expect(lastFilter.searchParams.get('status')).toBe('PENDING');

    // Search input triggers new fetch
    await page.fill('[data-testid="donations-search"]', 'Alice');
    await page.waitForResponse(response => response.url().includes('/admin/donations') && response.url().includes('q=Alice'));
    const searchRequests = requests.filter((req) => req.searchParams.get('q') === 'Alice');
    expect(searchRequests.length).toBeGreaterThan(0);

    // Sorting controls
    await page.getByTestId('donations-sort-amount').click();
    const sortReq = requests[requests.length - 1];
    expect(sortReq.searchParams.get('sort')).toContain('amount');
    await page.getByTestId('donations-sort-date').click();
    const dateReq = requests[requests.length - 1];
    expect(dateReq.searchParams.get('sort')).toContain('createdAt');

    // Pagination buttons
    const prevButton = page.getByTestId('donations-prev');
    const nextButton = page.getByTestId('donations-next');

    await expect(prevButton).toBeDisabled();
    await expect(nextButton).toBeEnabled();

    await Promise.all([
      page.waitForResponse(response => response.url().includes('/admin/donations') && response.url().includes('page=1')),
      nextButton.click(),
    ]);

    await expect(prevButton).toBeEnabled();

    await Promise.all([
      page.waitForResponse(response => response.url().includes('/admin/donations') && response.url().includes('page=0')),
      prevButton.click(),
    ]);

    await expect(page.getByTestId('donations-results-info')).toBeVisible();
  });
});
