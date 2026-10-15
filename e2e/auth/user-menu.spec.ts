import { test, expect } from '@playwright/test';

/**
 * Sidebar user menu E2E (mini-sprint 3.05).
 *
 * No backend dependency: `/api/auth/me` and `/api/auth/logout` are stubbed with
 * `page.route` and the admin cookie is faked so the middleware lets the
 * dashboard through. The stub needs CORS headers because the app calls the
 * gateway cross-origin from localhost:3000 with credentials.
 */
const CORS_HEADERS = {
  'access-control-allow-origin': 'http://localhost:3000',
  'access-control-allow-credentials': 'true',
  'access-control-allow-methods': 'GET,POST,OPTIONS',
  // A credentialed preflight does not honour `*`, so list the headers explicitly.
  'access-control-allow-headers': 'content-type,accept',
};

const ME = {
  id: 'admin-id',
  username: 'admin',
  email: 'admin@snapgram.com',
  displayName: 'Administrator',
  role: 'ADMIN',
  emailVerified: true,
  createdAt: '2026-10-08T00:00:00Z',
};

test.beforeEach(async ({ page, context }) => {
  await context.addCookies([
    { name: 'admin_access_token', value: 'fake-token', domain: 'localhost', path: '/' },
  ]);

  await page.route('**/api/auth/me', async (route) => {
    if (route.request().method() === 'OPTIONS') {
      await route.fulfill({ status: 204, headers: CORS_HEADERS });
      return;
    }
    await route.fulfill({
      status: 200,
      headers: { ...CORS_HEADERS, 'content-type': 'application/json' },
      body: JSON.stringify(ME),
    });
  });

  await page.route('**/api/auth/logout', async (route) => {
    if (route.request().method() === 'OPTIONS') {
      await route.fulfill({ status: 204, headers: CORS_HEADERS });
      return;
    }
    // Logout invalidates the httpOnly session cookie; dropping it here keeps the
    // subsequent navigation to /admin/login out of middleware rule 2.
    await context.clearCookies();
    await route.fulfill({ status: 204, headers: CORS_HEADERS, body: '' });
  });
});

test('sidebar user menu shows the signed-in admin', async ({ page }) => {
  await page.goto('/en/admin/dashboard');

  const trigger = page.getByRole('button', { name: 'Open user menu' });
  await expect(trigger).toBeVisible();
  await expect(trigger).toContainText('admin@snapgram.com');
});

test('logging out returns the admin to the login page', async ({ page }) => {
  await page.goto('/en/admin/dashboard');

  await page.getByRole('button', { name: 'Open user menu' }).click();
  await page.getByRole('menuitem', { name: 'Log out' }).click();

  // The dev server compiles /admin/login on first hit; allow for that.
  await expect(page).toHaveURL(/\/admin\/login/, { timeout: 15_000 });
});
