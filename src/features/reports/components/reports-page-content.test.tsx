import { describe, it, expect, vi, beforeEach } from 'vitest';
import userEvent from '@testing-library/user-event';
import { renderWithProviders, screen, waitFor, within } from '@/test-utils/render';
import type { ApiError } from '@/lib/api/types';
import { useDismissReport } from '../hooks/use-dismiss-report';
import { useReportDetail } from '../hooks/use-report-detail';
import { useReportsList } from '../hooks/use-reports-list';
import { useResolveReport } from '../hooks/use-resolve-report';
import type { PageReport, Report } from '../schemas/report.schema';
import { ReportsPageContent } from './reports-page-content';

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

vi.mock('../hooks/use-reports-list');
vi.mock('../hooks/use-report-detail');
vi.mock('../hooks/use-resolve-report');
vi.mock('../hooks/use-dismiss-report');

// Radix Select needs browser APIs jsdom does not implement.
class ResizeObserverStub {
  observe() {}
  unobserve() {}
  cleanup() {}
  disconnect() {}
}
vi.stubGlobal('ResizeObserver', ResizeObserverStub);
Element.prototype.hasPointerCapture = () => false;
Element.prototype.scrollIntoView = () => {};

const mockedUseReportsList = vi.mocked(useReportsList);
const mockedUseReportDetail = vi.mocked(useReportDetail);
const mockedUseResolveReport = vi.mocked(useResolveReport);
const mockedUseDismissReport = vi.mocked(useDismissReport);

const pendingReport: Report = {
  id: '11111111-1111-1111-1111-111111111101',
  reporterId: '56030fa2-b07b-4599-8c1f-e1e8b4da9622',
  targetType: 'POST',
  targetId: 'aaaa1111-1111-1111-1111-111111111101',
  reason: 'spam',
  description: 'Spam content',
  status: 'PENDING',
  createdAt: '2026-10-08T06:00:01Z',
};

const page: PageReport = {
  content: [pendingReport],
  totalElements: 12,
  totalPages: 2,
  number: 0,
  size: 20,
  numberOfElements: 1,
  first: true,
  last: false,
  empty: false,
};

function mockList(
  overrides: {
    data?: PageReport;
    isLoading?: boolean;
    isError?: boolean;
    isFetching?: boolean;
    error?: ApiError | null;
  } = {}
) {
  const refetch = vi.fn();
  mockedUseReportsList.mockReturnValue({
    data: overrides.data,
    isLoading: overrides.isLoading ?? false,
    isError: overrides.isError ?? false,
    isFetching: overrides.isFetching ?? false,
    error: overrides.error ?? null,
    refetch,
  } as unknown as ReturnType<typeof useReportsList>);
  return { refetch };
}

function mockMutations() {
  const resolveMutate = vi.fn();
  const dismissMutate = vi.fn();
  mockedUseResolveReport.mockReturnValue({
    mutate: resolveMutate,
    isPending: false,
  } as unknown as ReturnType<typeof useResolveReport>);
  mockedUseDismissReport.mockReturnValue({
    mutate: dismissMutate,
    isPending: false,
  } as unknown as ReturnType<typeof useDismissReport>);
  return { resolveMutate, dismissMutate };
}

function mockDetail(report?: Report) {
  mockedUseReportDetail.mockReturnValue({
    data: report,
    isLoading: false,
    isError: false,
    error: null,
    refetch: vi.fn(),
  } as unknown as ReturnType<typeof useReportDetail>);
}

describe('ReportsPageContent', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    spy.searchParams.value = new URLSearchParams();
    mockMutations();
    mockDetail();
  });

  it('keeps the page heading and shows the skeleton while loading', () => {
    mockList({ isLoading: true });
    renderWithProviders(<ReportsPageContent />);

    expect(screen.getByRole('heading', { name: 'Content Moderation' })).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveAttribute('aria-busy', 'true');
    expect(screen.getAllByRole('tab')).toHaveLength(5);
    expect(screen.getByRole('combobox')).toBeInTheDocument();
  });

  it('shows the error state and retries the query', async () => {
    const { refetch } = mockList({
      isError: true,
      error: { httpStatus: 500, kind: 'server', message: 'boom' },
    });
    renderWithProviders(<ReportsPageContent />);

    expect(screen.getByRole('heading', { name: 'Content Moderation' })).toBeInTheDocument();
    expect(screen.getByText('Failed to load reports')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Retry' }));
    expect(refetch).toHaveBeenCalledTimes(1);
  });

  it('shows the empty state when the queue has no reports', () => {
    mockList({ data: { ...page, content: [], totalElements: 0, empty: true } });
    renderWithProviders(<ReportsPageContent />);

    expect(screen.getByRole('heading', { name: 'No reports here' })).toBeInTheDocument();
  });

  it('renders the queue table with the reports and the pagination', () => {
    mockList({ data: page });
    renderWithProviders(<ReportsPageContent />);

    expect(screen.getByTitle(pendingReport.id)).toHaveTextContent('11111111');
    expect(screen.getByRole('button', { name: /Next/ })).toBeInTheDocument();
    expect(screen.getByText('Page 1 of 2')).toBeInTheDocument();
  });

  it('requests the next page through the URL state', async () => {
    mockList({ data: page });
    renderWithProviders(<ReportsPageContent />);

    await userEvent.click(screen.getByRole('button', { name: /Next/ }));

    const url = String(spy.replace.mock.calls[0]?.[0] ?? '');
    expect(new URLSearchParams(url.slice(url.indexOf('?') + 1)).get('page')).toBe('1');
  });

  it('opens the detail sheet from a row and resolves through the confirm dialog', async () => {
    mockList({ data: page });
    const { resolveMutate } = mockMutations();
    mockDetail(pendingReport);
    renderWithProviders(<ReportsPageContent />);

    await userEvent.click(screen.getByTitle(pendingReport.id));

    const sheet = await screen.findByRole('dialog');
    expect(within(sheet).getByText('Report details')).toBeInTheDocument();

    await userEvent.click(within(sheet).getByRole('button', { name: 'Resolve' }));

    const dialog = await screen.findByRole('alertdialog');
    await userEvent.click(within(dialog).getByRole('button', { name: 'Resolve' }));

    expect(resolveMutate).toHaveBeenCalledWith(pendingReport.id, expect.anything());
  });

  it('opens the dismiss confirm dialog from the detail sheet', async () => {
    mockList({ data: page });
    const { dismissMutate } = mockMutations();
    mockDetail(pendingReport);
    renderWithProviders(<ReportsPageContent />);

    await userEvent.click(screen.getByTitle(pendingReport.id));
    const sheet = await screen.findByRole('dialog');
    await userEvent.click(within(sheet).getByRole('button', { name: 'Dismiss' }));

    const dialog = await screen.findByRole('alertdialog');
    expect(within(dialog).getByText('Dismiss this report?')).toBeInTheDocument();
    await userEvent.click(within(dialog).getByRole('button', { name: 'Dismiss' }));

    expect(dismissMutate).toHaveBeenCalledWith(pendingReport.id, expect.anything());
  });

  it('announces a background refetch without blocking the table', async () => {
    mockList({ data: page, isFetching: true });
    renderWithProviders(<ReportsPageContent />);

    await waitFor(() => expect(screen.getAllByRole('status').length).toBeGreaterThan(0));
    expect(screen.getByTitle(pendingReport.id)).toBeInTheDocument();
  });
});
