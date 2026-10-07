import { test, expect } from '@playwright/test';

test.beforeEach(async ({ context }) => {
  await context.addCookies([
    {
      name: 'admin_access_token',
      value: 'fake-token',
      domain: 'localhost',
      path: '/',
    },
  ]);
});

test('home redirects to /en/admin/dashboard', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveURL(/\/en\/admin\/dashboard/);
});

test('dashboard renders with sidebar', async ({ page }) => {
  await page.goto('/en/admin/dashboard');
  await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Users' })).toBeVisible();
});

test('vi locale renders translated', async ({ page }) => {
  await page.goto('/vi/admin/dashboard');
  await expect(page.getByRole('heading', { name: 'Tổng quan' })).toBeVisible();
});
