import { describe, it, expect, vi } from 'vitest';
import { renderWithProviders, screen } from '@/test-utils/render';
import { BrandLogo } from './brand-logo';

vi.mock('@/i18n/navigation', () => ({
  Link: ({ children, href, ...rest }: React.AnchorHTMLAttributes<HTMLAnchorElement>) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

describe('BrandLogo', () => {
  it('renders default logo with image, brand text and ADMIN badge', () => {
    renderWithProviders(<BrandLogo />);

    const img = screen.getByAltText('Snapgram Logo');
    expect(img).toBeInTheDocument();
    expect(screen.getByText('Snapgram')).toBeInTheDocument();
    expect(screen.getByText('ADMIN')).toBeInTheDocument();

    const link = screen.getByRole('link', { name: /Snapgram Admin/i });
    expect(link).toHaveAttribute('href', '/admin/dashboard');
  });

  it('renders collapsed state with only icon and title attribute on link', () => {
    renderWithProviders(<BrandLogo collapsed />);

    const img = screen.getByAltText('Snapgram Logo');
    expect(img).toBeInTheDocument();
    expect(screen.queryByText('Snapgram')).not.toBeInTheDocument();
    expect(screen.queryByText('ADMIN')).not.toBeInTheDocument();

    const link = screen.getByRole('link', { name: /Snapgram Admin/i });
    expect(link).toHaveAttribute('title', 'Snapgram Admin');
  });

  it('renders without link when href is null', () => {
    renderWithProviders(<BrandLogo href={null} />);

    expect(screen.getByAltText('Snapgram Logo')).toBeInTheDocument();
    expect(screen.getByText('Snapgram')).toBeInTheDocument();
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
  });

  it('renders custom badge text and respects showText=false', () => {
    renderWithProviders(<BrandLogo showText={false} />);

    expect(screen.getByAltText('Snapgram Logo')).toBeInTheDocument();
    expect(screen.queryByText('Snapgram')).not.toBeInTheDocument();
  });

  it('supports custom href and size variants', () => {
    renderWithProviders(<BrandLogo size="xl" href="/admin/users" />);

    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('href', '/admin/users');
    expect(screen.getByText('PORTAL')).toBeInTheDocument();
  });
});
