import { describe, it, expect, vi } from 'vitest';
import userEvent from '@testing-library/user-event';
import { renderWithProviders, screen } from '@/test-utils/render';
import type { AdminUser } from '../schemas/user.schema';
import { BanUserDialog } from './ban-user-dialog';

const user: AdminUser = {
  id: 'u-1',
  username: 'alice',
  email: 'alice@snapgram.dev',
  displayName: 'Alice Nguyen',
  banned: false,
  roles: ['USER'],
};

function renderDialog(overrides: Partial<React.ComponentProps<typeof BanUserDialog>> = {}) {
  const onConfirm = vi.fn();
  const onOpenChange = vi.fn();
  const utils = renderWithProviders(
    <BanUserDialog
      user={user}
      open
      onOpenChange={onOpenChange}
      onConfirm={onConfirm}
      isPending={false}
      {...overrides}
    />
  );
  return { ...utils, onConfirm, onOpenChange };
}

describe('BanUserDialog', () => {
  it('renders the destructive confirmation with the username', () => {
    const { getByRole, getByText, getByLabelText } = renderDialog();

    expect(getByRole('alertdialog')).toBeInTheDocument();
    expect(getByText('Ban Alice Nguyen?')).toBeInTheDocument();
    expect(getByLabelText('Ban reason')).toBeInTheDocument();
  });

  it('wires the label to the textarea (no dangling htmlFor)', () => {
    const { getByLabelText } = renderDialog();

    expect(getByLabelText('Ban reason')).toHaveAttribute('id', 'ban-reason');
  });

  it('blocks submission and shows an inline error when the reason is empty (brief D3)', async () => {
    const { getByRole, onConfirm } = renderDialog();

    await userEvent.click(getByRole('button', { name: 'Confirm' }));

    expect(onConfirm).not.toHaveBeenCalled();
    expect(await screen.findByRole('alert')).toHaveTextContent('Enter a reason for the ban');
  });

  it('submits the trimmed reason', async () => {
    const { getByLabelText, getByRole, onConfirm } = renderDialog();

    await userEvent.type(getByLabelText('Ban reason'), 'Repeated spam');
    await userEvent.click(getByRole('button', { name: 'Confirm' }));

    expect(onConfirm).toHaveBeenCalledWith('Repeated spam');
  });

  it('disables the controls and shows a spinner while pending', () => {
    const { getByRole, getByLabelText, container } = renderDialog({ isPending: true });

    expect(getByRole('button', { name: 'Confirm' })).toBeDisabled();
    expect(getByRole('button', { name: 'Cancel' })).toBeDisabled();
    expect(getByLabelText('Ban reason')).toBeDisabled();
    expect(container.ownerDocument.querySelector('.animate-spin')).not.toBeNull();
  });

  it('requests closing through the cancel button', async () => {
    const { getByRole, onOpenChange } = renderDialog();

    await userEvent.click(getByRole('button', { name: 'Cancel' }));

    expect(onOpenChange).toHaveBeenCalledWith(false);
  });
});
