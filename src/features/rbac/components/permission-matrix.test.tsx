import { describe, it, expect, vi, beforeEach } from 'vitest';
import userEvent from '@testing-library/user-event';
import { toast } from 'sonner';
import { renderWithProviders, screen, within } from '@/test-utils/render';
import { PERMISSIONS_BY_CATEGORY } from '@/mocks/handlers/rbac.handlers';
import { useSetRolePermissions } from '../hooks/use-set-role-permissions';
import { PermissionMatrix } from './permission-matrix';

vi.mock('../hooks/use-set-role-permissions');
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

const mockedUseSetRolePermissions = vi.mocked(useSetRolePermissions);

const ROLE_ID = 'r-support';

const SUPPORT_IDS = [
  'ab2cdec1-1e6d-4ccd-8174-4b62b0debe44',
  '98d325f1-f34e-4302-9b1f-6594d792fc19',
  'a4c13064-bf31-4f4b-8920-4a99eac3f4c1',
];
const USER_BAN_ID = 'cbf25df4-c975-4265-adb8-a65d9a7e7edf';
const USER_READ_ID = 'ae6c90af-a879-4e26-8530-1e8b0448ced5';

type MutationOptions = {
  onSuccess?: (role: unknown) => void;
  onError?: (error: unknown) => void;
};

function mockMutation(overrides: { pending?: boolean } = {}) {
  const mutate = vi.fn();
  mockedUseSetRolePermissions.mockReturnValue({
    mutate,
    isPending: overrides.pending ?? false,
  } as unknown as ReturnType<typeof useSetRolePermissions>);

  return { mutate };
}

function renderMatrix(
  props: { selectedIds?: string[]; disabled?: boolean; onSaved?: () => void } = {}
) {
  return renderWithProviders(
    <PermissionMatrix
      roleId={ROLE_ID}
      permissions={PERMISSIONS_BY_CATEGORY}
      selectedIds={props.selectedIds ?? []}
      disabled={props.disabled}
      onSaved={props.onSaved}
    />
  );
}

describe('PermissionMatrix', () => {
  beforeEach(() => {
    mockedUseSetRolePermissions.mockReset();
    vi.mocked(toast.success).mockReset();
    vi.mocked(toast.error).mockReset();
  });

  it('renders the six category groups in order with all 19 permissions', () => {
    mockMutation();
    renderMatrix();

    const headings = screen
      .getAllByRole('heading', { level: 3 })
      .map((heading) => heading.textContent);
    expect(headings).toEqual([
      'Content moderation',
      'Payment management',
      'Report management',
      'Support',
      'System',
      'User management',
    ]);

    // 19 permission checkboxes + 6 "select all" checkboxes.
    expect(screen.getAllByRole('checkbox')).toHaveLength(25);
    expect(screen.getAllByLabelText('Select all')).toHaveLength(6);
    expect(screen.getByRole('checkbox', { name: 'USER:BAN' })).toBeInTheDocument();
    expect(screen.getByRole('checkbox', { name: 'USER:READ' })).toBeInTheDocument();
    expect(screen.getByRole('checkbox', { name: 'PAYMENT:READ' })).toBeInTheDocument();
    expect(screen.getByRole('checkbox', { name: 'PAYMENT:RECONCILE' })).toBeInTheDocument();
  });

  it('renders each permission with its backend description as secondary text', () => {
    mockMutation();
    renderMatrix();

    expect(screen.getByText('Khóa tài khoản người dùng vi phạm')).toBeInTheDocument();
    expect(screen.getByRole('checkbox', { name: 'USER:BAN' })).not.toBeChecked();
  });

  it('reflects the selectedIds handed in by the parent', () => {
    mockMutation();
    renderMatrix({ selectedIds: [USER_BAN_ID] });

    expect(screen.getByRole('checkbox', { name: 'USER:BAN' })).toBeChecked();
    expect(screen.getByRole('checkbox', { name: 'USER:READ' })).not.toBeChecked();
  });

  it('saves the toggled permission set for the role', async () => {
    const { mutate } = mockMutation();
    renderMatrix();

    await userEvent.click(screen.getByRole('checkbox', { name: 'USER:BAN' }));
    await userEvent.click(screen.getByRole('button', { name: 'Save permissions' }));

    expect(mutate.mock.calls[0][0]).toEqual({ id: ROLE_ID, permissionIds: [USER_BAN_ID] });
  });

  it('selects and clears a whole group through its header controls', async () => {
    const { mutate } = mockMutation();
    renderMatrix();

    const support = screen.getByRole('region', { name: 'Support' });

    await userEvent.click(within(support).getByLabelText('Select all'));
    await userEvent.click(screen.getByRole('button', { name: 'Save permissions' }));
    expect(mutate.mock.calls[0][0]).toEqual({ id: ROLE_ID, permissionIds: SUPPORT_IDS });

    await userEvent.click(within(support).getByRole('button', { name: 'Clear all' }));
    await userEvent.click(screen.getByRole('button', { name: 'Save permissions' }));
    expect(mutate.mock.calls[1][0]).toEqual({ id: ROLE_ID, permissionIds: [] });
  });

  it('disables every control for a read-only (system) role', () => {
    mockMutation();
    renderMatrix({ selectedIds: [USER_READ_ID], disabled: true });

    for (const checkbox of screen.getAllByRole('checkbox')) {
      expect(checkbox).toBeDisabled();
    }
    expect(screen.getByRole('button', { name: 'Save permissions' })).toBeDisabled();
  });

  it('disables the save button while the mutation is pending', () => {
    mockMutation({ pending: true });
    renderMatrix();

    expect(screen.getByRole('button', { name: 'Save permissions' })).toBeDisabled();
  });

  it('announces success and notifies the parent after a save', async () => {
    const { mutate } = mockMutation();
    const onSaved = vi.fn();
    mutate.mockImplementation((...args: unknown[]) => {
      (args[1] as MutationOptions | undefined)?.onSuccess?.({});
    });
    renderMatrix({ onSaved });

    await userEvent.click(screen.getByRole('button', { name: 'Save permissions' }));

    expect(toast.success).toHaveBeenCalledWith('Permissions saved');
    expect(onSaved).toHaveBeenCalledTimes(1);
  });

  it('announces a localized error when the save fails', async () => {
    const { mutate } = mockMutation();
    mutate.mockImplementation((...args: unknown[]) => {
      (args[1] as MutationOptions | undefined)?.onError?.({
        httpStatus: 500,
        kind: 'server',
        message: 'boom',
      });
    });
    renderMatrix();

    await userEvent.click(screen.getByRole('button', { name: 'Save permissions' }));

    expect(toast.error).toHaveBeenCalledWith('Could not save permissions', {
      description: 'Internal server error.',
    });
  });
});
