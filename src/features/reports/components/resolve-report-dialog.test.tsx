import { describe, it, expect, vi, beforeEach } from 'vitest';
import userEvent from '@testing-library/user-event';
import { renderWithProviders, screen } from '@/test-utils/render';
import type { Report } from '../schemas/report.schema';
import { ResolveReportDialog } from './resolve-report-dialog';

function makeReport(status: Report['status']): Report {
  return {
    id: '11111111-1111-1111-1111-111111111101',
    reporterId: '56030fa2-b07b-4599-8c1f-e1e8b4da9622',
    targetType: 'POST',
    targetId: 'aaaa1111-1111-1111-1111-111111111101',
    reason: 'spam',
    description: 'Spam content',
    status,
    createdAt: '2026-10-08T06:00:01Z',
  };
}

const onOpenChange = vi.fn();
const onConfirm = vi.fn();

describe('ResolveReportDialog', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the two-step confirmation for an actionable report', () => {
    renderWithProviders(
      <ResolveReportDialog
        report={makeReport('PENDING')}
        open
        onOpenChange={onOpenChange}
        onConfirm={onConfirm}
        isPending={false}
      />
    );

    expect(screen.getByRole('alertdialog')).toBeInTheDocument();
    expect(screen.getByText('Resolve this report?')).toBeInTheDocument();
    expect(screen.getByText(/Mark the report as handled/i)).toBeInTheDocument();
  });

  it('confirms the resolve action', async () => {
    renderWithProviders(
      <ResolveReportDialog
        report={makeReport('REVIEWED')}
        open
        onOpenChange={onOpenChange}
        onConfirm={onConfirm}
        isPending={false}
      />
    );

    await userEvent.click(screen.getByRole('button', { name: 'Resolve' }));

    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it('disables both buttons and spins while the mutation is pending', () => {
    renderWithProviders(
      <ResolveReportDialog
        report={makeReport('PENDING')}
        open
        onOpenChange={onOpenChange}
        onConfirm={onConfirm}
        isPending
      />
    );

    const confirm = screen.getByRole('button', { name: /Resolve/ });
    expect(confirm).toBeDisabled();
    expect(confirm.querySelector('.animate-spin')).not.toBeNull();
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeDisabled();
  });

  it('cancels through the cancel button', async () => {
    renderWithProviders(
      <ResolveReportDialog
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
        <ResolveReportDialog
          report={makeReport(status)}
          open
          onOpenChange={onOpenChange}
          onConfirm={onConfirm}
          isPending={false}
        />
      );

      expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /Resolve/ })).not.toBeInTheDocument();
    }
  );
});
