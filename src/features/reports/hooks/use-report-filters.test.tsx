import { describe, it, expect, vi, beforeEach } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { useReportFilters } from './use-report-filters';

const spy = vi.hoisted(() => ({
  replace: vi.fn(),
  searchParams: { value: new URLSearchParams() },
}));

vi.mock('next/navigation', () => ({
  useSearchParams: () => spy.searchParams.value,
}));

vi.mock('@/i18n/navigation', () => ({
  useRouter: () => ({ replace: spy.replace, push: vi.fn(), prefetch: vi.fn(), back: vi.fn() }),
  usePathname: () => '/admin/moderation/reports',
}));

const PATHNAME = '/admin/moderation/reports';

function lastUrl(): string {
  const calls = spy.replace.mock.calls;
  return String(calls[calls.length - 1]?.[0] ?? '');
}

function lastParams(): URLSearchParams {
  const url = lastUrl();
  return new URLSearchParams(url.includes('?') ? url.slice(url.indexOf('?') + 1) : '');
}

describe('useReportFilters (route-map §7 URL state)', () => {
  beforeEach(() => {
    spy.replace.mockReset();
    spy.searchParams.value = new URLSearchParams();
  });

  it('defaults to page 0 / size 20 with no status or targetType', () => {
    const { result } = renderHook(() => useReportFilters());

    expect(result.current.status).toBeUndefined();
    expect(result.current.targetType).toBeUndefined();
    expect(result.current.page).toBe(0);
    expect(result.current.size).toBe(20);
    expect(result.current.filters).toEqual({ page: 0, size: 20 });
  });

  it('reads status, targetType, page and size from the URL', () => {
    spy.searchParams.value = new URLSearchParams({
      status: 'PENDING',
      targetType: 'USER',
      page: '2',
      size: '10',
    });

    const { result } = renderHook(() => useReportFilters());

    expect(result.current.status).toBe('PENDING');
    expect(result.current.targetType).toBe('USER');
    expect(result.current.page).toBe(2);
    expect(result.current.size).toBe(10);
    expect(result.current.filters).toEqual({
      status: 'PENDING',
      targetType: 'USER',
      page: 2,
      size: 10,
    });
  });

  it('ignores unknown or lowercase enum values instead of forwarding them (BI-009)', () => {
    spy.searchParams.value = new URLSearchParams({ status: 'pending', targetType: 'bogus' });

    const { result } = renderHook(() => useReportFilters());

    expect(result.current.status).toBeUndefined();
    expect(result.current.targetType).toBeUndefined();
    expect(result.current.filters).toEqual({ page: 0, size: 20 });
  });

  it('falls back to safe defaults for malformed page/size params', () => {
    spy.searchParams.value = new URLSearchParams({ page: '-3', size: 'abc' });

    const { result } = renderHook(() => useReportFilters());

    expect(result.current.page).toBe(0);
    expect(result.current.size).toBe(20);
  });

  it('writes the tab status to the URL and resets the page to 0', () => {
    spy.searchParams.value = new URLSearchParams({ page: '2', size: '20' });
    const { result } = renderHook(() => useReportFilters());

    act(() => result.current.setStatus('PENDING'));

    expect(spy.replace).toHaveBeenCalledWith(expect.stringContaining(PATHNAME), { scroll: false });
    expect(lastParams().get('status')).toBe('PENDING');
    expect(lastParams().get('page')).toBe('0');
    expect(lastParams().get('size')).toBe('20');
  });

  it('clears the status param when the All tab is selected', () => {
    spy.searchParams.value = new URLSearchParams({ status: 'RESOLVED', page: '1', size: '20' });
    const { result } = renderHook(() => useReportFilters());

    act(() => result.current.setStatus(undefined));

    expect(lastParams().has('status')).toBe(false);
    expect(lastParams().get('page')).toBe('0');
  });

  it('writes the targetType in UPPERCASE and resets the page to 0', () => {
    spy.searchParams.value = new URLSearchParams({ status: 'PENDING', page: '3', size: '20' });
    const { result } = renderHook(() => useReportFilters());

    act(() => result.current.setTargetType('COMMENT'));

    expect(lastParams().get('targetType')).toBe('COMMENT');
    expect(lastParams().get('status')).toBe('PENDING');
    expect(lastParams().get('page')).toBe('0');
  });

  it('clears the targetType param when All is selected', () => {
    spy.searchParams.value = new URLSearchParams({ targetType: 'POST', size: '20' });
    const { result } = renderHook(() => useReportFilters());

    act(() => result.current.setTargetType(undefined));

    expect(lastParams().has('targetType')).toBe(false);
  });

  it('changes only the page and preserves the active filters', () => {
    spy.searchParams.value = new URLSearchParams({
      status: 'REVIEWED',
      targetType: 'USER',
      page: '0',
      size: '20',
    });
    const { result } = renderHook(() => useReportFilters());

    act(() => result.current.setPage(4));

    expect(lastParams().get('page')).toBe('4');
    expect(lastParams().get('status')).toBe('REVIEWED');
    expect(lastParams().get('targetType')).toBe('USER');
  });

  it('clamps a negative page to 0', () => {
    const { result } = renderHook(() => useReportFilters());

    act(() => result.current.setPage(-5));

    expect(lastParams().get('page')).toBe('0');
  });
});
