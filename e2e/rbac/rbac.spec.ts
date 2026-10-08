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

test('rbac page renders the English heading', async ({ page }) => {
  await page.goto('/en/admin/rbac');
  await expect(page.getByRole('heading', { name: 'Roles & Permissions' })).toBeVisible();
});

test('rbac page renders the Vietnamese heading', async ({ page }) => {
  await page.goto('/vi/admin/rbac');
  await expect(page.getByRole('heading', { name: 'Vai trò & Quyền' })).toBeVisible();
});
