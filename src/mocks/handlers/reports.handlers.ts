import { http, HttpResponse } from 'msw';
import type { ReportStatus, ReportTargetType } from '@/lib/api/query-keys';

const REPORTS_URL = 'http://localhost:8080/api/admin/reports';

/** Same reporter for every seed row — `scripts/dev-seed-reports.sql` does that. */
const REPORTER_ID = '56030fa2-b07b-4599-8c1f-e1e8b4da9622';

export interface MockReport {
  id: string;
  reporterId: string;
  targetType: ReportTargetType;
  targetId: string;
  reason: string;
  description: string | null;
  status: ReportStatus;
  createdAt: string;
  targetContent?: string | null;
  targetMediaUrls?: string[];
  targetAuthorId?: string | null;
  targetAuthorUsername?: string | null;
  targetAuthorDisplayName?: string | null;
  targetAuthorAvatarUrl?: string | null;
  targetStatus?: string | null;
  targetCreatedAt?: string | null;
}

/**
 * The exact 12 rows inserted by `scripts/dev-seed-reports.sql`
 * (3 per status x 4 rows per targetType). Deterministic `createdAt` values
 * mirror the seed's `NOW()` / `NOW() - INTERVAL '1 day'` / `- 2 days` ordering.
 */
export const REPORT_FIXTURE: readonly MockReport[] = [
  {
    id: '11111111-1111-1111-1111-111111111101',
    reporterId: REPORTER_ID,
    targetType: 'POST',
    targetId: 'aaaa1111-1111-1111-1111-111111111101',
    reason: 'spam',
    description: 'Spam content',
    status: 'PENDING',
    createdAt: '2026-10-08T06:00:01Z',
    targetContent: 'Violating post caption text',
    targetMediaUrls: ['http://localhost:9000/media/sample.jpg'],
    targetAuthorUsername: 'spammer_user',
    targetAuthorDisplayName: 'Spammer Account',
    targetStatus: 'ACTIVE',
  },
  {
    id: '11111111-1111-1111-1111-111111111102',
    reporterId: REPORTER_ID,
    targetType: 'COMMENT',
    targetId: 'aaaa1111-1111-1111-1111-111111111102',
    reason: 'harassment',
    description: 'Harassing comment',
    status: 'PENDING',
    createdAt: '2026-10-08T06:00:02Z',
  },
  {
    id: '11111111-1111-1111-1111-111111111103',
    reporterId: REPORTER_ID,
    targetType: 'USER',
    targetId: 'aaaa1111-1111-1111-1111-111111111103',
    reason: 'fake_account',
    description: 'Suspected fake account',
    status: 'PENDING',
    createdAt: '2026-10-08T06:00:03Z',
  },
  {
    id: '22222222-2222-2222-2222-222222222201',
    reporterId: REPORTER_ID,
    targetType: 'POST',
    targetId: 'aaaa2222-2222-2222-2222-222222222201',
    reason: 'copyright',
    description: 'Copyright violation',
    status: 'REVIEWED',
    createdAt: '2026-10-08T06:10:01Z',
  },
  {
    id: '22222222-2222-2222-2222-222222222202',
    reporterId: REPORTER_ID,
    targetType: 'COMMENT',
    targetId: 'aaaa2222-2222-2222-2222-222222222202',
    reason: 'hate_speech',
    description: 'Hate speech',
    status: 'REVIEWED',
    createdAt: '2026-10-08T06:10:02Z',
  },
  {
    id: '22222222-2222-2222-2222-222222222203',
    reporterId: REPORTER_ID,
    targetType: 'USER',
    targetId: 'aaaa2222-2222-2222-2222-222222222203',
    reason: 'impersonation',
    description: 'Impersonating someone',
    status: 'REVIEWED',
    createdAt: '2026-10-08T06:10:03Z',
  },
  {
    id: '33333333-3333-3333-3333-333333333301',
    reporterId: REPORTER_ID,
    targetType: 'POST',
    targetId: 'aaaa3333-3333-3333-3333-333333333301',
    reason: 'spam',
    description: 'Handled: content deleted',
    status: 'RESOLVED',
    createdAt: '2026-10-07T06:00:01Z',
  },
  {
    id: '33333333-3333-3333-3333-333333333302',
    reporterId: REPORTER_ID,
    targetType: 'COMMENT',
    targetId: 'aaaa3333-3333-3333-3333-333333333302',
    reason: 'harassment',
    description: 'Handled: comment removed',
    status: 'RESOLVED',
    createdAt: '2026-10-07T06:00:02Z',
  },
  {
    id: '33333333-3333-3333-3333-333333333303',
    reporterId: REPORTER_ID,
    targetType: 'USER',
    targetId: 'aaaa3333-3333-3333-3333-333333333303',
    reason: 'fake_account',
    description: 'Handled: user warned',
    status: 'RESOLVED',
    createdAt: '2026-10-07T06:00:03Z',
  },
  {
    id: '44444444-4444-4444-4444-444444444401',
    reporterId: REPORTER_ID,
    targetType: 'POST',
    targetId: 'aaaa4444-4444-4444-4444-444444444401',
    reason: 'spam',
    description: 'Dismissed: not spam',
    status: 'DISMISSED',
    createdAt: '2026-10-06T06:00:01Z',
  },
  {
    id: '44444444-4444-4444-4444-444444444402',
    reporterId: REPORTER_ID,
    targetType: 'COMMENT',
    targetId: 'aaaa4444-4444-4444-4444-444444444402',
    reason: 'off_topic',
    description: 'Dismissed: not violation',
    status: 'DISMISSED',
    createdAt: '2026-10-06T06:00:02Z',
  },
  {
    id: '44444444-4444-4444-4444-444444444403',
    reporterId: REPORTER_ID,
    targetType: 'USER',
    targetId: 'aaaa4444-4444-4444-4444-444444444403',
    reason: 'spam',
    description: 'Dismissed: no evidence',
    status: 'DISMISSED',
    createdAt: '2026-10-06T06:00:03Z',
  },
];

