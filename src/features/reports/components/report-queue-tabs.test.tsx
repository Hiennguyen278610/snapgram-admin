import { describe, it, expect, vi, beforeEach } from 'vitest';
import userEvent from '@testing-library/user-event';
import { renderWithProviders, screen } from '@/test-utils/render';
import { ReportQueueTabs } from './report-queue-tabs';

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

function lastParams(): URLSearchParams {
  const calls = spy.replace.mock.calls;
  const url = String(calls[calls.length - 1]?.[0] ?? '');
  return new URLSearchParams(url.includes('?') ? url.slice(url.indexOf('?') + 1) : '');
}

describe('ReportQueueTabs', () => {
  beforeEach(() => {
    spy.replace.mockReset();
    spy.searchParams.value = new URLSearchParams();
  });

  it('renders the 5 tabs (All + 4 statuses)', () => {
    renderWithProviders(<ReportQueueTabs />);

    const tabs = screen.getAllByRole('tab');
    expect(tabs).toHaveLength(5);
    expect(tabs.map((tab) => tab.textContent)).toEqual([
      'All',
      'Pending',
      'Reviewed',
      'Resolved',
      'Dismissed',
    ]);
  });

  it('selects the All tab when no status param is present', () => {
    renderWithProviders(<ReportQueueTabs />);

    expect(screen.getByRole('tab', { name: 'All' })).toHaveAttribute('data-state', 'active');
  });

  it('derives the active tab from the URL status param', () => {
    spy.searchParams.value = new URLSearchParams({ status: 'RESOLVED' });
    renderWithProviders(<ReportQueueTabs />);

    expect(screen.getByRole('tab', { name: 'Resolved' })).toHaveAttribute('data-state', 'active');
    expect(screen.getByRole('tab', { name: 'All' })).toHaveAttribute('data-state', 'inactive');
  });

  it('writes the status to the URL and resets the page when a tab is clicked', async () => {
    spy.searchParams.value = new URLSearchParams({ page: '3', size: '20' });
    renderWithProviders(<ReportQueueTabs />);

    await userEvent.click(screen.getByRole('tab', { name: 'Pending' }));

    expect(spy.replace).toHaveBeenCalledWith(expect.stringContaining('/admin/moderation/reports'), {
      scroll: false,
    });
    expect(lastParams().get('status')).toBe('PENDING');
    expect(lastParams().get('page')).toBe('0');
  });

  it('clears the status param when the All tab is clicked', async () => {
    spy.searchParams.value = new URLSearchParams({ status: 'DISMISSED', page: '1', size: '20' });
    renderWithProviders(<ReportQueueTabs />);

    await userEvent.click(screen.getByRole('tab', { name: 'All' }));

    expect(lastParams().has('status')).toBe(false);
    expect(lastParams().get('page')).toBe('0');
  });
});
