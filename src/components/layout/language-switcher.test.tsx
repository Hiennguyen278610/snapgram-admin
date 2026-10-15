import { describe, it, expect, vi, beforeEach } from 'vitest';
import userEvent from '@testing-library/user-event';
import { renderWithProviders, screen } from '@/test-utils/render';
import { LanguageSwitcher } from './language-switcher';

const nav = vi.hoisted(() => ({ replace: vi.fn() }));

vi.mock('@/i18n/navigation', () => ({
  useRouter: () => ({ replace: nav.replace, push: vi.fn(), refresh: vi.fn() }),
  usePathname: () => '/admin/dashboard',
}));

// The real sub-menu only mounts its content after a hover/pointer interaction,
// which jsdom cannot reproduce reliably; these passthroughs keep the locale
// selection logic (the part worth testing) fully exercised.
vi.mock('@/components/ui/dropdown-menu', async () => {
  const React = await import('react');
  type Props = { children?: React.ReactNode; onClick?: () => void };
  const Passthrough = ({ children }: Props) => React.createElement('div', null, children);
  const Item = ({ children, onClick }: Props) =>
    React.createElement('button', { type: 'button', onClick }, children);

  return {
    DropdownMenuSub: Passthrough,
    DropdownMenuSubTrigger: Passthrough,
    DropdownMenuSubContent: Passthrough,
    DropdownMenuItem: Item,
  };
});

describe('LanguageSwitcher', () => {
  beforeEach(() => {
    nav.replace.mockReset();
  });

  it('renders the language label and both locales', () => {
    renderWithProviders(<LanguageSwitcher />);

    expect(screen.getByText('Language')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'English' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Tiếng Việt' })).toBeInTheDocument();
  });

  it('marks the active locale with the check icon', () => {
    renderWithProviders(<LanguageSwitcher />);

    const active = screen.getByRole('button', { name: 'English' });
    const inactive = screen.getByRole('button', { name: 'Tiếng Việt' });

    expect(active.querySelector('svg')).not.toBeNull();
    expect(inactive.querySelector('svg')).toBeNull();
  });

  it('switches to the chosen locale on the current path', async () => {
    renderWithProviders(<LanguageSwitcher />);

    await userEvent.click(screen.getByRole('button', { name: 'Tiếng Việt' }));

    expect(nav.replace).toHaveBeenCalledWith('/admin/dashboard', { locale: 'vi' });
  });

  it('keeps the same path when re-selecting the active locale', async () => {
    renderWithProviders(<LanguageSwitcher />);

    await userEvent.click(screen.getByRole('button', { name: 'English' }));

    expect(nav.replace).toHaveBeenCalledWith('/admin/dashboard', { locale: 'en' });
  });
});
