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
  it('renders default logo with image and brand text', () => {
    renderWithProviders(<BrandLogo />);

    const img = screen.getByAltText('Snapgram Logo');
    expect(img).toBeInTheDocument();
    expect(img.parentElement).toHaveClass('size-8');
    expect(screen.getByText('Snapgram')).toBeInTheDocument();

    const link = screen.getByRole('link', { name: /Snapgram Admin/i });
    expect(link).toHaveAttribute('href', '/admin/dashboard');
  });

  it('renders collapsed state with only icon and title attribute on link', () => {
    renderWithProviders(<BrandLogo collapsed />);

    expect(screen.getByAltText('Snapgram Logo')).toBeInTheDocument();
    expect(screen.queryByText('Snapgram')).not.toBeInTheDocument();

    const link = screen.getByRole('link', { name: /Snapgram Admin/i });
    expect(link).toHaveAttribute('title', 'Snapgram Admin');
  });

  it('renders without link when href is null', () => {
    renderWithProviders(<BrandLogo href={null} />);

    expect(screen.getByAltText('Snapgram Logo')).toBeInTheDocument();
    expect(screen.getByText('Snapgram')).toBeInTheDocument();
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
  });

  it('respects showText=false', () => {
    renderWithProviders(<BrandLogo showText={false} />);

    expect(screen.getByAltText('Snapgram Logo')).toBeInTheDocument();
    expect(screen.queryByText('Snapgram')).not.toBeInTheDocument();
  });

  it('supports custom href and size variants', () => {
    renderWithProviders(<BrandLogo size="xl" href="/admin/users" />);

    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('href', '/admin/users');
    expect(screen.getByAltText('Snapgram Logo').parentElement).toHaveClass('size-14');
    expect(screen.getByText('Snapgram')).toBeInTheDocument();
  });
});
