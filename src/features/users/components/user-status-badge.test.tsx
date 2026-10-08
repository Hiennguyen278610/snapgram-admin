import { describe, it, expect } from 'vitest';
import { renderWithProviders } from '@/test-utils/render';
import { UserStatusBadge } from './user-status-badge';

describe('UserStatusBadge', () => {
  it('renders Active for a verified, unbanned account', () => {
    const { getByText } = renderWithProviders(
      <UserStatusBadge user={{ banned: false, emailVerified: true }} />
    );

    expect(getByText('Active')).toBeInTheDocument();
  });

  it('renders Banned for a banned account even when the e-mail is unverified', () => {
    const { getByText, container } = renderWithProviders(
      <UserStatusBadge user={{ banned: true, emailVerified: false }} />
    );

    expect(getByText('Banned')).toBeInTheDocument();
    expect(container.querySelector('[data-status="banned"]')).not.toBeNull();
  });

  it('renders Pending for an unverified account', () => {
    const { getByText, container } = renderWithProviders(
      <UserStatusBadge user={{ banned: false, emailVerified: false }} />
    );

    expect(getByText('Pending')).toBeInTheDocument();
    expect(container.querySelector('[data-status="pending"]')).not.toBeNull();
  });

  it('applies the sanctioned emerald palette for the active state', () => {
    const { container } = renderWithProviders(
      <UserStatusBadge user={{ banned: false, emailVerified: true }} />
    );

    const badge = container.querySelector('[data-status="active"]');
    expect(badge?.className).toContain('bg-emerald-50');
    expect(badge?.className).toContain('dark:bg-emerald-950/40');
  });
});
