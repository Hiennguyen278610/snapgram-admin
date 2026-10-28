import { describe, it, expect, vi, beforeEach } from 'vitest';
import userEvent from '@testing-library/user-event';
import { renderWithProviders, screen } from '@/test-utils/render';
import { PERMISSIONS_BY_CATEGORY } from '@/mocks/handlers/rbac.handlers';
import type { ApiError } from '@/lib/api/types';
import { usePermissionsList } from '../hooks/use-permissions-list';
import { useRoleDetail } from '../hooks/use-role-detail';
import { useSetRolePermissions } from '../hooks/use-set-role-permissions';
import type { RoleDetail } from '../schemas/role.schema';
import { RoleDetailDialog } from './role-detail-dialog';

vi.mock('../hooks/use-role-detail');
vi.mock('../hooks/use-permissions-list');
vi.mock('../hooks/use-set-role-permissions');

const mockedUseRoleDetail = vi.mocked(useRoleDetail);
const mockedUsePermissionsList = vi.mocked(usePermissionsList);
const mockedUseSetRolePermissions = vi.mocked(useSetRolePermissions);

const USER_READ = {
  id: 'ae6c90af-a879-4e26-8530-1e8b0448ced5',
  name: 'USER:READ',
  category: 'USER_MANAGEMENT',
  description: 'Xem thông tin người dùng',
};

const customRole: RoleDetail = {
  id: 'r-support',
  name: 'SUPPORT',
  description: 'Nhân viên hỗ trợ',
  permissions: [USER_READ],
  userCount: 2,
  createdAt: '2026-10-07T11:01:08.486816Z',
  updatedAt: '2026-10-07T11:01:08.486816Z',
  system: false,
};

const systemRole: RoleDetail = { ...customRole, id: 'r-admin', name: 'ADMIN', system: true };

interface MockOptions {
  role?: RoleDetail;
  roleLoading?: boolean;
  roleError?: ApiError | null;
  permissionsLoading?: boolean;
  permissionsError?: ApiError | null;
}

function mockQueries(options: MockOptions = {}) {
  const refetchRole = vi.fn();
  const refetchPermissions = vi.fn();

  mockedUseRoleDetail.mockReturnValue({
    data: options.role,
    isLoading: options.roleLoading ?? false,
    isError: Boolean(options.roleError),
    error: options.roleError ?? null,
    refetch: refetchRole,
  } as unknown as ReturnType<typeof useRoleDetail>);

  mockedUsePermissionsList.mockReturnValue({
    data: PERMISSIONS_BY_CATEGORY,
    isLoading: options.permissionsLoading ?? false,
    isError: Boolean(options.permissionsError),
    error: options.permissionsError ?? null,
    refetch: refetchPermissions,
  } as unknown as ReturnType<typeof usePermissionsList>);

  mockedUseSetRolePermissions.mockReturnValue({
    mutate: vi.fn(),
    isPending: false,
  } as unknown as ReturnType<typeof useSetRolePermissions>);

  return { refetchRole, refetchPermissions };
}

function renderDialog(roleId: string | undefined = customRole.id) {
  return renderWithProviders(<RoleDetailDialog roleId={roleId} open onOpenChange={vi.fn()} />);
}

describe('RoleDetailDialog', () => {
  beforeEach(() => {
    mockedUseRoleDetail.mockReset();
    mockedUsePermissionsList.mockReset();
    mockedUseSetRolePermissions.mockReset();
  });

  it('shows the loading skeleton while either query is pending', () => {
    mockQueries({ roleLoading: true });
    renderDialog();

    expect(screen.getByRole('status')).toHaveAttribute('aria-label', 'Loading role details');
  });

  it('shows the error state and retries both queries', async () => {
    const { refetchRole, refetchPermissions } = mockQueries({
      roleError: { httpStatus: 500, kind: 'server', message: 'boom' },
    });
    renderDialog();

    expect(screen.getByText('Internal server error.')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Retry' }));

    expect(refetchRole).toHaveBeenCalledTimes(1);
    expect(refetchPermissions).toHaveBeenCalledTimes(1);
  });

  it('shows a not-found message when the role resolves empty', () => {
    mockQueries();
    renderDialog();

    expect(screen.getByText('This role could not be found.')).toBeInTheDocument();
  });

  it('renders the role metadata and the permission matrix', () => {
    mockQueries({ role: customRole });
    const { container } = renderDialog();

    expect(screen.getAllByText('SUPPORT').length).toBeGreaterThan(0);
    expect(screen.getByText('Nhân viên hỗ trợ')).toBeInTheDocument();
    expect(screen.getByText('Users')).toBeInTheDocument();
    expect(screen.getByText('Custom')).toBeInTheDocument();
    expect(container).toBeInTheDocument();
    expect(document.querySelectorAll('time')).toHaveLength(2);
    expect(screen.getAllByRole('checkbox')).toHaveLength(25);
    expect(screen.getByRole('checkbox', { name: 'USER:READ' })).toBeChecked();
  });

  it('keeps a system role viewable but read-only', () => {
    mockQueries({ role: systemRole });
    renderDialog('r-admin');

    expect(
      screen.getByText('This is a system role. Its permissions can be viewed but not changed.')
    ).toBeInTheDocument();
    expect(screen.getByText('System', { selector: '[data-slot="badge"]' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Save permissions' })).toBeDisabled();
    expect(screen.getByRole('checkbox', { name: 'USER:READ' })).toBeDisabled();
  });

  it('lets a custom role save its permissions', () => {
    mockQueries({ role: customRole });
    renderDialog();

    expect(screen.getByRole('button', { name: 'Save permissions' })).toBeEnabled();
    expect(screen.getByRole('checkbox', { name: 'USER:READ' })).toBeEnabled();
  });
});
