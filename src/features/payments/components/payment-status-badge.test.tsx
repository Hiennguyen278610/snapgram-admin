import { describe, it, expect } from 'vitest';
import { renderWithProviders, screen } from '@/test-utils/render';
import { PaymentStatusBadge } from './payment-status-badge';

describe('PaymentStatusBadge', () => {
  it.each([
    ['PENDING', 'Pending'],
    ['SUCCESS', 'Completed'],
    ['EXPIRED', 'Expired'],
    ['FAILED', 'Failed'],
  ] as const)('renders the %s label', (status, label) => {
    renderWithProviders(<PaymentStatusBadge status={status} />);

    expect(screen.getByText(label)).toBeInTheDocument();
    expect(screen.getByText(label)).toHaveAttribute('data-status', status);
  });
});
