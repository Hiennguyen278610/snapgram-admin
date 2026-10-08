import { describe, it, expect, vi, beforeEach } from 'vitest';
import userEvent from '@testing-library/user-event';
import { renderWithProviders, screen } from '@/test-utils/render';
import type { Report } from '../schemas/report.schema';
import { DismissReportDialog } from './dismiss-report-dialog';

function makeReport(status: Report['status']): Report {
  return {
    id: '44444444-4444-4444-4444-444444444401',
    reporterId: '56030fa2-b07b-4599-8c1f-e1e8b4da9622',
    targetType: 'POST',
    targetId: 'aaaa4444-4444-4444-4444-444444444401',
    reason: 'spam',
    description: 'Dismissed: not spam',
    status,
    createdAt: '2026-10-06T06:00:01Z',
  };
}

const onOpenChange = vi.fn();
const onConfirm = vi.fn();

describe('DismissReportDialog', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the destructive confirmation with the rose confirm button', () => {
    renderWithProviders(
      <DismissReportDialog
        report={makeReport('PENDING')}
        open
        onOpenChange={onOpenChange}
        onConfirm={onConfirm}
        isPending={false}
      />
    );

    expect(screen.getByText('Dismiss this report?')).toBeInTheDocument();
    expect(screen.getByText(/Reject the report as not a violation/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Dismiss' })).toHaveClass('bg-rose-600');
  });

  it('confirms the dismiss action', async () => {
    renderWithProviders(
      <DismissReportDialog
        report={makeReport('REVIEWED')}
        open
        onOpenChange={onOpenChange}
        onConfirm={onConfirm}
        isPending={false}
      />
    );

    await userEvent.click(screen.getByRole('button', { name: 'Dismiss' }));

    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it('disables both buttons and spins while the mutation is pending', () => {
    renderWithProviders(
      <DismissReportDialog
        report={makeReport('PENDING')}
        open
        onOpenChange={onOpenChange}
        onConfirm={onConfirm}
        isPending
      />
    );

    const confirm = screen.getByRole('button', { name: /Dismiss/ });
    expect(confirm).toBeDisabled();
    expect(confirm.querySelector('.animate-spin')).not.toBeNull();
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeDisabled();
  });

  it('cancels through the cancel button', async () => {
    renderWithProviders(
      <DismissReportDialog
        report={makeReport('PENDING')}
        open
        onOpenChange={onOpenChange}
        onConfirm={onConfirm}
        isPending={false}
      />
    );

    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));

    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it.each(['RESOLVED', 'DISMISSED'] as const)(
    'renders nothing for a %s report (BI-008 guard)',
    (status) => {
      renderWithProviders(
        <DismissReportDialog
          report={makeReport(status)}
          open
          onOpenChange={onOpenChange}
          onConfirm={onConfirm}
          isPending={false}
        />
      );

      expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /Dismiss/ })).not.toBeInTheDocument();
    }
  );
});
