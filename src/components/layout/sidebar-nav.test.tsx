import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderWithProviders, screen } from '@/test-utils/render';
import { usePermission } from '@/features/auth/hooks/use-permission';
import { SidebarNav } from './sidebar-nav';

vi.mock('@/i18n/navigation', () => ({
  useRouter: () => ({ replace: vi.fn(), push: vi.fn(), prefetch: vi.fn() }),
  usePathname: () => '/admin/dashboard',
  Link: ({ children, href, ...rest }: React.AnchorHTMLAttributes<HTMLAnchorElement>) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

vi.mock('@/features/auth/hooks/use-permission');

const mockedUsePermission = vi.mocked(usePermission);

describe('SidebarNav Permissions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders all navigation items for ADMIN role', () => {
    mockedUsePermission.mockReturnValue({
      isAdmin: true,
      hasPermission: vi.fn().mockReturnValue(true),
      hasAnyPermission: vi.fn().mockReturnValue(true),
      hasAllPermissions: vi.fn().mockReturnValue(true),
      isLoading: false,
      user: undefined,
      permissions: [],
    });

    renderWithProviders(<SidebarNav />);

    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Users')).toBeInTheDocument();
    expect(screen.getByText('Roles & Permissions')).toBeInTheDocument();
    expect(screen.getByText('Reports')).toBeInTheDocument();
    expect(screen.getByText('Payments')).toBeInTheDocument();
    expect(screen.getByText('System Health')).toBeInTheDocument();
  });

  it('hides RBAC, Payments, SystemHealth for SUPPORT role', () => {
    mockedUsePermission.mockReturnValue({
      isAdmin: false,
      hasPermission: vi.fn((perm) => ['USER:READ', 'REPORT:VIEW'].includes(perm)),
      hasAnyPermission: vi.fn().mockReturnValue(false),
      hasAllPermissions: vi.fn().mockReturnValue(false),
      isLoading: false,
      user: undefined,
      permissions: ['USER:READ', 'REPORT:VIEW'],
    });

    renderWithProviders(<SidebarNav />);

    // Accessible
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Users')).toBeInTheDocument();
    expect(screen.getByText('Reports')).toBeInTheDocument();

    // Hidden
    expect(screen.queryByText('Roles & Permissions')).not.toBeInTheDocument();
    expect(screen.queryByText('Payments')).not.toBeInTheDocument();
    expect(screen.queryByText('System Health')).not.toBeInTheDocument();
  });
});
