import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useCurrentUser } from './use-current-user';
import { usePermission } from './use-permission';

vi.mock('./use-current-user');

const mockedUseCurrentUser = vi.mocked(useCurrentUser);

describe('usePermission', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('recognizes ADMIN role and grants all permissions', () => {
    mockedUseCurrentUser.mockReturnValue({
      data: {
        id: '1',
        username: 'admin',
        email: 'admin@snapgram.com',
        role: 'ADMIN',
        roles: ['ADMIN'],
        permissions: ['USER:READ'],
      },
      isLoading: false,
    } as unknown as ReturnType<typeof useCurrentUser>);

    const { result } = renderHook(() => usePermission());

    expect(result.current.isAdmin).toBe(true);
    expect(result.current.hasPermission('USER:READ')).toBe(true);
    expect(result.current.hasPermission('RANDOM:PERMISSION')).toBe(true);
    expect(result.current.hasAnyPermission('A', 'B')).toBe(true);
  });

  it('restricts permissions for non-admin staff (SUPPORT role)', () => {
    mockedUseCurrentUser.mockReturnValue({
      data: {
        id: '2',
        username: 'support_staff',
        email: 'support@snapgram.com',
        role: 'SUPPORT',
        roles: ['SUPPORT', 'USER'],
        permissions: ['USER:READ', 'REPORT:VIEW', 'SUPPORT:TICKET_READ'],
      },
      isLoading: false,
    } as unknown as ReturnType<typeof useCurrentUser>);

    const { result } = renderHook(() => usePermission());

    expect(result.current.isAdmin).toBe(false);
    expect(result.current.hasPermission('USER:READ')).toBe(true);
    expect(result.current.hasPermission('REPORT:VIEW')).toBe(true);
    expect(result.current.hasPermission('USER:ROLE_ASSIGN')).toBe(false);
    expect(result.current.hasPermission('USER:BAN')).toBe(false);
    expect(result.current.hasAnyPermission('USER:BAN', 'USER:READ')).toBe(true);
    expect(result.current.hasAllPermissions('USER:READ', 'USER:BAN')).toBe(false);
  });

  it('handles loading state and missing user', () => {
    mockedUseCurrentUser.mockReturnValue({
      data: undefined,
      isLoading: true,
    } as unknown as ReturnType<typeof useCurrentUser>);

    const { result } = renderHook(() => usePermission());

    expect(result.current.isLoading).toBe(true);
    expect(result.current.isAdmin).toBe(false);
    expect(result.current.hasPermission('USER:READ')).toBe(false);
  });
});
