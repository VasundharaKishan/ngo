import { Page } from '@playwright/test';

type AdminRole = 'ADMIN' | 'OPERATOR';

const loginPagePath = '/admin/login';

interface LoginOverrides {
  email?: string;
  password?: string;
}

const buildUserPayload = (role: AdminRole, email: string) => ({
  username: role === 'ADMIN' ? 'admin' : 'operator',
  email,
  fullName: role === 'ADMIN' ? 'Admin User' : 'Operator User',
  role
});

const createLoginRoutes = (page: Page, userPayload: ReturnType<typeof buildUserPayload>) => {
  page.route('**/auth/login', route =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(userPayload)
    })
  );
  page.route('**/auth/csrf', route => route.fulfill({ status: 200 }));
};

const resolveCredentials = (role: AdminRole, overrides: LoginOverrides = {}) => {
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@example.com';
  const adminPassword = process.env.ADMIN_PASSWORD || 'password';
  const operatorEmail = process.env.OPERATOR_EMAIL || 'operator@example.com';
  const operatorPassword = process.env.OPERATOR_PASSWORD || 'password';

  const email = overrides.email ?? (role === 'ADMIN' ? adminEmail : operatorEmail);
  const password = overrides.password ?? (role === 'ADMIN' ? adminPassword : operatorPassword);
  return { email, password };
};

export async function loginWithRole(page: Page, role: AdminRole, overrides?: LoginOverrides) {
  const { email, password } = resolveCredentials(role, overrides);
  const userPayload = buildUserPayload(role, email);

  createLoginRoutes(page, userPayload);
  await page.goto(loginPagePath);

  await page.getByTestId('admin-login-username').fill(email);
  await page.getByTestId('admin-login-password').fill(password);

  await page.evaluate((user) => {
    localStorage.setItem('adminToken', 'mock-token');
    localStorage.setItem('adminUser', JSON.stringify(user));
  }, userPayload);

  await Promise.all([
    page.waitForResponse('**/auth/login'),
    page.getByTestId('admin-login-submit').click(),
  ]);

  await page.waitForURL('**/admin');
  await page.getByTestId('admin-sidebar').waitFor({ state: 'visible' });
}

export async function loginAsAdmin(page: Page, overrides?: LoginOverrides) {
  return loginWithRole(page, 'ADMIN', overrides);
}

export async function loginAsOperator(page: Page, overrides?: LoginOverrides) {
  return loginWithRole(page, 'OPERATOR', overrides);
}
