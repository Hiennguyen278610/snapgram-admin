import { describe, it, expect, vi } from 'vitest';
import userEvent from '@testing-library/user-event';
import { renderWithProviders, screen } from '@/test-utils/render';
import type { AdminUser } from '../schemas/user.schema';
import { UserActionMenu } from './user-action-menu';

const activeUser: AdminUser = {
  id: 'u-1',
  username: 'alice',
  email: 'alice@snapgram.dev',
  displayName: 'Alice Nguyen',
  banned: false,
  emailVerified: true,
  roles: ['USER'],
  role: 'USER',
};

const bannedUser: AdminUser = { ...activeUser, id: 'u-2', username: 'bob', banned: true };

describe('UserActionMenu', () => {
  it('renders a trigger with an accessible name', () => {
    const { getByRole } = renderWithProviders(
      <UserActionMenu user={activeUser} onAction={vi.fn()} />
    );

    expect(getByRole('button', { name: 'Actions' })).toBeInTheDocument();
  });

  it('offers Ban (not Unban) for an active user and reports the action', async () => {
    const onAction = vi.fn();
    const { getByRole } = renderWithProviders(
      <UserActionMenu user={activeUser} onAction={onAction} />
    );

    await userEvent.click(getByRole('button', { name: 'Actions' }));
    await userEvent.click(await screen.findByRole('menuitem', { name: /ban user/i }));

    expect(onAction).toHaveBeenCalledWith('ban', activeUser);
  });

  it('offers Unban for a banned user', async () => {
    const onAction = vi.fn();
    const { getByRole } = renderWithProviders(
      <UserActionMenu user={bannedUser} onAction={onAction} />
    );

    await userEvent.click(getByRole('button', { name: 'Actions' }));
    await userEvent.click(await screen.findByRole('menuitem', { name: /unban user/i }));

    expect(onAction).toHaveBeenCalledWith('unban', bannedUser);
  });

  it('reports view and assign-role actions', async () => {
    const onAction = vi.fn();
    const { getByRole } = renderWithProviders(
      <UserActionMenu user={activeUser} onAction={onAction} />
    );

    await userEvent.click(getByRole('button', { name: 'Actions' }));
    await userEvent.click(await screen.findByRole('menuitem', { name: /view details/i }));
    expect(onAction).toHaveBeenLastCalledWith('view', activeUser);

    await userEvent.click(getByRole('button', { name: 'Actions' }));
    await userEvent.click(await screen.findByRole('menuitem', { name: /assign role/i }));
    expect(onAction).toHaveBeenLastCalledWith('assignRole', activeUser);

    await userEvent.click(getByRole('button', { name: 'Actions' }));
    await userEvent.click(await screen.findByRole('menuitem', { name: /edit user/i }));
    expect(onAction).toHaveBeenLastCalledWith('edit', activeUser);

    await userEvent.click(getByRole('button', { name: 'Actions' }));
    await userEvent.click(await screen.findByRole('menuitem', { name: /delete user/i }));
    expect(onAction).toHaveBeenLastCalledWith('delete', activeUser);
  });
});
