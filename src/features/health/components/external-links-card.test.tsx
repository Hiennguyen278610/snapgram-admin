import { describe, it, expect } from 'vitest';
import { renderWithProviders, screen, within } from '@/test-utils/render';
import { ExternalLinksCard } from './external-links-card';

describe('ExternalLinksCard', () => {
  it('renders the three infrastructure links', () => {
    renderWithProviders(<ExternalLinksCard />);

    const links = screen.getAllByRole('link');
    expect(links).toHaveLength(3);
    expect(screen.getByRole('link', { name: /Kafka UI/ })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /MinIO Console/ })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Mailpit/ })).toBeInTheDocument();
  });

  it('opens every link in a new tab with a safe rel', () => {
    renderWithProviders(<ExternalLinksCard />);

    for (const link of screen.getAllByRole('link')) {
      expect(link).toHaveAttribute('target', '_blank');
      expect(link).toHaveAttribute('rel', 'noopener noreferrer');
    }
  });

  it('points each link at its configured public URL', () => {
    renderWithProviders(<ExternalLinksCard />);

    expect(screen.getByRole('link', { name: /Kafka UI/ })).toHaveAttribute(
      'href',
      'http://localhost:8089'
    );
    expect(screen.getByRole('link', { name: /MinIO Console/ })).toHaveAttribute(
      'href',
      'http://localhost:9001'
    );
    expect(screen.getByRole('link', { name: /Mailpit/ })).toHaveAttribute(
      'href',
      'http://localhost:8025'
    );
  });

  it('renders the card title and description', () => {
    renderWithProviders(<ExternalLinksCard />);

    const card = screen.getByRole('heading', { name: 'External Tools' }).parentElement;
    expect(card).not.toBeNull();
    expect(within(card as HTMLElement).getByText('External Tools')).toBeInTheDocument();
    expect(
      within(card as HTMLElement).getByText('Quick access to infrastructure dashboards')
    ).toBeInTheDocument();
  });
});
