import { test, expect } from '@playwright/test';
import { ADMIN_EMAIL, ADMIN_PASSWORD_MISSING, loginAsAdmin } from '../support/admin';

/**
 * Sidebar user menu E2E (mini-sprint 3.05).
 *
 * Real backend: the spec signs in through the login UI and exercises
 * `/api/auth/me` + `/api/auth/logout` against the live gateway. It is skipped
 * when `ADMIN_PASSWORD` is not exported so a backend-less CI run stays green.
 */
test.describe('sidebar user menu (real backend)', () => {
  test.skip(ADMIN_PASSWORD_MISSING, 'ADMIN_PASSWORD not set');

  test('sidebar user menu shows the signed-in admin', async ({ page }) => {
    await loginAsAdmin(page);

    const trigger = page.getByRole('button', { name: 'Open user menu' });
    await expect(trigger).toBeVisible();
    await expect(trigger).toContainText(ADMIN_EMAIL);
  });

  test('logging out returns the admin to the login page', async ({ page }) => {
    await loginAsAdmin(page);

    await page.getByRole('button', { name: 'Open user menu' }).click();
    await page.getByRole('menuitem', { name: 'Log out' }).click();

    await expect(page).toHaveURL(/\/admin\/login/, { timeout: 20_000 });
  });
});
