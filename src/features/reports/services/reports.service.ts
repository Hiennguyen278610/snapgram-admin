import { apiClient } from '@/lib/api/client';
import type { ReportFilters } from '@/lib/api/query-keys';
import type { ApiError } from '@/lib/api/types';
import {
  pageReportSchema,
  reportSchema,
  type PageReport,
  type Report,
} from '../schemas/report.schema';

export const REPORTS_ENDPOINT = '/api/admin/reports';

function invalidShape(label: string, data: unknown, issues: unknown): ApiError {
  console.warn(`[reports] Invalid ${label} response shape`, issues);
  return {
    httpStatus: 0,
    kind: 'server',
    message: 'Invalid response shape',
    rawResponse: data,
  };
}

/**
 * GET /api/admin/reports — verified LIVE 2026-10-08.
 *
 * `page` defaults to 0 and `size` to 20 (the backend caps `size` at 50).
 * `status` / `targetType` are only appended when set: sending an empty string
 * makes the backend fail to bind the enum and answer `500` (BI-009), so they
 * are never sent as `''`.
 *
 * TODO(BI-009): the live backend ignores `targetType` when `status` is absent,
 * so the filter looks dead on the "All" tab. The FE still sends the correctly
 * cased param — the feature starts working the moment the backend is fixed.
 */
export async function fetchReports(filters: ReportFilters = {}): Promise<PageReport> {
  const params: Record<string, string | number> = {
    page: filters.page ?? 0,
    size: filters.size ?? 20,
  };

  if (filters.status) params.status = filters.status;
  if (filters.targetType) params.targetType = filters.targetType;

  const { data } = await apiClient.get(REPORTS_ENDPOINT, { params });

  const parsed = pageReportSchema.safeParse(data);
  if (!parsed.success) {
    throw invalidShape('reports list', data, parsed.error.issues);
  }

  return parsed.data;
}

export async function fetchReportDetail(reportId: string): Promise<Report> {
  const { data } = await apiClient.get(`${REPORTS_ENDPOINT}/${encodeURIComponent(reportId)}`);

  const parsed = reportSchema.safeParse(data);
  if (!parsed.success) {
    throw invalidShape('report detail', data, parsed.error.issues);
  }

  return parsed.data;
}

/**
 * PATCH (not POST) and no request body — verified LIVE 2026-10-08.
 * A `DISMISSED` report makes the real backend answer `500`; the UI never lets
 * that call happen (BI-008).
 */
export async function resolveReport(reportId: string): Promise<Report> {
  const { data } = await apiClient.patch(
    `${REPORTS_ENDPOINT}/${encodeURIComponent(reportId)}/resolve`
  );

  const parsed = reportSchema.safeParse(data);
  if (!parsed.success) {
    throw invalidShape('resolve report', data, parsed.error.issues);
  }

  return parsed.data;
}

export async function dismissReport(reportId: string): Promise<Report> {
  const { data } = await apiClient.patch(
    `${REPORTS_ENDPOINT}/${encodeURIComponent(reportId)}/dismiss`
  );

  const parsed = reportSchema.safeParse(data);
  if (!parsed.success) {
    throw invalidShape('dismiss report', data, parsed.error.issues);
  }

  return parsed.data;
}
