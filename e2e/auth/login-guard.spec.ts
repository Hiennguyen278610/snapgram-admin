import { test, expect } from '@playwright/test';

test('redirects unauthenticated to login', async ({ page }) => {
  await page.goto('/en/admin/dashboard');
  await expect(page).toHaveURL(/\/en\/admin\/login/);
});

test('allows access with cookie', async ({ page, context }) => {
  await context.addCookies([
    {
      name: 'admin_access_token',
      value: 'fake-token',
      domain: 'localhost',
      path: '/',
    },
  ]);
  await page.goto('/en/admin/dashboard');
  await expect(page).toHaveURL(/\/en\/admin\/dashboard/);
  await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible();
});

test('login page accessible without cookie', async ({ page }) => {
  await page.goto('/en/admin/login');
  await expect(page).toHaveURL(/\/en\/admin\/login/);
  await expect(page.getByRole('button', { name: /sign in/i })).toBeVisible();
});
