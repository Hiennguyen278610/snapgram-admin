import { describe, it, expect, vi, beforeEach } from 'vitest';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '@/test-utils/render';
import type { AdminUser } from '../schemas/user.schema';
import { useAssignRole } from '../hooks/use-assign-role';
import { useRemoveRole } from '../hooks/use-remove-role';
import { RoleAssignMenu } from './role-assign-menu';

vi.mock('../hooks/use-assign-role');
vi.mock('../hooks/use-remove-role');

const mockedUseAssignRole = vi.mocked(useAssignRole);
const mockedUseRemoveRole = vi.mocked(useRemoveRole);

const user: AdminUser = {
  id: 'u-1',
  username: 'alice',
  email: 'alice@snapgram.dev',
  displayName: 'Alice Nguyen',
  role: 'ADMIN',
  roles: ['USER', 'ADMIN'],
};

function mockMutations(overrides: { assignPending?: boolean; removePending?: boolean } = {}) {
  const assignMutate = vi.fn();
  const removeMutate = vi.fn();

  mockedUseAssignRole.mockReturnValue({
    mutate: assignMutate,
    isPending: overrides.assignPending ?? false,
    variables: overrides.assignPending ? { id: 'u-1', role: 'MODERATOR' } : undefined,
  } as unknown as ReturnType<typeof useAssignRole>);

  mockedUseRemoveRole.mockReturnValue({
    mutate: removeMutate,
    isPending: overrides.removePending ?? false,
    variables: overrides.removePending ? { id: 'u-1', role: 'USER' } : undefined,
  } as unknown as ReturnType<typeof useRemoveRole>);

  return { assignMutate, removeMutate };
}

describe('RoleAssignMenu', () => {
  beforeEach(() => {
    mockedUseAssignRole.mockReset();
    mockedUseRemoveRole.mockReset();
  });

  it('lists the current roles with their localized labels', () => {
    mockMutations();
    const { getByText } = renderWithProviders(
      <RoleAssignMenu user={user} onOpenChange={vi.fn()} />
    );

    expect(getByText('Roles for @alice')).toBeInTheDocument();
    expect(getByText('User')).toBeInTheDocument();
    expect(getByText('Admin')).toBeInTheDocument();
  });

  it('offers only the roles the user does not have yet', () => {
    mockMutations();
    const { getByRole, queryByRole } = renderWithProviders(
      <RoleAssignMenu user={user} onOpenChange={vi.fn()} />
    );

    expect(getByRole('button', { name: /moderator/i })).toBeInTheDocument();
    // ADMIN and USER are already assigned, so no assign button for them.
    expect(queryByRole('button', { name: /^admin$/i })).not.toBeInTheDocument();
    expect(queryByRole('button', { name: /^user$/i })).not.toBeInTheDocument();
  });

  it('assigns a role through the mutation', async () => {
    const { assignMutate } = mockMutations();
    const { getByRole } = renderWithProviders(
      <RoleAssignMenu user={user} onOpenChange={vi.fn()} />
    );

    await userEvent.click(getByRole('button', { name: /moderator/i }));

    expect(assignMutate).toHaveBeenCalledTimes(1);
    expect(assignMutate.mock.calls[0][0]).toEqual({ id: 'u-1', role: 'MODERATOR' });
  });

  it('removes an existing role through the mutation', async () => {
    const { removeMutate } = mockMutations();
    const { getByRole } = renderWithProviders(
      <RoleAssignMenu user={user} onOpenChange={vi.fn()} />
    );

    await userEvent.click(getByRole('button', { name: 'Remove role User' }));

    expect(removeMutate).toHaveBeenCalledTimes(1);
    expect(removeMutate.mock.calls[0][0]).toEqual({ id: 'u-1', role: 'USER' });
  });

  it('tells the user when there are no roles left to assign', () => {
    mockMutations();
    const { getByText } = renderWithProviders(
      <RoleAssignMenu
        user={{ ...user, roles: ['ADMIN', 'MODERATOR', 'USER'] }}
        onOpenChange={vi.fn()}
      />
    );

    expect(getByText('No roles available')).toBeInTheDocument();
  });

  it('shows the empty-roles message for an account without roles', () => {
    mockMutations();
    const { getByText } = renderWithProviders(
      <RoleAssignMenu user={{ ...user, roles: [] }} onOpenChange={vi.fn()} />
    );

    expect(getByText('This account has no roles')).toBeInTheDocument();
  });

  it('disables every action while a mutation is pending', () => {
    mockMutations({ assignPending: true });
    const { getByRole } = renderWithProviders(
      <RoleAssignMenu user={user} onOpenChange={vi.fn()} />
    );

    expect(getByRole('button', { name: /moderator/i })).toBeDisabled();
    expect(getByRole('button', { name: 'Remove role User' })).toBeDisabled();
  });

  it('surfaces the mapped error when the assign mutation fails', async () => {
    const assignMutate = vi.fn((_variables, options: { onError: (e: unknown) => void }) => {
      options.onError({ httpStatus: 409, kind: 'conflict', message: 'dup' });
    });
    mockedUseAssignRole.mockReturnValue({
      mutate: assignMutate,
      isPending: false,
      variables: undefined,
    } as unknown as ReturnType<typeof useAssignRole>);
    mockedUseRemoveRole.mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
      variables: undefined,
    } as unknown as ReturnType<typeof useRemoveRole>);

    const { getByRole, findByRole } = renderWithProviders(
      <RoleAssignMenu user={user} onOpenChange={vi.fn()} />
    );

    await userEvent.click(getByRole('button', { name: /moderator/i }));

    expect(await findByRole('alert')).toHaveTextContent(
      'A record with this information already exists.'
    );
  });

  it('requests closing through the close button', async () => {
    mockMutations();
    const onOpenChange = vi.fn();
    const { getAllByRole } = renderWithProviders(
      <RoleAssignMenu user={user} onOpenChange={onOpenChange} />
    );

    // DialogContent also ships an icon close button; both close the dialog.
    const closeButtons = getAllByRole('button', { name: 'Close' });
    await userEvent.click(closeButtons[closeButtons.length - 1]);

    expect(onOpenChange).toHaveBeenCalledWith(false);
  });
});
