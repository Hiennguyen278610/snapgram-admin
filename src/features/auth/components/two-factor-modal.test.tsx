import { describe, it, expect, vi, beforeEach, beforeAll } from 'vitest';

const spy = vi.hoisted(() => ({
  push: vi.fn(),
  verifyTwoFa: vi.fn(),
}));

vi.mock('@/i18n/navigation', () => ({
  useRouter: () => ({ push: spy.push, replace: vi.fn(), prefetch: vi.fn(), back: vi.fn() }),
  usePathname: () => '/en/admin/login',
}));

vi.mock('../services/auth.service', () => ({
  verifyTwoFa: spy.verifyTwoFa,
}));

import { renderWithProviders, screen, fireEvent, waitFor } from '@/test-utils/render';
import type { ApiError } from '@/lib/api/types';
import { TwoFactorModal } from './two-factor-modal';

const verifyTwoFaMock = vi.mocked(spy.verifyTwoFa);

function otpInput() {
  return document.querySelector('input[inputmode="numeric"]') as HTMLInputElement;
}

function submitButton() {
  return screen.getByRole('button', { name: /sign in/i });
}

// jsdom does not implement elementFromPoint, which input-otp calls from a
// deferred timer when the OTP input receives input; stub it to keep the
// deferred callback from raising unhandled errors.
beforeAll(() => {
  document.elementFromPoint = () => null;
});

describe('TwoFactorModal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders dialog when open', () => {
    renderWithProviders(<TwoFactorModal open={true} onOpenChange={vi.fn()} tempToken="temp" />);
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('does not render dialog when closed', () => {
    renderWithProviders(<TwoFactorModal open={false} onOpenChange={vi.fn()} tempToken="temp" />);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('enables submit only once a full 6-digit code is entered', async () => {
    renderWithProviders(<TwoFactorModal open={true} onOpenChange={vi.fn()} tempToken="temp" />);

    expect(submitButton()).toBeDisabled();

    fireEvent.change(otpInput(), { target: { value: '123456' } });

    await waitFor(() => expect(submitButton()).toBeEnabled());
  });

  it('keeps submit disabled without a temp token', () => {
    renderWithProviders(
      <TwoFactorModal open={true} onOpenChange={vi.fn()} tempToken={undefined} />
    );
    fireEvent.change(otpInput(), { target: { value: '123456' } });
    expect(submitButton()).toBeDisabled();
  });

  it('verifies the code, closes the dialog and redirects to the dashboard', async () => {
    verifyTwoFaMock.mockResolvedValue({ user: { id: 'admin-id', role: 'ADMIN' } });
    const onOpenChange = vi.fn();

    renderWithProviders(
      <TwoFactorModal open={true} onOpenChange={onOpenChange} tempToken="temp-token" />
    );

    fireEvent.change(otpInput(), { target: { value: '123456' } });
    await waitFor(() => expect(submitButton()).toBeEnabled());
    fireEvent.click(submitButton());

    await waitFor(() => expect(spy.push).toHaveBeenCalledWith('/admin/dashboard'));
    expect(verifyTwoFaMock).toHaveBeenCalledWith({ tempToken: 'temp-token', code: '123456' });
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it('shows an error alert when verification fails', async () => {
    verifyTwoFaMock.mockRejectedValue({
      httpStatus: 401,
      kind: 'auth',
      message: 'Invalid code',
    } satisfies ApiError);

    renderWithProviders(<TwoFactorModal open={true} onOpenChange={vi.fn()} tempToken="temp" />);

    fireEvent.change(otpInput(), { target: { value: '000000' } });
    await waitFor(() => expect(submitButton()).toBeEnabled());
    fireEvent.click(submitButton());

    await waitFor(() => expect(screen.getByRole('alert')).toBeInTheDocument());
    expect(spy.push).not.toHaveBeenCalled();
  });

  it('resets the code and reports the closed state when dismissed', async () => {
    const onOpenChange = vi.fn();
    renderWithProviders(
      <TwoFactorModal open={true} onOpenChange={onOpenChange} tempToken="temp-token" />
    );

    fireEvent.change(otpInput(), { target: { value: '123456' } });
    await waitFor(() => expect(submitButton()).toBeEnabled());

    fireEvent.click(screen.getByRole('button', { name: /close/i }));

    await waitFor(() => expect(onOpenChange).toHaveBeenCalledWith(false));
  });
});
