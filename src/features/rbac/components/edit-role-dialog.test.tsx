import { describe, it, expect, vi, beforeEach } from 'vitest';
import userEvent from '@testing-library/user-event';
import { toast } from 'sonner';
import { renderWithProviders, screen, waitFor } from '@/test-utils/render';
import { useUpdateRole } from '../hooks/use-update-role';
import type { RoleDetail } from '../schemas/role.schema';
import { EditRoleDialog } from './edit-role-dialog';

vi.mock('../hooks/use-update-role');
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

const mockedUseUpdateRole = vi.mocked(useUpdateRole);

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
  onSuccess?: (role: RoleDetail) => void;
  onError?: (error: unknown) => void;
};

function mockMutation(overrides: { pending?: boolean } = {}) {
  const mutate = vi.fn();
  mockedUseUpdateRole.mockReturnValue({
    mutate,
    isPending: overrides.pending ?? false,
  } as unknown as ReturnType<typeof useUpdateRole>);
  return { mutate };
}

function renderDialog(role: RoleDetail = customRole) {
  const onOpenChange = vi.fn();
  const view = renderWithProviders(<EditRoleDialog role={role} open onOpenChange={onOpenChange} />);
  return { onOpenChange, view };
}

describe('EditRoleDialog', () => {
  beforeEach(() => {
    mockedUseUpdateRole.mockReset();
    vi.mocked(toast.success).mockReset();
    vi.mocked(toast.error).mockReset();
  });

  it('prefills the form with the role values', () => {
    mockMutation();
    renderDialog();

    expect(screen.getByLabelText('Role name')).toHaveValue('SUPPORT');
    expect(screen.getByLabelText('Description')).toHaveValue('Support staff');
  });

  it('submits the edited payload for the role id', async () => {
    const { mutate } = mockMutation();
    renderDialog();

    await userEvent.clear(screen.getByLabelText('Role name'));
    await userEvent.type(screen.getByLabelText('Role name'), 'support_lead');
    await userEvent.click(screen.getByRole('button', { name: 'Save' }));

    await waitFor(() => expect(mutate).toHaveBeenCalledTimes(1));
    expect(mutate.mock.calls[0][0]).toEqual({
      id: 'r-support',
      payload: { name: 'SUPPORT_LEAD', description: 'Support staff' },
    });
  });

  it('validates the name pattern before submitting', async () => {
    const { mutate } = mockMutation();
    renderDialog();

    await userEvent.clear(screen.getByLabelText('Role name'));
    await userEvent.type(screen.getByLabelText('Role name'), 'bad-name');
    await userEvent.click(screen.getByRole('button', { name: 'Save' }));

    expect(
      await screen.findByText('Use uppercase letters, numbers and underscores only')
    ).toBeInTheDocument();
    expect(mutate).not.toHaveBeenCalled();
  });

  it('never renders for a system role', () => {
    mockMutation();
    const { view } = renderDialog(systemRole);

    expect(view.container).toBeEmptyDOMElement();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('disables the submit button while pending', () => {
    mockMutation({ pending: true });
    renderDialog();

    expect(screen.getByRole('button', { name: 'Save' })).toBeDisabled();
    expect(screen.getByLabelText('Role name')).toBeDisabled();
  });

  it('toasts the updated role and closes on success', async () => {
    const { mutate } = mockMutation();
    const { onOpenChange } = renderDialog();
    mutate.mockImplementation((...args: unknown[]) => {
      (args[1] as MutationOptions | undefined)?.onSuccess?.({
        ...customRole,
        name: 'SUPPORT_LEAD',
      });
    });

    await userEvent.click(screen.getByRole('button', { name: 'Save' }));

    await waitFor(() => expect(toast.success).toHaveBeenCalledWith('Role SUPPORT_LEAD updated'));
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it('toasts a localized error when the update fails', async () => {
    const { mutate } = mockMutation();
    renderDialog();
    mutate.mockImplementation((...args: unknown[]) => {
      (args[1] as MutationOptions | undefined)?.onError?.({
        httpStatus: 403,
        kind: 'forbidden',
        message: 'nope',
      });
    });

    await userEvent.click(screen.getByRole('button', { name: 'Save' }));

    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith('Could not update the role', {
        description: 'You do not have permission.',
      })
    );
  });
});
