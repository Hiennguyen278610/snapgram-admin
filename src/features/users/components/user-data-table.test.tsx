import { describe, it, expect, vi } from 'vitest';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '@/test-utils/render';
import type { AdminUser } from '../schemas/user.schema';
import { UserDataTable } from './user-data-table';

const users: AdminUser[] = [
  {
    id: 'u-1',
    username: 'alice',
    email: 'alice@snapgram.dev',
    displayName: 'Alice Nguyen',
    avatarUrl: null,
    emailVerified: true,
    banned: false,
    createdAt: '2026-10-01T09:15:00Z',
    role: 'ADMIN',
    roles: ['USER', 'ADMIN'],
  },
  {
    id: 'u-2',
    username: 'bob',
    email: 'bob@snapgram.dev',
    displayName: null,
    avatarUrl: 'https://cdn.snapgram.dev/avatars/user02.png',
    emailVerified: false,
    banned: true,
    createdAt: '2026-10-02T09:15:00Z',
    role: 'UNKNOWN_ROLE',
    roles: [],
  },
];

const renderActions = () => <button type="button">menu</button>;

describe('UserDataTable', () => {
  it('renders the six column headers', () => {
    const { getByRole, getByText } = renderWithProviders(
      <UserDataTable users={[]} onSelectUser={vi.fn()} renderActions={renderActions} />
    );

    expect(getByRole('table')).toBeInTheDocument();
    expect(getByText('User')).toBeInTheDocument();
    expect(getByText('Email')).toBeInTheDocument();
    expect(getByText('Role')).toBeInTheDocument();
    expect(getByText('Status')).toBeInTheDocument();
    expect(getByText('Created')).toBeInTheDocument();
    expect(getByText('Actions')).toBeInTheDocument();
  });

  it('renders a row per user with the localized role and status', () => {
    const { getByText } = renderWithProviders(
      <UserDataTable users={users} onSelectUser={vi.fn()} renderActions={renderActions} />
    );

    expect(getByText('Alice Nguyen')).toBeInTheDocument();
    expect(getByText('@alice')).toBeInTheDocument();
    expect(getByText('alice@snapgram.dev')).toBeInTheDocument();
    expect(getByText('Admin')).toBeInTheDocument();
    expect(getByText('Active')).toBeInTheDocument();
    // Display name falls back to the username when it is null.
    expect(getByText('bob')).toBeInTheDocument();
    expect(getByText('Banned')).toBeInTheDocument();
    // Unknown dynamic roles fall back to the raw value instead of throwing.
    expect(getByText('UNKNOWN_ROLE')).toBeInTheDocument();
  });

  it('renders the skeleton rows while loading and nothing else', () => {
    const { getByRole, queryByText } = renderWithProviders(
      <UserDataTable users={users} isLoading onSelectUser={vi.fn()} renderActions={renderActions} />
    );

    expect(getByRole('status')).toHaveAttribute('aria-busy', 'true');
    expect(queryByText('Alice Nguyen')).not.toBeInTheDocument();
  });

  it('calls onSelectUser when a row is clicked', async () => {
    const onSelectUser = vi.fn();
    const { getByText } = renderWithProviders(
      <UserDataTable users={users} onSelectUser={onSelectUser} renderActions={renderActions} />
    );

    await userEvent.click(getByText('Alice Nguyen'));

    expect(onSelectUser).toHaveBeenCalledWith('u-1');
  });

  it('supports keyboard activation with Enter and Space', async () => {
    const onSelectUser = vi.fn();
    const { getByText, getAllByRole } = renderWithProviders(
      <UserDataTable users={users} onSelectUser={onSelectUser} renderActions={renderActions} />
    );

    const rows = getAllByRole('row');
    rows[1].focus();
    await userEvent.keyboard('{Enter}');
    await userEvent.keyboard(' ');

    expect(onSelectUser).toHaveBeenCalledWith('u-1');
    expect(onSelectUser).toHaveBeenCalledTimes(2);
    expect(getByText('Alice Nguyen')).toBeInTheDocument();
  });

  it('does not select the user when the action cell is clicked (stopPropagation)', async () => {
    const onSelectUser = vi.fn();
    const { getAllByRole } = renderWithProviders(
      <UserDataTable users={users} onSelectUser={onSelectUser} renderActions={renderActions} />
    );

    const menuButtons = getAllByRole('button', { name: 'menu' });
    await userEvent.click(menuButtons[0]);

    expect(onSelectUser).not.toHaveBeenCalled();
  });
});
