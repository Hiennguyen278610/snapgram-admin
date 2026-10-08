import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders, screen } from '@/test-utils/render';
import type { ApiError } from '@/lib/api/types';
import { useMediaDetail } from '../hooks/use-media-detail';
import type { Media } from '../schemas/media.schema';
import { MediaPreviewDialog } from './media-preview-dialog';

vi.mock('../hooks/use-media-detail');

const mockedUseMediaDetail = vi.mocked(useMediaDetail);

const imageMedia: Media = {
  id: 'm-1',
  ownerId: 'u-1',
  url: 'http://localhost:9000/snapgram-media/m-1.jpg',
  thumbnailUrl: null,
  mimeType: 'image/jpeg',
  sizeBytes: 1024,
  status: 'READY',
  width: 10,
  height: 10,
  durationSec: null,
  createdAt: '2026-10-08T06:00:00Z',
};

const videoMedia: Media = {
  ...imageMedia,
  id: 'm-2',
  url: 'http://localhost:9000/snapgram-media/m-2.mp4',
  mimeType: 'video/mp4',
  durationSec: 30,
};

const onOpenChange = vi.fn();

function mockDetail(overrides: {
  data?: Media;
  isLoading?: boolean;
  isError?: boolean;
  error?: ApiError | null;
}) {
  const refetch = vi.fn();
  mockedUseMediaDetail.mockReturnValue({
    data: overrides.data,
    isLoading: overrides.isLoading ?? false,
    isError: overrides.isError ?? false,
    error: overrides.error ?? null,
    refetch,
  } as unknown as ReturnType<typeof useMediaDetail>);
  return { refetch };
}

describe('MediaPreviewDialog', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows a loading state while the detail is fetched', () => {
    mockDetail({ isLoading: true });
    renderWithProviders(<MediaPreviewDialog mediaId="m-1" open onOpenChange={onOpenChange} />);

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveAttribute('aria-busy', 'true');
  });

  it('renders an image from the presigned URL', () => {
    mockDetail({ data: imageMedia });
    renderWithProviders(<MediaPreviewDialog mediaId="m-1" open onOpenChange={onOpenChange} />);

    // Radix Dialog portals into document.body, outside the render container.
    const img = document.querySelector('img');
    expect(img).not.toBeNull();
    expect(img?.getAttribute('src')).toContain(encodeURIComponent(imageMedia.url));
  });

  it('renders a native muted video without autoplay', () => {
    mockDetail({ data: videoMedia });
    renderWithProviders(<MediaPreviewDialog mediaId="m-2" open onOpenChange={onOpenChange} />);

    const video = document.querySelector('video');
    expect(video).not.toBeNull();
    expect(video?.controls).toBe(true);
    expect(video?.muted).toBe(true);
    expect(video?.autoplay).toBe(false);
  });

  it('treats a failed asset load as an expired link and offers a reload', async () => {
    const { refetch } = mockDetail({ data: imageMedia });
    renderWithProviders(<MediaPreviewDialog mediaId="m-1" open onOpenChange={onOpenChange} />);

    fireEvent.error(document.querySelector('img') as HTMLImageElement);

    expect(screen.getByText('This link has expired')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Reload preview' }));
    expect(refetch).toHaveBeenCalledTimes(1);
  });

  it('shows the detail error with a retry', async () => {
    const { refetch } = mockDetail({
      isError: true,
      error: { httpStatus: 404, kind: 'notFound', message: 'gone' },
    });
    renderWithProviders(<MediaPreviewDialog mediaId="m-1" open onOpenChange={onOpenChange} />);

    expect(screen.getByText('The requested resource could not be found.')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Retry' }));
    expect(refetch).toHaveBeenCalledTimes(1);
  });

  it('explains that unsupported file types cannot be previewed', () => {
    mockDetail({ data: { ...imageMedia, mimeType: 'application/pdf' } });
    renderWithProviders(<MediaPreviewDialog mediaId="m-3" open onOpenChange={onOpenChange} />);

    expect(screen.getByText('This file type cannot be previewed here.')).toBeInTheDocument();
  });

  it('closes through the close button', async () => {
    mockDetail({ data: imageMedia });
    renderWithProviders(<MediaPreviewDialog mediaId="m-1" open onOpenChange={onOpenChange} />);

    await userEvent.click(screen.getByRole('button', { name: 'Close preview' }));

    expect(onOpenChange).toHaveBeenCalledWith(false);
  });
});