/** Mutable module state so mutations are observable across queries. */
let reports: MockReport[] = REPORT_FIXTURE.map((report) => ({ ...report }));

/** Restores the deterministic fixture set (used by tests between cases). */
export function resetReports(): void {
  reports = REPORT_FIXTURE.map((report) => ({ ...report }));
}

/** Builds a report from the fixture shape, overriding only what a test needs. */
export function makeReport(overrides: Partial<MockReport> = {}): MockReport {
  return { ...REPORT_FIXTURE[0], ...overrides };
}

function byId(id: string): MockReport | undefined {
  return reports.find((report) => report.id === id);
}

function notFound(id: string) {
  return HttpResponse.json(
    {
      status: 404,
      error: 'Not Found',
      message: `Report not found: ${id}`,
      timestamp: new Date().toISOString(),
    },
    { status: 404 }
  );
}

export const reportsHandlers = [
  http.get(REPORTS_URL, ({ request }) => {
    const searchParams = new URL(request.url).searchParams;
    const page = Math.max(0, Number(searchParams.get('page') ?? 0));
    const rawSize = Number(searchParams.get('size') ?? 20);
    // The live backend caps `size` at 50; mirror that here.
    const size = Math.min(rawSize > 0 ? rawSize : 20, 50);
    const status = searchParams.get('status');
    const targetType = searchParams.get('targetType');

    // TODO(BI-009): the live backend ignores `targetType` when `status` is
    // absent. This mock filters both params independently (and combined) on
    // purpose so the FE contract is exercised as specified.
    const filtered = reports.filter(
      (report) =>
        (!status || report.status === status) && (!targetType || report.targetType === targetType)
    );

    const totalElements = filtered.length;
    const totalPages = Math.ceil(totalElements / size);
    const content = filtered.slice(page * size, page * size + size);

    return HttpResponse.json({
      content,
      totalElements,
      totalPages,
      number: page,
      size,
      numberOfElements: content.length,
      first: page === 0,
      last: page >= totalPages - 1,
      empty: content.length === 0,
    });
  }),

  http.get(`${REPORTS_URL}/:id`, ({ params }) => {
    const report = byId(String(params.id));
    if (!report) return notFound(String(params.id));

    return HttpResponse.json({ ...report });
  }),

  http.patch(`${REPORTS_URL}/:id/resolve`, ({ params }) => {
    const report = byId(String(params.id));
    if (!report) return notFound(String(params.id));

    // BI-008: the live backend throws IllegalArgumentException on this
    // transition and the catch-all handler turns it into a 500. The mock models
    // the DESIRED 409 instead of reproducing the bug, so the FE keeps the
    // contract it should have once the backend is fixed.
    if (report.status === 'DISMISSED') {
      return HttpResponse.json(
        {
          status: 409,
          error: 'Conflict',
          message: 'Dismissed report cannot be resolved',
          timestamp: new Date().toISOString(),
        },
        { status: 409 }
      );
    }

    // Already RESOLVED -> idempotent 200 (matches the live backend).
    report.status = 'RESOLVED';

    return HttpResponse.json({ ...report });
  }),

  http.patch(`${REPORTS_URL}/:id/dismiss`, ({ params }) => {
    const report = byId(String(params.id));
    if (!report) return notFound(String(params.id));

    report.status = 'DISMISSED';

    return HttpResponse.json({ ...report });
  }),
];
