// @vitest-environment node
import { describe, it, expect, vi, afterEach } from 'vitest';
import { http, HttpResponse } from 'msw';
import { server } from '@/mocks/server';
import type { ApiError } from '@/lib/api/types';
import { fetchDashboardStats } from './dashboard.service';

const DASHBOARD_STATS_URL = 'http://localhost:8080/api/auth/admin/dashboard/stats';

describe('dashboard.service', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns the parsed stats from the default MSW handler', async () => {
    const stats = await fetchDashboardStats();

    expect(stats.totalUsers).toBe(1250);
    expect(stats.activeUsers).toBe(1180);
    expect(stats.bannedUsers).toBe(70);
    expect(stats.recentUsers).toHaveLength(5);
    expect(stats.recentUsers[0].username).toBe('alice');
  });

  it('throws a normalized server ApiError when the response shape is invalid', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    server.use(http.get(DASHBOARD_STATS_URL, () => HttpResponse.json({ foo: 'bar' })));

    await expect(fetchDashboardStats()).rejects.toMatchObject({
      httpStatus: 0,
      kind: 'server',
      message: 'Invalid response shape',
    } satisfies Partial<ApiError>);

    expect(warn).toHaveBeenCalledTimes(1);
  });
});
