import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClientProvider } from '@tanstack/react-query';
import { ReactNode } from 'react';
import { makeQueryClient } from '@/test-utils/render';
import type { PageMedia } from '../schemas/media.schema';
import { fetchMyMedia } from '../services/media.service';
import { useMediaList } from './use-media-list';

vi.mock('../services/media.service', () => ({ fetchMyMedia: vi.fn() }));

const mockedFetchMyMedia = vi.mocked(fetchMyMedia);

const page: PageMedia = {
  content: [],
  totalElements: 0,
  totalPages: 0,
  number: 0,
  size: 20,
  numberOfElements: 0,
  first: true,
  last: true,
  empty: true,
};

function makeWrapper() {
  const queryClient = makeQueryClient();
  return {
    queryClient,
    wrapper: ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    ),
  };
}

describe('useMediaList', () => {
  beforeEach(() => {
    mockedFetchMyMedia.mockReset();
    // Never resolve to `undefined` (react-query warns); individual tests override.
    mockedFetchMyMedia.mockResolvedValue(page);
  });

  it('starts pending while the library loads', () => {
    const { wrapper } = makeWrapper();
    const { result } = renderHook(() => useMediaList({ page: 0, size: 20 }), { wrapper });

    expect(result.current.isPending).toBe(true);
  });

  it('calls the service with the provided filters', async () => {
    mockedFetchMyMedia.mockResolvedValue(page);
    const { wrapper } = makeWrapper();
    const { result } = renderHook(() => useMediaList({ page: 2, size: 6 }), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockedFetchMyMedia).toHaveBeenCalledWith({ page: 2, size: 6 });
    expect(result.current.data).toEqual(page);
  });

  it('caches under the hierarchical media list key', async () => {
    mockedFetchMyMedia.mockResolvedValue(page);
    const { wrapper, queryClient } = makeWrapper();
    renderHook(() => useMediaList({ page: 1, size: 12 }), { wrapper });

    await waitFor(() => expect(queryClient.getQueryCache().getAll()).toHaveLength(1));

    expect(queryClient.getQueryCache().getAll()[0].queryKey).toEqual([
      'admin',
      'media',
      'list',
      { page: 1, size: 12 },
    ]);
  });

  it('exposes the ApiError when the query fails', async () => {
    mockedFetchMyMedia.mockRejectedValue({ httpStatus: 500, kind: 'server', message: 'boom' });
    const { wrapper } = makeWrapper();
    const { result } = renderHook(() => useMediaList({ page: 0 }), { wrapper });

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(result.current.error).toMatchObject({ kind: 'server' });
  });
});
