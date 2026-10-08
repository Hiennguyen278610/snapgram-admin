import { describe, it, expect, vi, beforeEach } from 'vitest';
import userEvent from '@testing-library/user-event';
import { renderWithProviders, screen } from '@/test-utils/render';
import type { ApiError } from '@/lib/api/types';
import { useRolesList } from '../hooks/use-roles-list';
import type { RoleDetail } from '../schemas/role.schema';
import { RbacPageContent } from './rbac-page-content';

vi.mock('../hooks/use-roles-list');

const mockedUseRolesList = vi.mocked(useRolesList);

const roles: RoleDetail[] = [
  {
    id: 'r-admin',
    name: 'ADMIN',
    description: 'Admin',
    permissions: [],
    userCount: 1,
    system: true,
  },
  {
    id: 'r-support',
    name: 'SUPPORT',
    description: 'Support',
    permissions: [],
    userCount: 0,
    system: false,
  },
];

function mockList(
  overrides: {
    data?: RoleDetail[];
    isLoading?: boolean;
    isError?: boolean;
    error?: ApiError | null;
  } = {}
) {
  const refetch = vi.fn();
  mockedUseRolesList.mockReturnValue({
    data: overrides.data,
    isLoading: overrides.isLoading ?? false,
    isError: overrides.isError ?? false,
    error: overrides.error ?? null,
    refetch,
  } as unknown as ReturnType<typeof useRolesList>);
  return { refetch };
}

describe('RbacPageContent', () => {
  beforeEach(() => {
    mockedUseRolesList.mockReset();
  });

  it('keeps the page heading and shows the table skeleton while loading', () => {
    mockList({ isLoading: true });
    renderWithProviders(<RbacPageContent />);

    expect(screen.getByRole('heading', { name: 'Roles & Permissions' })).toBeInTheDocument();
    expect(screen.getByRole('status')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /create role/i })).toBeInTheDocument();
  });

  it('shows the error state and retries the query', async () => {
    const { refetch } = mockList({
      isError: true,
      error: { httpStatus: 500, kind: 'server', message: 'boom' },
    });
    renderWithProviders(<RbacPageContent />);

    expect(screen.getByRole('heading', { name: 'Roles & Permissions' })).toBeInTheDocument();
    expect(screen.getByText('Failed to load roles')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Retry' }));
    expect(refetch).toHaveBeenCalledTimes(1);
  });

  it('shows the empty state when the backend returns no roles', () => {
    mockList({ data: [] });
    renderWithProviders(<RbacPageContent />);

    expect(screen.getByRole('heading', { name: 'Roles & Permissions' })).toBeInTheDocument();
    expect(screen.getByText('No roles found')).toBeInTheDocument();
  });

  it('renders the roles table when data is available', () => {
    mockList({ data: roles });
    renderWithProviders(<RbacPageContent />);

    expect(screen.getByRole('heading', { name: 'Roles & Permissions' })).toBeInTheDocument();
    expect(screen.getByText('ADMIN')).toBeInTheDocument();
    expect(screen.getByText('SUPPORT')).toBeInTheDocument();
    expect(screen.getAllByRole('row')).toHaveLength(3);
  });

  it('opens the create dialog from the header action', async () => {
    mockList({ data: roles });
    renderWithProviders(<RbacPageContent />);

    await userEvent.click(screen.getByRole('button', { name: /create role/i }));

    expect(await screen.findByRole('dialog')).toBeInTheDocument();
    expect(screen.getByLabelText('Role name')).toBeInTheDocument();
  });
});
