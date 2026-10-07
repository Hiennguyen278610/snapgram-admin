import { describe, it, expect, vi, beforeEach, beforeAll } from 'vitest';

const spy = vi.hoisted(() => ({
  push: vi.fn(),
  searchParams: { value: new URLSearchParams() },
}));

vi.mock('next/navigation', () => ({
  useSearchParams: () => spy.searchParams.value,
}));

vi.mock('@/i18n/navigation', () => ({
  useRouter: () => ({ push: spy.push, replace: vi.fn(), prefetch: vi.fn(), back: vi.fn() }),
  usePathname: () => '/en/admin/login',
}));

vi.mock('../services/auth.service', () => ({
  loginAdmin: vi.fn(),
}));

import { renderWithProviders, screen, fireEvent, waitFor } from '@/test-utils/render';
import { loginAdmin } from '../services/auth.service';
import type { ApiError } from '@/lib/api/types';
import { LoginForm } from './login-form';

const loginAdminMock = vi.mocked(loginAdmin);

function fillCredentials(container: HTMLElement, password: string) {
  fireEvent.change(screen.getByLabelText(/email/i), {
    target: { value: 'admin@snapgram.dev' },
  });
  const passwordInput = container.querySelector('input[autocomplete="current-password"]');
  fireEvent.change(passwordInput as HTMLInputElement, { target: { value: password } });
}

function submit() {
  fireEvent.click(screen.getByRole('button', { name: /sign in/i }));
}

// Same jsdom gap as in two-factor-modal.test.tsx: the 2FA dialog mounts an
// input-otp field, whose deferred timer calls document.elementFromPoint.
beforeAll(() => {
  document.elementFromPoint = () => null;
});

describe('LoginForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    spy.searchParams.value = new URLSearchParams();
  });

  it('renders form fields', () => {
    const { container } = renderWithProviders(<LoginForm />);
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(container.querySelector('input[autocomplete="current-password"]')).toHaveAttribute(
      'type',
      'password'
    );
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
  });

  it('marks email invalid on invalid input', async () => {
    renderWithProviders(<LoginForm />);
    const email = screen.getByLabelText(/email/i);
    fireEvent.change(email, { target: { value: 'invalid' } });
    fireEvent.blur(email);
    await waitFor(() => expect(email).toHaveAttribute('aria-invalid', 'true'));
  });

  it('shows a lockout alert with a countdown when the account is locked', async () => {
    loginAdminMock.mockRejectedValue({
      httpStatus: 401,
      kind: 'locked',
      message: 'Account is locked',
    } satisfies ApiError);

    const { container } = renderWithProviders(<LoginForm />);
    fillCredentials(container, 'password');
    submit();

    await waitFor(() => expect(screen.getByRole('alert')).toBeInTheDocument());
    expect(screen.getByRole('timer').textContent).toContain('15:00');
    expect(screen.getByRole('button', { name: /sign in/i })).toBeDisabled();
  });

  it('shows a rate limit alert with a countdown', async () => {
    loginAdminMock.mockRejectedValue({
      httpStatus: 429,
      kind: 'rateLimit',
      message: 'Too many attempts',
    } satisfies ApiError);

    const { container } = renderWithProviders(<LoginForm />);
    fillCredentials(container, 'password');
    submit();

    await waitFor(() => expect(screen.getByRole('alert')).toBeInTheDocument());
    expect(screen.getByRole('timer').textContent).toContain('01:00');
  });

  it('signs in and redirects to the default dashboard on success', async () => {
    loginAdminMock.mockResolvedValue({ user: { id: 'admin-id', email: 'admin@snapgram.dev' } });

    const { container } = renderWithProviders(<LoginForm />);
    fillCredentials(container, 'password');
    submit();

    await waitFor(() => expect(spy.push).toHaveBeenCalledWith('/admin/dashboard'));
  });

  it('opens the two-factor dialog when the API requires 2FA', async () => {
    loginAdminMock.mockResolvedValue({ requiresTwoFa: true, tempToken: 'temp-token' });

    const { container } = renderWithProviders(<LoginForm />);
    fillCredentials(container, 'password');
    submit();

    await waitFor(() => expect(screen.getByRole('dialog')).toBeInTheDocument());
    expect(spy.push).not.toHaveBeenCalled();
  });

  it('honors the redirect search param without duplicating the locale prefix', async () => {
    spy.searchParams.value = new URLSearchParams('redirect=/en/admin/users');
    loginAdminMock.mockResolvedValue({ user: { id: 'admin-id', email: 'admin@snapgram.dev' } });

    const { container } = renderWithProviders(<LoginForm />);
    fillCredentials(container, 'password');
    submit();

    await waitFor(() => expect(spy.push).toHaveBeenCalledWith('/admin/users'));
  });

  it('falls back to the dashboard when the redirect param is only the locale', async () => {
    spy.searchParams.value = new URLSearchParams('redirect=/en');
    loginAdminMock.mockResolvedValue({ user: { id: 'admin-id', email: 'admin@snapgram.dev' } });

    const { container } = renderWithProviders(<LoginForm />);
    fillCredentials(container, 'password');
    submit();

    await waitFor(() => expect(spy.push).toHaveBeenCalledWith('/admin/dashboard'));
  });
});
