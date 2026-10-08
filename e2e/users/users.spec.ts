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

test('users page renders the English heading', async ({ page }) => {
  await page.goto('/en/admin/users');
  await expect(page.getByRole('heading', { name: 'Users' })).toBeVisible();
});

test('users page renders the Vietnamese heading', async ({ page }) => {
  await page.goto('/vi/admin/users');
  await expect(page.getByRole('heading', { name: 'Người dùng' })).toBeVisible();
});
