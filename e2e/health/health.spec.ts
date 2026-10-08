import { test, expect } from '@playwright/test';

/**
 * The System Health page reads the actuator through the Next.js proxy
 * (`/api/health/[service]`), so these specs do not stub the network: the four
 * cards render from live UP/DOWN responses either way.
 */
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

test('system health page renders four service cards and three external links in English', async ({
  page,
}) => {
  await page.goto('/en/admin/system-health');

  await expect(page.getByRole('heading', { name: 'System Health' })).toBeVisible();
  await expect(page.getByTestId('service-status-card')).toHaveCount(4);
  await expect(page.getByRole('heading', { name: 'External Tools' })).toBeVisible();
  // `exact` avoids the sidebar's "Kafka UI, Open in new tab" link.
  await expect(page.getByRole('link', { name: 'Kafka UI', exact: true })).toBeVisible();
  await expect(page.getByRole('link', { name: 'MinIO Console', exact: true })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Mailpit', exact: true })).toBeVisible();
});

test('system health page renders the Vietnamese translation with the same structure', async ({
  page,
}) => {
  await page.goto('/vi/admin/system-health');

  await expect(page.getByRole('heading', { name: 'Sức khỏe hệ thống' })).toBeVisible();
  await expect(page.getByTestId('service-status-card')).toHaveCount(4);
  await expect(page.getByRole('heading', { name: 'Công cụ ngoài' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Kafka UI', exact: true })).toBeVisible();
});
