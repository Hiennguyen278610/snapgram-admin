import { describe, it, expect } from 'vitest';
import { renderWithProviders, screen } from '@/test-utils/render';
import { ReportTableSkeleton } from './report-table-skeleton';

describe('ReportTableSkeleton', () => {
  it('keeps the 7-column queue grid so the loaded table causes no layout shift', () => {
    renderWithProviders(<ReportTableSkeleton />);

    expect(screen.getAllByRole('columnheader')).toHaveLength(7);
    expect(screen.getByText('Report')).toBeInTheDocument();
    expect(screen.getByText('Target')).toBeInTheDocument();
    expect(screen.getByText('Reporter')).toBeInTheDocument();
    expect(screen.getByText('Reason')).toBeInTheDocument();
    expect(screen.getByText('Status')).toBeInTheDocument();
    expect(screen.getByText('Created')).toBeInTheDocument();
    expect(screen.getByText('Actions')).toBeInTheDocument();
  });

  it('renders 5 placeholder rows by default and announces busy state', () => {
    renderWithProviders(<ReportTableSkeleton />);

    const status = screen.getByRole('status');
    expect(status).toHaveAttribute('aria-busy', 'true');
    // 1 header row + 5 skeleton rows
    expect(screen.getAllByRole('row')).toHaveLength(6);
  });

  it('honours a custom row count', () => {
    renderWithProviders(<ReportTableSkeleton rows={2} />);

    expect(screen.getAllByRole('row')).toHaveLength(3);
  });
});
