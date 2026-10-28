import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders, screen } from '@/test-utils/render';
import { useCurrentUser } from '@/features/auth/hooks/use-current-user';
import { useLogout } from '@/features/auth/hooks/use-logout';
import { useUIStore } from '@/stores/ui-store';
import type { CurrentUser } from '@/features/auth/services/auth.service';
import { UserMenu } from './user-menu';

const spies = vi.hoisted(() => ({
  replace: vi.fn(),
  setTheme: vi.fn(),
  mutate: vi.fn(),
}));

vi.mock('@/i18n/navigation', () => ({
  useRouter: () => ({ replace: spies.replace, push: vi.fn(), refresh: vi.fn() }),
  usePathname: () => '/admin/dashboard',
}));

vi.mock('next-themes', () => ({
  useTheme: () => ({ theme: 'system', setTheme: spies.setTheme }),
}));

vi.mock('@/features/auth/hooks/use-current-user', () => ({ useCurrentUser: vi.fn() }));
vi.mock('@/features/auth/hooks/use-logout', () => ({ useLogout: vi.fn() }));

const mockedUseCurrentUser = vi.mocked(useCurrentUser);
const mockedUseLogout = vi.mocked(useLogout);

const ADMIN: CurrentUser = {
  id: 'admin-id',
  username: 'admin',
  email: 'admin@snapgram.com',
  displayName: 'Administrator',
  role: 'ADMIN',
  roles: ['ADMIN'],
  permissions: ['USER:READ'],
  emailVerified: true,
};

function mockUser({ data, isLoading }: { data?: CurrentUser; isLoading?: boolean } = {}) {
  mockedUseCurrentUser.mockReturnValue({
    data,
    isLoading: isLoading ?? false,
  } as unknown as ReturnType<typeof useCurrentUser>);
}

function getSkeleton() {
  return document.querySelector('[data-slot="skeleton"]');
}

describe('UserMenu', () => {
  beforeEach(() => {
    mockedUseCurrentUser.mockReset();
    mockedUseLogout.mockReset();
    mockedUseLogout.mockReturnValue({
      mutate: spies.mutate,
      isPending: false,
    } as unknown as ReturnType<typeof useLogout>);
    spies.mutate.mockReset();
    spies.setTheme.mockReset();
    spies.replace.mockReset();
    act(() => useUIStore.setState({ sidebarCollapsed: false }));
  });

  afterEach(() => {
    act(() => useUIStore.setState({ sidebarCollapsed: false }));
  });

  it('renders a skeleton while the session is loading', () => {
    mockUser({ isLoading: true });

    renderWithProviders(<UserMenu />);

    expect(getSkeleton()).not.toBeNull();
    expect(screen.queryByRole('button', { name: 'Open user menu' })).not.toBeInTheDocument();
  });

  it('renders the admin display name and email', async () => {
    mockUser({ data: ADMIN });

    renderWithProviders(<UserMenu />);

    expect(await screen.findByText('Administrator')).toBeInTheDocument();
    expect(screen.getByText('admin@snapgram.com')).toBeInTheDocument();
    expect(getSkeleton()).toBeNull();
  });

  it('calls logout when the Log out item is chosen', async () => {
    mockUser({ data: ADMIN });

    renderWithProviders(<UserMenu />);

    await userEvent.click(await screen.findByRole('button', { name: 'Open user menu' }));
    await userEvent.click(await screen.findByRole('menuitem', { name: 'Log out' }));

    expect(spies.mutate).toHaveBeenCalledTimes(1);
  });

  it('shows only the avatar when the sidebar is collapsed', async () => {
    act(() => useUIStore.setState({ sidebarCollapsed: true }));
    mockUser({ data: ADMIN });

    renderWithProviders(<UserMenu />);

    const trigger = await screen.findByRole('button', { name: 'Open user menu' });
    expect(trigger).toHaveTextContent('AD');
    expect(screen.queryByText('Administrator')).not.toBeInTheDocument();
    expect(screen.queryByText('admin@snapgram.com')).not.toBeInTheDocument();
  });

  it('renders nothing without a session', () => {
    mockUser({ data: undefined });

    renderWithProviders(<UserMenu />);

    expect(screen.queryByRole('button', { name: 'Open user menu' })).not.toBeInTheDocument();
    expect(getSkeleton()).toBeNull();
  });
});
