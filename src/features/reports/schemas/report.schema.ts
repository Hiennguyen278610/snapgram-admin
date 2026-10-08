import { z } from 'zod';
import type { ReportStatus, ReportTargetType } from '@/lib/api/query-keys';

/**
 * Field-by-field verified against the LIVE backend + Swagger (2026-10-08).
 *
 * `ReportResponse` carries exactly 8 fields — nothing more, nothing less.
 * `PageReportResponse` additionally exposes `sort` + `pageable`, which the FE
 * deliberately ignores (no sort param exists on the endpoint).
 *
 * Zod style follows the rest of the repo: `z.string()` for `id` and date-time
 * fields instead of `z.string().uuid()` / `.datetime()` (deprecated in zod
 * 4.6.5, and intentionally lenient here).
 *
 * The enum values below are **UPPERCASE only** — anything else makes the real
 * backend answer `500` instead of `400` (BI-009), so the union is the single
 * source of truth for what the FE is allowed to send.
 */
export const REPORT_STATUSES = [
  'PENDING',
  'REVIEWED',
  'RESOLVED',
  'DISMISSED',
] as const satisfies readonly ReportStatus[];

export const REPORT_TARGET_TYPES = [
  'POST',
  'COMMENT',
  'USER',
] as const satisfies readonly ReportTargetType[];

/** Statuses that may still be resolved/dismissed (BI-008 guard). */
export const MODERATABLE_STATUSES = ['PENDING', 'REVIEWED'] as const;

export const reportStatusSchema = z.enum(REPORT_STATUSES);
export const reportTargetTypeSchema = z.enum(REPORT_TARGET_TYPES);

export const reportSchema = z.object({
  id: z.string(),
  reporterId: z.string(),
  targetType: reportTargetTypeSchema,
  targetId: z.string(),
  reason: z.string(),
  description: z.string().nullable().optional(),
  status: reportStatusSchema,
  createdAt: z.string(),
});

export const pageReportSchema = z.object({
  content: z.array(reportSchema).optional().default([]),
  totalElements: z.number().optional().default(0),
  totalPages: z.number().optional().default(0),
  number: z.number().optional().default(0),
  size: z.number().optional().default(0),
  numberOfElements: z.number().optional().default(0),
  first: z.boolean().optional().default(true),
  last: z.boolean().optional().default(true),
  empty: z.boolean().optional().default(false),
});

export type Report = z.infer<typeof reportSchema>;
export type PageReport = z.infer<typeof pageReportSchema>;

/**
 * BI-008 workaround: the FE only offers Resolve/Dismiss while the report is
 * still actionable. The real backend answers `500` when resolving a dismissed
 * report (should be 409) and silently flips a resolved report on dismiss, so
 * `RESOLVED` / `DISMISSED` are read-only here.
 */
export function isModeratableStatus(status: ReportStatus): boolean {
  return (MODERATABLE_STATUSES as readonly ReportStatus[]).includes(status);
}
