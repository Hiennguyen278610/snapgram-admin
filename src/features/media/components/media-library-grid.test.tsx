import { describe, it, expect, vi, beforeEach } from 'vitest';
import userEvent from '@testing-library/user-event';
import { renderWithProviders, screen } from '@/test-utils/render';
import type { Media } from '../schemas/media.schema';
import { MediaLibraryGrid } from './media-library-grid';

// Radix ScrollArea needs ResizeObserver, which jsdom does not implement.
class ResizeObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}
vi.stubGlobal('ResizeObserver', ResizeObserverStub);

const items: Media[] = [
  {
    id: 'aaaaaaaa-1111-4111-8111-111111111101',
    ownerId: 'u-1',
    url: 'http://localhost:9000/snapgram-media/a.jpg',
    thumbnailUrl: 'http://localhost:9000/snapgram-media/a-thumb.webp',
    mimeType: 'image/jpeg',
    sizeBytes: 1024,
    status: 'READY',
    width: 10,
    height: 10,
    durationSec: null,
    createdAt: '2026-10-08T06:00:00Z',
  },
  {
    id: 'bbbbbbbb-2222-4222-8222-222222222201',
    ownerId: 'u-1',
    url: 'http://localhost:9000/snapgram-media/b.mp4',
    thumbnailUrl: null,
    mimeType: 'video/mp4',
    sizeBytes: 8_000_000,
    status: 'READY',
    width: 10,
    height: 10,
    durationSec: 12,
    createdAt: '2026-10-08T06:05:00Z',
  },
];

const onSelect = vi.fn();
const onDelete = vi.fn();
const onPageChange = vi.fn();
const onRetry = vi.fn();

function renderReady(overrides: { page?: number; totalPages?: number } = {}) {
  return renderWithProviders(
    <MediaLibraryGrid
      status="ready"
      items={items}
      page={overrides.page ?? 0}
      totalPages={overrides.totalPages ?? 1}
      onSelect={onSelect}
      onDelete={onDelete}
      onPageChange={onPageChange}
    />
  );
}

describe('MediaLibraryGrid', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the loading skeleton', () => {
    renderWithProviders(<MediaLibraryGrid status="loading" />);

    expect(screen.getByRole('status')).toHaveAttribute('aria-busy', 'true');
  });

  it('renders the empty library state', () => {
    renderWithProviders(<MediaLibraryGrid status="empty" />);

    expect(screen.getByRole('heading', { name: 'No media yet' })).toBeInTheDocument();
  });

  it('renders the error state and retries', async () => {
    renderWithProviders(
      <MediaLibraryGrid
        status="error"
        error={{ httpStatus: 0, kind: 'network', message: 'offline' }}
        onRetry={onRetry}
      />
    );

    expect(screen.getByText('Failed to load media')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Retry' }));

    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it('renders every tile and hides pagination on a single page', () => {
    renderReady();

    expect(screen.getByText('Your files')).toBeInTheDocument();
    expect(screen.getAllByRole('listitem')).toHaveLength(2);
    expect(screen.queryByRole('navigation', { name: 'pagination' })).not.toBeInTheDocument();
  });

  it('paginates and disables Previous on the first page', async () => {
    renderReady({ page: 0, totalPages: 3 });

    expect(screen.getByText('Page 1 of 3')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Previous/ })).toBeDisabled();

    await userEvent.click(screen.getByRole('button', { name: /Next/ }));

    expect(onPageChange).toHaveBeenCalledWith(1);
  });

  it('disables Next on the last page', () => {
    renderReady({ page: 2, totalPages: 3 });

    expect(screen.getByRole('button', { name: /Next/ })).toBeDisabled();
  });

  it('forwards preview and delete actions from the tiles', async () => {
    renderReady();

    await userEvent.click(screen.getByRole('button', { name: 'Preview image/jpeg' }));
    await userEvent.click(screen.getByRole('button', { name: 'Delete video/mp4' }));

    expect(onSelect).toHaveBeenCalledWith(items[0]);
    expect(onDelete).toHaveBeenCalledWith(items[1]);
  });
});
