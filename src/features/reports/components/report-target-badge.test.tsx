import { describe, it, expect } from 'vitest';
import { renderWithProviders, screen } from '@/test-utils/render';
import { ReportTargetBadge } from './report-target-badge';

describe('ReportTargetBadge', () => {
  it.each([
    ['POST', 'Post'],
    ['COMMENT', 'Comment'],
    ['USER', 'Account'],
  ] as const)('renders the %s label', (targetType, label) => {
    renderWithProviders(<ReportTargetBadge targetType={targetType} />);

    expect(screen.getByText(label)).toBeInTheDocument();
    expect(screen.getByText(label)).toHaveAttribute('data-target-type', targetType);
  });

  it('stays on the outline variant so colours come from semantic tokens', () => {
    renderWithProviders(<ReportTargetBadge targetType="POST" />);

    const badge = screen.getByText('Post');
    expect(badge.className).not.toMatch(/bg-(white|black|gray|zinc|slate|amber|rose|emerald|sky)-/);
  });
});
