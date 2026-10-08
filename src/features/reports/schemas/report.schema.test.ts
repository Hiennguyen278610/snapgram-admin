import { describe, it, expect } from 'vitest';
import {
  MODERATABLE_STATUSES,
  REPORT_STATUSES,
  REPORT_TARGET_TYPES,
  isModeratableStatus,
  pageReportSchema,
  reportSchema,
} from './report.schema';

const validReport = {
  id: '11111111-1111-1111-1111-111111111101',
  reporterId: '56030fa2-b07b-4599-8c1f-e1e8b4da9622',
  targetType: 'POST',
  targetId: 'aaaa1111-1111-1111-1111-111111111101',
  reason: 'spam',
  description: 'Spam content',
  status: 'PENDING',
  createdAt: '2026-10-08T06:00:00Z',
};

describe('reportSchema', () => {
  it('accepts the 8-field ReportResponse contract', () => {
    const parsed = reportSchema.parse(validReport);

    expect(parsed).toEqual(validReport);
    expect(Object.keys(parsed)).toHaveLength(8);
  });

  it('accepts a null description (backend allows it)', () => {
    const parsed = reportSchema.parse({ ...validReport, description: null });

    expect(parsed.description).toBeNull();
  });

  it('accepts every UPPERCASE status', () => {
    for (const status of REPORT_STATUSES) {
      expect(reportSchema.parse({ ...validReport, status }).status).toBe(status);
    }
  });

  it('accepts every UPPERCASE targetType', () => {
    for (const targetType of REPORT_TARGET_TYPES) {
      expect(reportSchema.parse({ ...validReport, targetType }).targetType).toBe(targetType);
    }
  });

  it('rejects a lowercase status (BI-009: real backend answers 500)', () => {
    expect(reportSchema.safeParse({ ...validReport, status: 'pending' }).success).toBe(false);
  });

  it('rejects a lowercase targetType (BI-009)', () => {
    expect(reportSchema.safeParse({ ...validReport, targetType: 'user' }).success).toBe(false);
  });

  it('rejects an unknown enum value', () => {
    expect(reportSchema.safeParse({ ...validReport, status: 'BOGUS' }).success).toBe(false);
    expect(reportSchema.safeParse({ ...validReport, targetType: 'BOGUS' }).success).toBe(false);
  });

  it('rejects a report missing a required field', () => {
    const withoutReason: Record<string, unknown> = { ...validReport };
    delete withoutReason.reason;

    expect(reportSchema.safeParse(withoutReason).success).toBe(false);
  });
});

describe('pageReportSchema', () => {
  it('accepts the full PageReportResponse shape', () => {
    const parsed = pageReportSchema.parse({
      content: [validReport],
      totalElements: 12,
      totalPages: 1,
      number: 0,
      size: 20,
      numberOfElements: 1,
      first: true,
      last: true,
      empty: false,
    });

    expect(parsed.content).toHaveLength(1);
    expect(parsed.totalElements).toBe(12);
  });

  it('ignores the extra sort/pageable fields the backend sends', () => {
    const parsed = pageReportSchema.parse({
      content: [],
      totalElements: 0,
      sort: { empty: true, sorted: false, unsorted: true },
      pageable: { pageNumber: 0, pageSize: 20 },
    });

    expect(parsed.content).toEqual([]);
    expect(parsed.totalElements).toBe(0);
  });

  it('falls back to safe defaults when the page wrapper omits metadata', () => {
    const parsed = pageReportSchema.parse({});

    expect(parsed.content).toEqual([]);
    expect(parsed.totalPages).toBe(0);
    expect(parsed.first).toBe(true);
    expect(parsed.empty).toBe(false);
  });

  it('rejects a page whose content is not an array of reports', () => {
    expect(pageReportSchema.safeParse({ content: 'nope' }).success).toBe(false);
  });
});

describe('isModeratableStatus (BI-008)', () => {
  it('allows Resolve/Dismiss only for PENDING and REVIEWED', () => {
    expect(MODERATABLE_STATUSES).toEqual(['PENDING', 'REVIEWED']);
    expect(isModeratableStatus('PENDING')).toBe(true);
    expect(isModeratableStatus('REVIEWED')).toBe(true);
    expect(isModeratableStatus('RESOLVED')).toBe(false);
    expect(isModeratableStatus('DISMISSED')).toBe(false);
  });
});
