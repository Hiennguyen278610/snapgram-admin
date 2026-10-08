import { describe, it, expect } from 'vitest';
import { renderWithProviders, screen } from '@/test-utils/render';
import { ReportStatusBadge } from './report-status-badge';

describe('ReportStatusBadge', () => {
  it.each([
    ['PENDING', 'Pending'],
    ['REVIEWED', 'Reviewed'],
    ['RESOLVED', 'Resolved'],
    ['DISMISSED', 'Dismissed'],
  ] as const)('renders the %s label', (status, label) => {
    renderWithProviders(<ReportStatusBadge status={status} />);

    expect(screen.getByText(label)).toBeInTheDocument();
    expect(screen.getByText(label)).toHaveAttribute('data-status', status);
  });

  it('gives each status a distinct class list', () => {
    const classes = (['PENDING', 'REVIEWED', 'RESOLVED', 'DISMISSED'] as const).map((status) => {
      const { unmount } = renderWithProviders(<ReportStatusBadge status={status} />);
      const className = screen.getByText(/./, { selector: `[data-status="${status}"]` }).className;
      unmount();
      return className;
    });

    expect(new Set(classes).size).toBe(4);
    expect(classes[3]).toContain('bg-muted');
    expect(classes[1]).toContain('bg-sky-50');
  });
});
