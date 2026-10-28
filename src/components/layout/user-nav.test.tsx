import { describe, it, expect, vi, beforeEach } from 'vitest';
import userEvent from '@testing-library/user-event';
import { renderWithProviders, screen } from '@/test-utils/render';
import { useCurrentUser } from '@/features/auth/hooks/use-current-user';
import { useLogout } from '@/features/auth/hooks/use-logout';
import { UserNav } from './user-nav';

vi.mock('@/i18n/navigation', () => ({
  useRouter: () => ({ replace: vi.fn(), push: vi.fn(), prefetch: vi.fn() }),
  usePathname: () => '/admin/dashboard',
}));

vi.mock('@/features/auth/hooks/use-current-user');
vi.mock('@/features/auth/hooks/use-logout');

const mockedUseCurrentUser = vi.mocked(useCurrentUser);
const mockedUseLogout = vi.mocked(useLogout);

describe('UserNav', () => {
  beforeEach(() => {
    mockedUseCurrentUser.mockReset();
    mockedUseLogout.mockReset();
    mockedUseLogout.mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
    } as unknown as ReturnType<typeof useLogout>);
  });

  it('renders user details and role badge', () => {
    mockedUseCurrentUser.mockReturnValue({
      data: {
        id: '1',
        username: 'admin',
        displayName: 'Snapgram Admin',
        email: 'admin@snapgram.com',
        role: 'ADMIN',
      },
      isLoading: false,
    } as unknown as ReturnType<typeof useCurrentUser>);

    renderWithProviders(<UserNav />);

    expect(screen.getByText('Snapgram Admin')).toBeInTheDocument();
    expect(screen.getByText('@admin')).toBeInTheDocument();
    expect(screen.getByText('ADMIN')).toBeInTheDocument();
  });

  it('renders MODERATOR role badge for moderator staff', () => {
    mockedUseCurrentUser.mockReturnValue({
      data: {
        id: '2',
        username: 'moderator_user',
        displayName: 'Mod Lead',
        email: 'mod@snapgram.com',
        role: 'MODERATOR',
      },
      isLoading: false,
    } as unknown as ReturnType<typeof useCurrentUser>);

    renderWithProviders(<UserNav />);

    expect(screen.getByText('Mod Lead')).toBeInTheDocument();
    expect(screen.getByText('@moderator_user')).toBeInTheDocument();
    expect(screen.getByText('MODERATOR')).toBeInTheDocument();
  });

  it('opens dropdown and allows clicking logout', async () => {
    const user = userEvent.setup();
    const mutate = vi.fn();
    mockedUseLogout.mockReturnValue({
      mutate,
      isPending: false,
    } as unknown as ReturnType<typeof useLogout>);

    mockedUseCurrentUser.mockReturnValue({
      data: {
        id: '1',
        username: 'admin',
        displayName: 'Snapgram Admin',
        email: 'admin@snapgram.com',
        role: 'ADMIN',
      },
      isLoading: false,
    } as unknown as ReturnType<typeof useCurrentUser>);

    renderWithProviders(<UserNav />);

    const trigger = screen.getByRole('button', { name: /Profile/i });
    await user.click(trigger);

    expect(screen.getByText('admin@snapgram.com')).toBeInTheDocument();

    const logoutBtn = screen.getByRole('menuitem', { name: /Log out/i });
    await user.click(logoutBtn);

    expect(mutate).toHaveBeenCalledTimes(1);
  });
});
