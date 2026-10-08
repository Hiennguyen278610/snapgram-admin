// @vitest-environment node
import { describe, it, expect, vi, afterEach } from 'vitest';
import { http, HttpResponse } from 'msw';
import { server } from '@/mocks/server';
import { resetReports } from '@/mocks/handlers/reports.handlers';
import type { ApiError } from '@/lib/api/types';
import {
  REPORTS_ENDPOINT,
  dismissReport,
  fetchReportDetail,
  fetchReports,
  resolveReport,
} from './reports.service';

const REPORTS_URL = 'http://localhost:8080/api/admin/reports';
const PENDING_POST_ID = '11111111-1111-1111-1111-111111111101';
const DISMISSED_POST_ID = '44444444-4444-4444-4444-444444444401';
const RESOLVED_POST_ID = '33333333-3333-3333-3333-333333333301';

describe('reports.service', () => {
  afterEach(() => {
    resetReports();
    vi.restoreAllMocks();
  });

  it('exposes the admin reports endpoint constant', () => {
    expect(REPORTS_ENDPOINT).toBe('/api/admin/reports');
  });

  it('returns all 12 seeded reports on the default page', async () => {
    const page = await fetchReports();

    expect(page.content).toHaveLength(12);
    expect(page.totalElements).toBe(12);
    expect(page.totalPages).toBe(1);
    expect(page.number).toBe(0);
    expect(page.size).toBe(20);
    expect(page.first).toBe(true);
    expect(page.last).toBe(true);
    expect(page.empty).toBe(false);
  });

  it('paginates with page/size', async () => {
    const page = await fetchReports({ page: 1, size: 5 });

    expect(page.content).toHaveLength(5);
    expect(page.number).toBe(1);
    expect(page.size).toBe(5);
    expect(page.totalPages).toBe(3);
    expect(page.first).toBe(false);
  });

  it('filters by status', async () => {
    const page = await fetchReports({ status: 'PENDING' });

    expect(page.totalElements).toBe(3);
    expect(page.content.every((report) => report.status === 'PENDING')).toBe(true);
  });

  it('filters by targetType independently of status (BI-009 expectation)', async () => {
    const page = await fetchReports({ targetType: 'USER' });

    expect(page.totalElements).toBe(4);
    expect(page.content.every((report) => report.targetType === 'USER')).toBe(true);
  });

  it('filters by status and targetType combined', async () => {
    const page = await fetchReports({ status: 'PENDING', targetType: 'USER' });

    expect(page.totalElements).toBe(1);
    expect(page.content[0].id).toBe('11111111-1111-1111-1111-111111111103');
  });

  it('returns an empty page when the requested page is past the last one', async () => {
    const page = await fetchReports({ status: 'RESOLVED', targetType: 'COMMENT', page: 5 });

    expect(page.content).toEqual([]);
    expect(page.totalElements).toBe(1);
    expect(page.empty).toBe(true);
  });

  it('omits status/targetType and never sends an empty string when they are undefined', async () => {
    let receivedUrl = '';
    server.use(
      http.get(REPORTS_URL, ({ request }) => {
        receivedUrl = request.url;
        return HttpResponse.json({ content: [] });
      })
    );

    await fetchReports({ page: 0, size: 20 });

    expect(receivedUrl).not.toContain('status=');
    expect(receivedUrl).not.toContain('targetType=');
    expect(receivedUrl).toContain('page=0');
    expect(receivedUrl).toContain('size=20');
  });

  it('sends UPPERCASE enum values for both filters', async () => {
    let receivedUrl = '';
    server.use(
      http.get(REPORTS_URL, ({ request }) => {
        receivedUrl = request.url;
        return HttpResponse.json({ content: [] });
      })
    );

    await fetchReports({ status: 'PENDING', targetType: 'POST' });

    expect(receivedUrl).toContain('status=PENDING');
    expect(receivedUrl).toContain('targetType=POST');
  });

  it('throws a normalized server ApiError when the list shape is invalid', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    server.use(http.get(REPORTS_URL, () => HttpResponse.json({ content: 'nope' })));

    await expect(fetchReports()).rejects.toMatchObject({
      httpStatus: 0,
      kind: 'server',
      message: 'Invalid response shape',
    } satisfies Partial<ApiError>);

    expect(warn).toHaveBeenCalledTimes(1);
  });

  it('propagates the normalized 500 ApiError from the interceptor', async () => {
    server.use(
      http.get(REPORTS_URL, () =>
        HttpResponse.json(
          { status: 500, error: 'Internal Server Error', message: 'An unexpected error occurred' },
          { status: 500 }
        )
      )
    );

    await expect(fetchReports()).rejects.toMatchObject({
      httpStatus: 500,
      kind: 'server',
    } satisfies Partial<ApiError>);
  });

  it('fetches a single report by id', async () => {
    const report = await fetchReportDetail(PENDING_POST_ID);

    expect(report.id).toBe(PENDING_POST_ID);
    expect(report.targetType).toBe('POST');
    expect(report.status).toBe('PENDING');
    expect(report.reporterId).toBe('56030fa2-b07b-4599-8c1f-e1e8b4da9622');
  });

  it('surfaces a 404 ApiError for an unknown report id', async () => {
    await expect(fetchReportDetail('does-not-exist')).rejects.toMatchObject({
      httpStatus: 404,
      kind: 'notFound',
    } satisfies Partial<ApiError>);
  });

  it('throws a normalized ApiError when the detail shape is invalid', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    server.use(http.get(`${REPORTS_URL}/:id`, () => HttpResponse.json({ nope: true })));

    await expect(fetchReportDetail(PENDING_POST_ID)).rejects.toMatchObject({
      httpStatus: 0,
      kind: 'server',
      message: 'Invalid response shape',
    } satisfies Partial<ApiError>);

    expect(warn).toHaveBeenCalledTimes(1);
  });

  it('resolves a pending report and persists the new status', async () => {
    const resolved = await resolveReport(PENDING_POST_ID);

    expect(resolved.status).toBe('RESOLVED');
    expect((await fetchReportDetail(PENDING_POST_ID)).status).toBe('RESOLVED');
  });

  it('keeps resolve idempotent on an already RESOLVED report', async () => {
    const resolved = await resolveReport(RESOLVED_POST_ID);

    expect(resolved.status).toBe('RESOLVED');
  });

  it('throws a normalized conflict ApiError when resolving a DISMISSED report (BI-008)', async () => {
    await expect(resolveReport(DISMISSED_POST_ID)).rejects.toMatchObject({
      httpStatus: 409,
      kind: 'conflict',
    } satisfies Partial<ApiError>);
  });

  it('throws a normalized ApiError when the resolve response shape is invalid', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    server.use(http.patch(`${REPORTS_URL}/:id/resolve`, () => HttpResponse.json({ nope: true })));

    await expect(resolveReport(PENDING_POST_ID)).rejects.toMatchObject({
      message: 'Invalid response shape',
    } satisfies Partial<ApiError>);

    expect(warn).toHaveBeenCalledTimes(1);
  });

  it('dismisses a report and persists the new status', async () => {
    const dismissed = await dismissReport(PENDING_POST_ID);

    expect(dismissed.status).toBe('DISMISSED');
    expect((await fetchReportDetail(PENDING_POST_ID)).status).toBe('DISMISSED');
  });

  it('returns a 404 for dismissing an unknown report', async () => {
    await expect(dismissReport('does-not-exist')).rejects.toMatchObject({
      httpStatus: 404,
      kind: 'notFound',
    } satisfies Partial<ApiError>);
  });

  it('throws a normalized ApiError when the dismiss response shape is invalid', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    server.use(http.patch(`${REPORTS_URL}/:id/dismiss`, () => HttpResponse.json({ nope: true })));

    await expect(dismissReport(PENDING_POST_ID)).rejects.toMatchObject({
      message: 'Invalid response shape',
    } satisfies Partial<ApiError>);

    expect(warn).toHaveBeenCalledTimes(1);
  });

  it('escape-encodes the path id so a hostile id cannot change the route', async () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    let receivedUrl = '';
    server.use(
      http.get(`${REPORTS_URL}/:id`, ({ request }) => {
        receivedUrl = request.url;
        return HttpResponse.json({ nope: true });
      })
    );

    await expect(fetchReportDetail('a/b c')).rejects.toBeTruthy();

    expect(receivedUrl).toContain('a%2Fb%20c');
  });

  it('resetReports restores the default fixture set', async () => {
    await resolveReport(PENDING_POST_ID);
    resetReports();

    expect((await fetchReportDetail(PENDING_POST_ID)).status).toBe('PENDING');
  });
});
