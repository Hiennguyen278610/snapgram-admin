import { apiClient } from '@/lib/api/client';
import type { ApiError } from '@/lib/api/types';
import { adminDashboardResponseSchema, type AdminDashboardResponse } from '../schemas/stats.schema';

export const DASHBOARD_STATS_ENDPOINT = '/api/auth/admin/dashboard/stats';

export async function fetchDashboardStats(): Promise<AdminDashboardResponse> {
  const { data } = await apiClient.get(DASHBOARD_STATS_ENDPOINT);

  // `safeParse` keeps a raw ZodError out of the UI; we surface a normalized
  // ApiError instead and log a short diagnostic (never the whole payload).
  const parsed = adminDashboardResponseSchema.safeParse(data);
  if (!parsed.success) {
    console.warn('[dashboard] Invalid dashboard stats response shape', parsed.error.issues);
    const apiError: ApiError = {
      httpStatus: 0,
      kind: 'server',
      message: 'Invalid response shape',
      rawResponse: data,
    };
    throw apiError;
  }

  return parsed.data;
}
