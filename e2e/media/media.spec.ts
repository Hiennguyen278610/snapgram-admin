import { test, expect } from '@playwright/test';

/**
 * There is no MSW service worker wired into the app shell, and E2E must not
 * depend on a running backend. Headings/shell are asserted without a backend;
 * the data-driven case stubs `GET /api/media/me` with `page.route`
 * (conventions §18). BI-010 (admin cookie on `/api/media/**`) is now fixed, so
 * the real page works when the backend stack is up.
 */
const CORS_HEADERS = {
  'access-control-allow-origin': 'http://localhost:3000',
  'access-control-allow-credentials': 'true',
  'access-control-allow-methods': 'GET,POST,PUT,DELETE,OPTIONS',
  'access-control-allow-headers': '*',
};

const MEDIA_PAGE = {
  content: [
    {
      id: 'aaaaaaaa-1111-4111-8111-111111111101',
      ownerId: '56030fa2-b07b-4599-8c1f-e1e8b4da9622',
      url: 'http://localhost:9000/snapgram-media/a.jpg',
      thumbnailUrl: null,
      mimeType: 'image/jpeg',
      sizeBytes: 1024,
      status: 'READY',
      width: 10,
      height: 10,
      durationSec: null,
      createdAt: '2026-10-08T06:00:00Z',
    },
  ],
  totalElements: 1,
  totalPages: 1,
  number: 0,
  size: 12,
  numberOfElements: 1,
  first: true,
  last: true,
  empty: false,
};

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

test('media library renders a tile from stubbed data', async ({ page }) => {
  await page.route('**/api/media/me**', async (route) => {
    if (route.request().method() === 'OPTIONS') {
      await route.fulfill({ status: 204, headers: CORS_HEADERS });
      return;
    }
    await route.fulfill({
      status: 200,
      headers: { ...CORS_HEADERS, 'content-type': 'application/json' },
      body: JSON.stringify(MEDIA_PAGE),
    });
  });

  await page.goto('/en/admin/media');

  await expect(page.getByRole('button', { name: 'Preview image/jpeg' })).toBeVisible();
});
