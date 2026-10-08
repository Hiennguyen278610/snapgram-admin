import { describe, it, expect, vi, beforeEach } from 'vitest';
import userEvent from '@testing-library/user-event';
import { toast } from 'sonner';
import { fireEvent, renderWithProviders, screen, waitFor } from '@/test-utils/render';
import { useCreateRole } from '../hooks/use-create-role';
import type { RoleDetail } from '../schemas/role.schema';
import { CreateRoleDialog } from './create-role-dialog';

vi.mock('../hooks/use-create-role');
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

const mockedUseCreateRole = vi.mocked(useCreateRole);

const created: RoleDetail = {
  id: 'r-new',
  name: 'SUPPORT_LEAD',
  description: '',
  permissions: [],
  userCount: 0,
  system: false,
};

type MutationOptions = {
  onSuccess?: (role: RoleDetail) => void;
  onError?: (error: unknown) => void;
};

function mockMutation(overrides: { pending?: boolean } = {}) {
  const mutate = vi.fn();
  mockedUseCreateRole.mockReturnValue({
    mutate,
    isPending: overrides.pending ?? false,
  } as unknown as ReturnType<typeof useCreateRole>);
  return { mutate };
}

function renderDialog() {
  const onOpenChange = vi.fn();
  renderWithProviders(<CreateRoleDialog open onOpenChange={onOpenChange} />);
  return { onOpenChange };
}

describe('CreateRoleDialog', () => {
  beforeEach(() => {
    mockedUseCreateRole.mockReset();
    vi.mocked(toast.success).mockReset();
    vi.mocked(toast.error).mockReset();
  });

  it('renders the name and description fields', () => {
    mockMutation();
    renderDialog();

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByLabelText('Role name')).toBeInTheDocument();
    expect(screen.getByLabelText('Description')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('SUPPORT_LEAD')).toBeInTheDocument();
  });

  it('rejects invalid characters with the localized pattern message', async () => {
    mockMutation();
    renderDialog();

    await userEvent.type(screen.getByLabelText('Role name'), 'bad-name');
    await userEvent.tab();

    expect(
      await screen.findByText('Use uppercase letters, numbers and underscores only')
    ).toBeInTheDocument();
  });

  it('rejects names outside the 2..50 length bounds', async () => {
    mockMutation();
    renderDialog();

    await userEvent.type(screen.getByLabelText('Role name'), 'A');
    await userEvent.tab();

    expect(
      await screen.findByText('The role name must be between 2 and 50 characters')
    ).toBeInTheDocument();
  });

  it('rejects descriptions longer than 255 characters', async () => {
    const { mutate } = mockMutation();
    renderDialog();

    await userEvent.type(screen.getByLabelText('Role name'), 'SUPPORT');
    await userEvent.click(screen.getByLabelText('Description'));
    fireEvent.change(screen.getByLabelText('Description'), {
      target: { value: 'x'.repeat(256) },
    });
    await userEvent.click(screen.getByRole('button', { name: 'Save' }));

    expect(
      await screen.findByText('The description must be 255 characters or fewer')
    ).toBeInTheDocument();
    expect(mutate).not.toHaveBeenCalled();
  });

  it('normalises a lowercase name to uppercase and sends empty permissionIds', async () => {
    const { mutate } = mockMutation();
    renderDialog();

    await userEvent.type(screen.getByLabelText('Role name'), 'support_lead');
    await userEvent.click(screen.getByRole('button', { name: 'Save' }));

    await waitFor(() => expect(mutate).toHaveBeenCalledTimes(1));
    expect(mutate.mock.calls[0][0]).toEqual({
      name: 'SUPPORT_LEAD',
      description: '',
      permissionIds: [],
    });
  });

  it('does not submit an invalid form', async () => {
    const { mutate } = mockMutation();
    renderDialog();

    await userEvent.type(screen.getByLabelText('Role name'), 'bad name');
    await userEvent.click(screen.getByRole('button', { name: 'Save' }));

    await screen.findByText('Use uppercase letters, numbers and underscores only');
    expect(mutate).not.toHaveBeenCalled();
  });

  it('disables the submit button while the mutation is pending', () => {
    mockMutation({ pending: true });
    renderDialog();

    expect(screen.getByRole('button', { name: 'Save' })).toBeDisabled();
    expect(screen.getByLabelText('Role name')).toBeDisabled();
  });

  it('toasts the created role and closes the dialog on success', async () => {
    const { mutate } = mockMutation();
    const { onOpenChange } = renderDialog();
    mutate.mockImplementation((...args: unknown[]) => {
      (args[1] as MutationOptions | undefined)?.onSuccess?.(created);
    });

    await userEvent.type(screen.getByLabelText('Role name'), 'SUPPORT_LEAD');
    await userEvent.click(screen.getByRole('button', { name: 'Save' }));

    await waitFor(() => expect(toast.success).toHaveBeenCalledWith('Role SUPPORT_LEAD created'));
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it('toasts a localized error when creation fails', async () => {
    const { mutate } = mockMutation();
    renderDialog();
    mutate.mockImplementation((...args: unknown[]) => {
      (args[1] as MutationOptions | undefined)?.onError?.({
        httpStatus: 409,
        kind: 'conflict',
        message: 'dupe',
      });
    });

    await userEvent.type(screen.getByLabelText('Role name'), 'ADMIN');
    await userEvent.click(screen.getByRole('button', { name: 'Save' }));

    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith('Could not create the role', {
        description: 'A record with this information already exists.',
      })
    );
  });
});
