import { describe, it, expect, vi, beforeEach } from 'vitest';
import userEvent from '@testing-library/user-event';
import { toast } from 'sonner';
import { renderWithProviders, screen, waitFor } from '@/test-utils/render';
import { useDeleteRole } from '../hooks/use-delete-role';
import type { RoleDetail } from '../schemas/role.schema';
import { DeleteRoleDialog } from './delete-role-dialog';

vi.mock('../hooks/use-delete-role');
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

const mockedUseDeleteRole = vi.mocked(useDeleteRole);

const customRole: RoleDetail = {
  id: 'r-support',
  name: 'SUPPORT',
  description: 'Support staff',
  permissions: [],
  userCount: 0,
  system: false,
};

const systemRole: RoleDetail = { ...customRole, id: 'r-admin', name: 'ADMIN', system: true };

type MutationOptions = {
  onSuccess?: (data: void) => void;
  onError?: (error: unknown) => void;
};

function mockMutation(overrides: { pending?: boolean } = {}) {
  const mutate = vi.fn();
  mockedUseDeleteRole.mockReturnValue({
    mutate,
    isPending: overrides.pending ?? false,
  } as unknown as ReturnType<typeof useDeleteRole>);
  return { mutate };
}

function renderDialog(role: RoleDetail = customRole) {
  const onOpenChange = vi.fn();
  const view = renderWithProviders(
    <DeleteRoleDialog role={role} open onOpenChange={onOpenChange} />
  );
  return { onOpenChange, view };
}

describe('DeleteRoleDialog', () => {
  beforeEach(() => {
    mockedUseDeleteRole.mockReset();
    vi.mocked(toast.success).mockReset();
    vi.mocked(toast.error).mockReset();
  });

  it('renders the two-step confirmation copy', () => {
    mockMutation();
    renderDialog();

    expect(screen.getByText('Delete SUPPORT?')).toBeInTheDocument();
    expect(screen.getByText(/This permanently removes the role/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Confirm' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument();
  });

  it('deletes the role by id when confirmed', async () => {
    const { mutate } = mockMutation();
    renderDialog();

    await userEvent.click(screen.getByRole('button', { name: 'Confirm' }));

    expect(mutate.mock.calls[0][0]).toBe('r-support');
  });

  it('never renders for a system role', () => {
    mockMutation();
    const { view } = renderDialog(systemRole);

    expect(view.container).toBeEmptyDOMElement();
  });

  it('disables the confirm button while pending', () => {
    mockMutation({ pending: true });
    renderDialog();

    expect(screen.getByRole('button', { name: 'Confirm' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeDisabled();
  });

  it('toasts the deleted role and closes on success', async () => {
    const { mutate } = mockMutation();
    const { onOpenChange } = renderDialog();
    mutate.mockImplementation((...args: unknown[]) => {
      (args[1] as MutationOptions | undefined)?.onSuccess?.(undefined);
    });

    await userEvent.click(screen.getByRole('button', { name: 'Confirm' }));

    await waitFor(() => expect(toast.success).toHaveBeenCalledWith('Role SUPPORT deleted'));
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it('toasts a localized error when deletion fails', async () => {
    const { mutate } = mockMutation();
    renderDialog();
    mutate.mockImplementation((...args: unknown[]) => {
      (args[1] as MutationOptions | undefined)?.onError?.({
        httpStatus: 500,
        kind: 'server',
        message: 'boom',
      });
    });

    await userEvent.click(screen.getByRole('button', { name: 'Confirm' }));

    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith('Could not delete the role', {
        description: 'Internal server error.',
      })
    );
  });
});
