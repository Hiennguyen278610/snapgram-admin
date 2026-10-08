import { describe, it, expect, vi } from 'vitest';
import userEvent from '@testing-library/user-event';
import { fireEvent, renderWithProviders, screen } from '@/test-utils/render';
import type { ApiError } from '@/lib/api/types';
import type { RoleDetail } from '../schemas/role.schema';
import { RoleDataTable } from './role-data-table';

const systemRole: RoleDetail = {
  id: 'r-admin',
  name: 'ADMIN',
  description: 'Quản trị viên toàn quyền hệ thống',
  permissions: [],
  userCount: 1,
  system: true,
};

const customRole: RoleDetail = {
  id: 'r-support',
  name: 'SUPPORT',
  description: 'Nhân viên hỗ trợ',
  permissions: [],
  userCount: 3,
  system: false,
};

const noDescriptionRole: RoleDetail = {
  ...customRole,
  id: 'r-plain',
  name: 'PLAIN',
  description: '',
};

function renderReady(roles: RoleDetail[] = [systemRole, customRole]) {
  const handlers = {
    onSelectRole: vi.fn(),
    onEdit: vi.fn(),
    onDelete: vi.fn(),
    onViewPermissions: vi.fn(),
  };
  renderWithProviders(<RoleDataTable status="ready" roles={roles} {...handlers} />);
  return handlers;
}

describe('RoleDataTable', () => {
  it('renders five skeleton rows while loading', () => {
    renderWithProviders(<RoleDataTable status="loading" />);

    expect(screen.getAllByRole('row')).toHaveLength(6); // header + 5 skeleton rows
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('renders the empty state', () => {
    renderWithProviders(<RoleDataTable status="empty" />);

    expect(screen.getByText('No roles found')).toBeInTheDocument();
  });

  it('renders the error state and forwards retries', async () => {
    const onRetry = vi.fn();
    const error: ApiError = { httpStatus: 500, kind: 'server', message: 'boom' };
    renderWithProviders(<RoleDataTable status="error" error={error} onRetry={onRetry} />);

    expect(screen.getByText('Failed to load roles')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Retry' }));

    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it('renders the role rows with localized system/custom badges', () => {
    renderReady();

    expect(screen.getAllByRole('row')).toHaveLength(3);
    expect(screen.getByText('ADMIN')).toBeInTheDocument();
    expect(screen.getByText('SUPPORT')).toBeInTheDocument();
    expect(screen.getByText('System')).toBeInTheDocument();
    expect(screen.getByText('Custom')).toBeInTheDocument();
  });

  it('falls back to the localized "no description" copy', () => {
    renderReady([noDescriptionRole]);

    expect(screen.getByText('No description')).toBeInTheDocument();
  });

  it('opens the detail view on row click and on keyboard activation', async () => {
    const { onSelectRole } = renderReady();

    await userEvent.click(screen.getByText('SUPPORT'));
    expect(onSelectRole).toHaveBeenCalledWith('r-support');

    fireEvent.keyDown(screen.getByText('ADMIN').closest('tr') as HTMLElement, { key: 'Enter' });
    expect(onSelectRole).toHaveBeenCalledWith('r-admin');
  });

  it('does not open the detail view when the action menu is clicked', async () => {
    const { onSelectRole } = renderReady();

    await userEvent.click(screen.getByRole('button', { name: 'Actions for ADMIN' }));

    expect(onSelectRole).not.toHaveBeenCalled();
    expect(await screen.findByRole('menuitem', { name: 'View permissions' })).toBeInTheDocument();
  });

  it('disables Edit and Delete for system roles', async () => {
    const { onEdit, onDelete } = renderReady();

    await userEvent.click(screen.getByRole('button', { name: 'Actions for ADMIN' }));
    const edit = await screen.findByRole('menuitem', { name: 'Edit role' });
    const remove = screen.getByRole('menuitem', { name: 'Delete role' });

    expect(edit).toHaveAttribute('data-disabled');
    expect(remove).toHaveAttribute('data-disabled');

    await userEvent.click(edit);
    await userEvent.click(remove);
    expect(onEdit).not.toHaveBeenCalled();
    expect(onDelete).not.toHaveBeenCalled();
  });

  it('enables Edit / Delete / View permissions for custom roles', async () => {
    const { onEdit, onDelete, onViewPermissions } = renderReady([customRole]);

    await userEvent.click(screen.getByRole('button', { name: 'Actions for SUPPORT' }));

    await userEvent.click(await screen.findByRole('menuitem', { name: 'View permissions' }));
    expect(onViewPermissions).toHaveBeenCalledWith(customRole);

    await userEvent.click(screen.getByRole('button', { name: 'Actions for SUPPORT' }));
    await userEvent.click(await screen.findByRole('menuitem', { name: 'Edit role' }));
    expect(onEdit).toHaveBeenCalledWith(customRole);

    await userEvent.click(screen.getByRole('button', { name: 'Actions for SUPPORT' }));
    await userEvent.click(await screen.findByRole('menuitem', { name: 'Delete role' }));
    expect(onDelete).toHaveBeenCalledWith(customRole);
  });
});
