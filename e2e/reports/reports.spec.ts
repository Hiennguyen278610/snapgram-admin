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

test('reports page renders the English heading', async ({ page }) => {
  await page.goto('/en/admin/moderation/reports');
  await expect(page.getByRole('heading', { name: 'Content Moderation' })).toBeVisible();
});

test('reports page renders the Vietnamese heading', async ({ page }) => {
  await page.goto('/vi/admin/moderation/reports');
  await expect(page.getByRole('heading', { name: 'Kiểm duyệt nội dung' })).toBeVisible();
});
