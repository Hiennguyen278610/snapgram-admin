import { describe, it, expect, vi, beforeEach } from 'vitest';
import userEvent from '@testing-library/user-event';
import { renderWithProviders, screen, waitFor } from '@/test-utils/render';
import type { Report } from '../schemas/report.schema';
import { ReportQueueTable } from './report-queue-table';

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

function makeReport(overrides: Partial<Report> = {}): Report {
  return {
    id: '11111111-1111-1111-1111-111111111101',
    reporterId: '56030fa2-b07b-4599-8c1f-e1e8b4da9622',
    targetType: 'POST',
    targetId: 'aaaa1111-1111-1111-1111-111111111101',
    reason: 'spam',
    description: 'Spam content',
    status: 'PENDING',
    createdAt: '2026-10-08T06:00:01Z',
    ...overrides,
  };
}

const pendingReport = makeReport();
const reviewedReport = makeReport({
  id: '22222222-2222-2222-2222-222222222203',
  targetType: 'USER',
  targetId: 'aaaa2222-2222-2222-2222-222222222203',
  reason: 'impersonation',
  status: 'REVIEWED',
});
const resolvedReport = makeReport({
  id: '33333333-3333-3333-3333-333333333301',
  reason: 'handled',
  status: 'RESOLVED',
});
const dismissedReport = makeReport({
  id: '44444444-4444-4444-4444-444444444401',
  reason: 'rejected',
  status: 'DISMISSED',
});

const readyProps = {
  status: 'ready' as const,
  page: 0,
  totalPages: 1,
  onSelectReport: vi.fn(),
  onPageChange: vi.fn(),
  onAction: vi.fn(),
};

describe('ReportQueueTable', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    spy.searchParams.value = new URLSearchParams();
  });

  it('renders the loading skeleton (7 columns, busy status)', () => {
    renderWithProviders(<ReportQueueTable status="loading" />);

    expect(screen.getByRole('status')).toHaveAttribute('aria-busy', 'true');
    expect(screen.getAllByRole('columnheader')).toHaveLength(7);
  });

  it('renders the empty state', () => {
    renderWithProviders(<ReportQueueTable status="empty" />);

    expect(screen.getByRole('heading', { name: 'No reports here' })).toBeInTheDocument();
  });

  it('renders the error state and retries', async () => {
    const onRetry = vi.fn();
    renderWithProviders(
      <ReportQueueTable
        status="error"
        error={{ httpStatus: 500, kind: 'server', message: 'boom' }}
        onRetry={onRetry}
      />
    );

    expect(screen.getByRole('heading', { name: 'Failed to load reports' })).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Retry' }));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it('renders one row per report with the shortened id and full id title', () => {
    renderWithProviders(
      <ReportQueueTable {...readyProps} reports={[pendingReport, reviewedReport]} />
    );

    expect(screen.getByTitle(pendingReport.id)).toHaveTextContent('11111111');
    expect(screen.getByText('spam')).toBeInTheDocument();
    expect(screen.getByText('impersonation')).toBeInTheDocument();
    expect(screen.getByText('Post')).toBeInTheDocument();
    expect(screen.getByText('Account')).toBeInTheDocument();
    // header row + 2 data rows
    expect(screen.getAllByRole('row')).toHaveLength(3);
  });

  it('opens the detail sheet when a row is clicked', async () => {
    const onSelectReport = vi.fn();
    renderWithProviders(
      <ReportQueueTable {...readyProps} onSelectReport={onSelectReport} reports={[pendingReport]} />
    );

    await userEvent.click(screen.getByTitle(pendingReport.id));

    expect(onSelectReport).toHaveBeenCalledWith(pendingReport.id);
  });

  it('opens the detail sheet from the keyboard (Enter)', async () => {
    const onSelectReport = vi.fn();
    renderWithProviders(
      <ReportQueueTable {...readyProps} onSelectReport={onSelectReport} reports={[pendingReport]} />
    );

    const row = screen.getAllByRole('row')[1];
    row.focus();
    await userEvent.keyboard('{Enter}');

    expect(onSelectReport).toHaveBeenCalledWith(pendingReport.id);
  });

  it('renders the row action menu with view/resolve/dismiss enabled for PENDING', async () => {
    const onAction = vi.fn();
    renderWithProviders(
      <ReportQueueTable {...readyProps} onAction={onAction} reports={[pendingReport]} />
    );

    await userEvent.click(screen.getByRole('button', { name: 'Report actions' }));
    const resolveItem = await screen.findByRole('menuitem', { name: /^Resolve$/ });
    expect(resolveItem).not.toHaveAttribute('aria-disabled', 'true');

    await userEvent.click(await screen.findByRole('menuitem', { name: /View report/ }));
    expect(onAction).toHaveBeenCalledWith('view', pendingReport);
  });

  it('reports resolve and dismiss from the action menu for PENDING/REVIEWED', async () => {
    const onAction = vi.fn();
    renderWithProviders(
      <ReportQueueTable {...readyProps} onAction={onAction} reports={[reviewedReport]} />
    );

    await userEvent.click(screen.getByRole('button', { name: 'Report actions' }));
    await userEvent.click(await screen.findByRole('menuitem', { name: /^Resolve$/ }));
    expect(onAction).toHaveBeenCalledWith('resolve', reviewedReport);

    await userEvent.click(screen.getByRole('button', { name: 'Report actions' }));
    await userEvent.click(await screen.findByRole('menuitem', { name: /^Dismiss$/ }));
    expect(onAction).toHaveBeenCalledWith('dismiss', reviewedReport);
  });

  it.each([
    ['RESOLVED', resolvedReport],
    ['DISMISSED', dismissedReport],
  ] as const)('disables Resolve/Dismiss for a %s report (BI-008)', async (_status, report) => {
    renderWithProviders(<ReportQueueTable {...readyProps} reports={[report]} />);

    await userEvent.click(screen.getByRole('button', { name: 'Report actions' }));

    await waitFor(() =>
      expect(screen.getByRole('menuitem', { name: /^Resolve$/ })).toHaveAttribute(
        'aria-disabled',
        'true'
      )
    );
    expect(screen.getByRole('menuitem', { name: /^Dismiss$/ })).toHaveAttribute(
      'aria-disabled',
      'true'
    );
  });

  it('hides the pagination controls when there is a single page', () => {
    renderWithProviders(<ReportQueueTable {...readyProps} reports={[pendingReport]} />);

    expect(screen.queryByRole('button', { name: /Next/ })).not.toBeInTheDocument();
  });

  it('paginates and disables Previous on the first page', async () => {
    const onPageChange = vi.fn();
    renderWithProviders(
      <ReportQueueTable
        {...readyProps}
        page={0}
        totalPages={3}
        onPageChange={onPageChange}
        reports={[pendingReport]}
      />
    );

    expect(screen.getByRole('button', { name: /Previous/ })).toBeDisabled();
    expect(screen.getByText('Page 1 of 3')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: /Next/ }));
    expect(onPageChange).toHaveBeenCalledWith(1);
  });

  it('disables Next on the last page and allows going back', async () => {
    const onPageChange = vi.fn();
    renderWithProviders(
      <ReportQueueTable
        {...readyProps}
        page={2}
        totalPages={3}
        onPageChange={onPageChange}
        reports={[pendingReport]}
      />
    );

    expect(screen.getByRole('button', { name: /Next/ })).toBeDisabled();

    await userEvent.click(screen.getByRole('button', { name: /Previous/ }));
    expect(onPageChange).toHaveBeenCalledWith(1);
  });
});
