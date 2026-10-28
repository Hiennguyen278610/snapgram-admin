import { test, expect } from '@playwright/test';
import { ADMIN_PASSWORD_MISSING, loginAsAdmin } from '../support/admin';

/**
 * Media page shell assertions need no backend (a fake cookie only satisfies the
 * middleware so the page renders). The library test signs in for real and reads
 * the seeded media through `/api/media/me` (conventions §18); it is skipped when
 * `ADMIN_PASSWORD` is not exported so a backend-less CI run stays green.
 */
test.describe('media page shell', () => {
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

  test('media page renders the English heading and the uploaders', async ({ page }) => {
    await page.goto('/en/admin/media');

    await expect(page.getByRole('heading', { name: 'Media Library' })).toBeVisible();
    await expect(page.getByText('Upload a large file or video')).toBeVisible();
    await expect(page.getByText('Upload a small image')).toBeVisible();
  });

  test('media page renders the Vietnamese heading', async ({ page }) => {
    await page.goto('/vi/admin/media');

    await expect(page.getByRole('heading', { name: 'Thư viện Media' })).toBeVisible();
  });
});

test.describe('media library (real backend)', () => {
  test.skip(ADMIN_PASSWORD_MISSING, 'ADMIN_PASSWORD not set');

  test('shows at least the 5 seeded media tiles', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/en/admin/media');

    const tiles = page.getByTestId('media-grid-item');
    await expect(tiles.first()).toBeVisible({ timeout: 20_000 });
    await expect.poll(async () => tiles.count()).toBeGreaterThanOrEqual(5);
  });
});
