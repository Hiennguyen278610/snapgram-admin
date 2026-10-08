import { describe, it, expect, vi, beforeEach } from 'vitest';
import userEvent from '@testing-library/user-event';
import { renderWithProviders, screen, within } from '@/test-utils/render';
import { toast } from 'sonner';
import type { ApiError } from '@/lib/api/types';
import { useDeleteMedia } from '../hooks/use-delete-media';
import { useMediaDetail } from '../hooks/use-media-detail';
import { useMediaList } from '../hooks/use-media-list';
import type { Media, PageMedia } from '../schemas/media.schema';
import { MediaPageContent } from './media-page-content';

vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));
vi.mock('../hooks/use-media-list');
vi.mock('../hooks/use-media-detail');
vi.mock('../hooks/use-delete-media');

// Radix ScrollArea needs ResizeObserver, which jsdom does not implement.
class ResizeObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}
vi.stubGlobal('ResizeObserver', ResizeObserverStub);

const mockedUseMediaList = vi.mocked(useMediaList);
const mockedUseMediaDetail = vi.mocked(useMediaDetail);
const mockedUseDeleteMedia = vi.mocked(useDeleteMedia);

const imageMedia: Media = {
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
};

const page: PageMedia = {
  content: [imageMedia],
  totalElements: 1,
  totalPages: 2,
  number: 0,
  size: 12,
  numberOfElements: 1,
  first: true,
  last: false,
  empty: false,
};

function mockList(
  overrides: {
    data?: PageMedia;
    isLoading?: boolean;
    isError?: boolean;
    isFetching?: boolean;
    error?: ApiError | null;
  } = {}
) {
  const refetch = vi.fn();
  mockedUseMediaList.mockReturnValue({
    data: overrides.data,
    isLoading: overrides.isLoading ?? false,
    isError: overrides.isError ?? false,
    isFetching: overrides.isFetching ?? false,
    error: overrides.error ?? null,
    refetch,
  } as unknown as ReturnType<typeof useMediaList>);
  return { refetch };
}

function mockDelete() {
  const mutate = vi.fn();
  mockedUseDeleteMedia.mockReturnValue({
    mutate,
    isPending: false,
    isError: false,
  } as unknown as ReturnType<typeof useDeleteMedia>);
  return { mutate };
}

function mockDetail(data: Media | undefined) {
  mockedUseMediaDetail.mockReturnValue({
    data,
    isLoading: false,
    isError: false,
    error: null,
    refetch: vi.fn(),
  } as unknown as ReturnType<typeof useMediaDetail>);
}

describe('MediaPageContent', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockDelete();
    mockDetail(undefined);
  });

  it('keeps the page heading and shows the skeleton while loading', () => {
    mockList({ isLoading: true });
    renderWithProviders(<MediaPageContent />);

    expect(screen.getByRole('heading', { name: 'Media Library' })).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveAttribute('aria-busy', 'true');
  });

  it('shows the error state and retries the list query', async () => {
    const { refetch } = mockList({
      isError: true,
      error: { httpStatus: 500, kind: 'server', message: 'boom' },
    });
    renderWithProviders(<MediaPageContent />);

    expect(screen.getByText('Failed to load media')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Retry' }));
    expect(refetch).toHaveBeenCalledTimes(1);
  });

  it('shows the empty state for an empty library', () => {
    mockList({ data: { ...page, content: [], totalElements: 0, totalPages: 0, empty: true } });
    renderWithProviders(<MediaPageContent />);

    expect(screen.getByRole('heading', { name: 'No media yet' })).toBeInTheDocument();
  });

  it('renders the grid and requests the next page', async () => {
    mockList({ data: page });
    renderWithProviders(<MediaPageContent />);

    expect(screen.getByRole('button', { name: 'Preview image/jpeg' })).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: /Next/ }));

    expect(mockedUseMediaList).toHaveBeenLastCalledWith({ page: 1, size: 12 });
  });

  it('opens the preview dialog from a tile', async () => {
    mockList({ data: page });
    mockDetail(imageMedia);
    renderWithProviders(<MediaPageContent />);

    await userEvent.click(screen.getByRole('button', { name: 'Preview image/jpeg' }));

    expect(await screen.findByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('Media preview')).toBeInTheDocument();
  });

  it('deletes a file through the confirm dialog and toasts on success', async () => {
    mockList({ data: page });
    const { mutate } = mockDelete();
    mutate.mockImplementation((_id, options) => {
      options?.onSuccess?.();
    });
    renderWithProviders(<MediaPageContent />);

    await userEvent.click(screen.getByRole('button', { name: 'Delete image/jpeg' }));

    const dialog = await screen.findByRole('alertdialog');
    await userEvent.click(within(dialog).getByRole('button', { name: 'Delete file' }));

    expect(mutate).toHaveBeenCalledWith(imageMedia.id, expect.anything());
    expect(toast.success).toHaveBeenCalledWith('File deleted');
  });

  it('announces a background refetch without blocking the grid', async () => {
    mockList({ data: page, isFetching: true });
    renderWithProviders(<MediaPageContent />);

    expect(screen.getAllByRole('status').length).toBeGreaterThan(0);
    expect(screen.getByRole('button', { name: 'Preview image/jpeg' })).toBeInTheDocument();
  });
});
