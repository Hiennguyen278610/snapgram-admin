import { expect, type Page } from '@playwright/test';

/**
 * Shared helpers for the real-backend E2E specs.
 *
 * The credentials come from the environment so CI without a running backend
 * can skip these tests (`test.skip(!process.env.ADMIN_PASSWORD, ...)`).
 */
export const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? 'admin@snapgram.com';

/** `true` when the admin password is missing, i.e. the real backend cannot be exercised. */
export const ADMIN_PASSWORD_MISSING = !process.env.ADMIN_PASSWORD;

/** Signs in through the real login UI and waits for the dashboard redirect. */
export async function loginAsAdmin(page: Page): Promise<void> {
  await page.goto('/en/admin/login');
  await page.fill('#login-email', ADMIN_EMAIL);
  await page
    .locator('input[autocomplete="current-password"]')
    .fill(process.env.ADMIN_PASSWORD as string);
  await page.getByRole('button', { name: 'Sign In' }).click();
  await expect(page).toHaveURL(/\/admin\/dashboard/, { timeout: 20_000 });
}
