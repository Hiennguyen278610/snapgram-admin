import { describe, it, expect, vi, beforeEach } from 'vitest';
import userEvent from '@testing-library/user-event';
import { renderWithProviders, screen } from '@/test-utils/render';
import type { ApiError } from '@/lib/api/types';
import { useReportDetail } from '../hooks/use-report-detail';
import type { Report } from '../schemas/report.schema';
import { ReportDetailDialog } from './report-detail-dialog';

vi.mock('../hooks/use-report-detail');

const mockedUseReportDetail = vi.mocked(useReportDetail);

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

function mockDetail(
  overrides: {
    report?: Report;
    isLoading?: boolean;
    error?: ApiError | null;
  } = {}
) {
  const refetch = vi.fn();
  mockedUseReportDetail.mockReturnValue({
    data: overrides.report,
    isLoading: overrides.isLoading ?? false,
    isError: Boolean(overrides.error),
    error: overrides.error ?? null,
    refetch,
  } as unknown as ReturnType<typeof useReportDetail>);
  return { refetch };
}

function renderDialog(props: Partial<React.ComponentProps<typeof ReportDetailDialog>> = {}) {
  return renderWithProviders(
    <ReportDetailDialog
      reportId="11111111-1111-1111-1111-111111111101"
      open
      onOpenChange={vi.fn()}
      {...props}
    />
  );
}

describe('ReportDetailDialog', () => {
  beforeEach(() => {
    mockedUseReportDetail.mockReset();
  });

  it('shows the loading skeleton while the detail query is pending', () => {
    mockDetail({ isLoading: true });
    renderDialog();

    expect(screen.getByRole('status')).toHaveAttribute('aria-busy', 'true');
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('renders every field of the report', () => {
    mockDetail({ report: makeReport() });
    renderDialog();

    expect(screen.getByText('Report details')).toBeInTheDocument();
    expect(screen.getByText('11111111-1111-1111-1111-111111111101')).toBeInTheDocument();
    expect(screen.getByText('56030fa2-b07b-4599-8c1f-e1e8b4da9622')).toBeInTheDocument();
    expect(screen.getByText('aaaa1111-1111-1111-1111-111111111101')).toBeInTheDocument();
    expect(screen.getByText('spam')).toBeInTheDocument();
    expect(screen.getByText('Spam content')).toBeInTheDocument();
    expect(screen.getByText('Pending')).toBeInTheDocument();
    expect(screen.getByText('Post')).toBeInTheDocument();
  });

  it('hides the description row when the backend returns null', () => {
    mockDetail({ report: makeReport({ description: null }) });
    renderDialog();

    expect(screen.queryByText('Details')).not.toBeInTheDocument();
  });

  it('shows a not-found state for a 404 (error-handling §5)', () => {
    mockDetail({ error: { httpStatus: 404, kind: 'notFound', message: 'Report not found' } });
    renderDialog();

    expect(screen.getByText('This report could not be found.')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Resolve' })).not.toBeInTheDocument();
  });

  it('shows the mapped error with a retry for any other failure', async () => {
    const { refetch } = mockDetail({
      error: { httpStatus: 500, kind: 'server', message: 'boom' },
    });
    renderDialog();

    expect(screen.getByText('Internal server error.')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Retry' }));
    expect(refetch).toHaveBeenCalledTimes(1);
  });

  it.each(['PENDING', 'REVIEWED'] as const)(
    'enables Resolve/Dismiss for a %s report and forwards the action',
    async (status) => {
      const onResolve = vi.fn();
      const onDismiss = vi.fn();
      mockDetail({ report: makeReport({ status }) });
      renderDialog({ onResolve, onDismiss });

      const resolve = screen.getByRole('button', { name: 'Resolve' });
      const dismiss = screen.getByRole('button', { name: 'Dismiss' });
      expect(resolve).toBeEnabled();
      expect(dismiss).toBeEnabled();
      expect(screen.queryByText(/only be reviewed/i)).not.toBeInTheDocument();

      await userEvent.click(resolve);
      await userEvent.click(dismiss);

      expect(onResolve).toHaveBeenCalledWith(expect.objectContaining({ status }));
      expect(onDismiss).toHaveBeenCalledWith(expect.objectContaining({ status }));
    }
  );

  it.each(['RESOLVED', 'DISMISSED'] as const)(
    'disables Resolve/Dismiss and explains why for a %s report (BI-008)',
    (status) => {
      const onResolve = vi.fn();
      const onDismiss = vi.fn();
      mockDetail({ report: makeReport({ status }) });
      renderDialog({ onResolve, onDismiss });

      const resolve = screen.getByRole('button', { name: 'Resolve' });
      const dismiss = screen.getByRole('button', { name: 'Dismiss' });

      expect(resolve).toBeDisabled();
      expect(dismiss).toBeDisabled();
      expect(resolve).toHaveAttribute('title', 'Resolved and dismissed reports are read-only');
      expect(screen.getByText(/already closed and can only be reviewed/i)).toBeInTheDocument();
    }
  );

  it('does not fire the actions for a read-only report', async () => {
    const onResolve = vi.fn();
    mockDetail({ report: makeReport({ status: 'RESOLVED' }) });
    renderDialog({ onResolve });

    await userEvent.click(screen.getByRole('button', { name: 'Resolve' }));

    expect(onResolve).not.toHaveBeenCalled();
  });

  it('exposes a labelled close button', () => {
    mockDetail({ report: makeReport() });
    renderDialog();

    expect(screen.getByRole('button', { name: 'Close report details' })).toBeInTheDocument();
  });

  it('renders reported content preview card with author and media', () => {
    const report = makeReport({
      targetContent: 'Spam post caption text',
      targetAuthorUsername: 'spammer_99',
      targetAuthorDisplayName: 'Spammer Guy',
      targetMediaUrls: ['https://example.com/bad-image.jpg'],
      targetStatus: 'ACTIVE',
    });
    mockDetail({ report });

    renderDialog();

    expect(screen.getByText('Reported Content Preview')).toBeInTheDocument();
    expect(screen.getByText('Spammer Guy')).toBeInTheDocument();
    expect(screen.getByText('@spammer_99')).toBeInTheDocument();
    expect(screen.getByText('Spam post caption text')).toBeInTheDocument();
    expect(screen.getByRole('img', { name: 'Reported media 1' })).toBeInTheDocument();
  });
});
