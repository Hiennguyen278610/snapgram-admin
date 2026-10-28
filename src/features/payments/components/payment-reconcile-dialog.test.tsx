import { describe, it, expect, vi } from 'vitest';
import userEvent from '@testing-library/user-event';
import { renderWithProviders, screen } from '@/test-utils/render';
import type { PaymentOrder } from '../schemas/payment.schema';
import { PaymentReconcileDialog } from './payment-reconcile-dialog';

const mockOrder: PaymentOrder = {
  id: 'p-1',
  orderId: 'ord-1234567890',
  productCode: 'BLUE_TICK',
  amount: 199000,
  currency: 'VND',
  status: 'PENDING',
  createdAt: '2026-10-24T07:16:28Z',
  expiresAt: '2026-10-24T07:31:28Z',
};

describe('PaymentReconcileDialog', () => {
  it('renders orderId in description and handles confirm', async () => {
    const user = userEvent.setup();
    const onConfirm = vi.fn();
    const onOpenChange = vi.fn();

    renderWithProviders(
      <PaymentReconcileDialog
        payment={mockOrder}
        open={true}
        onOpenChange={onOpenChange}
        onConfirm={onConfirm}
        isPending={false}
      />
    );

    expect(screen.getByRole('heading', { name: 'Reconcile Transaction' })).toBeInTheDocument();
    expect(screen.getByText(/ord-1234567890/)).toBeInTheDocument();

    const confirmBtn = screen.getByRole('button', { name: 'Reconcile Now' });
    await user.click(confirmBtn);

    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it('returns null when payment is null', () => {
    const { container } = renderWithProviders(
      <PaymentReconcileDialog
        payment={null}
        open={false}
        onOpenChange={vi.fn()}
        onConfirm={vi.fn()}
        isPending={false}
      />
    );

    expect(container).toBeEmptyDOMElement();
  });
});
