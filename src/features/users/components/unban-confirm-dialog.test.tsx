import { describe, it, expect, vi } from 'vitest';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '@/test-utils/render';
import type { AdminUser } from '../schemas/user.schema';
import { UnbanConfirmDialog } from './unban-confirm-dialog';

const user: AdminUser = {
  id: 'u-2',
  username: 'bob',
  email: 'bob@snapgram.dev',
  displayName: 'Bob Tran',
  banned: true,
  roles: ['USER'],
};

describe('UnbanConfirmDialog', () => {
  it('renders the confirmation naming the account', () => {
    const { getByRole, getByText } = renderWithProviders(
      <UnbanConfirmDialog
        user={user}
        open
        onOpenChange={vi.fn()}
        onConfirm={vi.fn()}
        isPending={false}
      />
    );

    expect(getByRole('alertdialog')).toBeInTheDocument();
    expect(getByText('Unban Bob Tran?')).toBeInTheDocument();
  });

  it('calls onConfirm when confirmed', async () => {
    const onConfirm = vi.fn();
    const { getByRole } = renderWithProviders(
      <UnbanConfirmDialog
        user={user}
        open
        onOpenChange={vi.fn()}
        onConfirm={onConfirm}
        isPending={false}
      />
    );

    await userEvent.click(getByRole('button', { name: 'Confirm' }));

    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it('disables both actions while pending', () => {
    const { getByRole, container } = renderWithProviders(
      <UnbanConfirmDialog user={user} open onOpenChange={vi.fn()} onConfirm={vi.fn()} isPending />
    );

    expect(getByRole('button', { name: 'Confirm' })).toBeDisabled();
    expect(getByRole('button', { name: 'Cancel' })).toBeDisabled();
    expect(container.ownerDocument.querySelector('.animate-spin')).not.toBeNull();
  });

  it('requests closing through the cancel button', async () => {
    const onOpenChange = vi.fn();
    const { getByRole } = renderWithProviders(
      <UnbanConfirmDialog
        user={user}
        open
        onOpenChange={onOpenChange}
        onConfirm={vi.fn()}
        isPending={false}
      />
    );

    await userEvent.click(getByRole('button', { name: 'Cancel' }));

    expect(onOpenChange).toHaveBeenCalledWith(false);
  });
});
