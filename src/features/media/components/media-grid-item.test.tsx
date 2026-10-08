import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders, screen } from '@/test-utils/render';
import type { Media } from '../schemas/media.schema';
import { MediaGridItem } from './media-grid-item';

const baseMedia: Media = {
  id: 'aaaaaaaa-1111-4111-8111-111111111101',
  ownerId: 'u-1',
  url: 'http://localhost:9000/snapgram-media/a.jpg',
  thumbnailUrl: 'http://localhost:9000/snapgram-media/a-thumb.webp',
  mimeType: 'image/jpeg',
  sizeBytes: 184_320,
  status: 'READY',
  width: 100,
  height: 100,
  durationSec: null,
  createdAt: '2026-10-08T06:00:00Z',
};

const onSelect = vi.fn();
const onDelete = vi.fn();

function renderItem(media: Media = baseMedia) {
  return renderWithProviders(
    <MediaGridItem media={media} onSelect={onSelect} onDelete={onDelete} />
  );
}

describe('MediaGridItem', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the thumbnail, short id, mime type and size', () => {
    const { container } = renderItem();

    expect(container.querySelector('img')).not.toBeNull();
    expect(screen.getByText('aaaaaaaa')).toBeInTheDocument();
    expect(screen.getByText('image/jpeg')).toBeInTheDocument();
    expect(screen.getByText('180 KB')).toBeInTheDocument();
  });

  it('previews the file when the tile is activated', async () => {
    renderItem();

    await userEvent.click(screen.getByRole('button', { name: 'Preview image/jpeg' }));

    expect(onSelect).toHaveBeenCalledWith(baseMedia);
    expect(onDelete).not.toHaveBeenCalled();
  });

  it('deletes through the dedicated affordance without previewing', async () => {
    renderItem();

    await userEvent.click(screen.getByRole('button', { name: 'Delete image/jpeg' }));

    expect(onDelete).toHaveBeenCalledWith(baseMedia);
    expect(onSelect).not.toHaveBeenCalled();
  });

  it('falls back to an icon when the thumbnail fails to load', () => {
    const { container } = renderItem();

    const img = container.querySelector('img');
    expect(img).not.toBeNull();
    fireEvent.error(img as HTMLImageElement);

    expect(container.querySelector('img')).toBeNull();
    expect(screen.getByRole('button', { name: 'Preview image/jpeg' })).toBeInTheDocument();
  });

  it('shows a video badge for video media and formats MB', () => {
    renderItem({
      ...baseMedia,
      mimeType: 'video/mp4',
      thumbnailUrl: null,
      url: 'http://localhost:9000/snapgram-media/a.mp4',
      sizeBytes: 8 * 1024 * 1024,
      durationSec: 42,
    });

    expect(screen.getByText('Video')).toBeInTheDocument();
    expect(screen.getByText('8 MB')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Preview video/mp4' })).toBeInTheDocument();
  });
});
