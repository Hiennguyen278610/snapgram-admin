import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClientProvider } from '@tanstack/react-query';
import { ReactNode } from 'react';
import { makeQueryClient } from '@/test-utils/render';
import type { Media } from '../schemas/media.schema';
import { fetchMediaDetail } from '../services/media.service';
import { useMediaDetail } from './use-media-detail';

vi.mock('../services/media.service', () => ({ fetchMediaDetail: vi.fn() }));

const mockedFetchMediaDetail = vi.mocked(fetchMediaDetail);

const media: Media = {
  id: 'm-1',
  ownerId: 'u-1',
  url: 'http://localhost:9000/x.jpg',
  thumbnailUrl: null,
  mimeType: 'image/jpeg',
  sizeBytes: 10,
  status: 'READY',
  width: 10,
  height: 10,
  durationSec: null,
  createdAt: '2026-10-08T06:00:00Z',
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

describe('useMediaDetail', () => {
  beforeEach(() => {
    mockedFetchMediaDetail.mockReset();
  });

  it('does not fetch without an id (enabled: !!id)', () => {
    const { wrapper } = makeWrapper();
    const { result } = renderHook(() => useMediaDetail(''), { wrapper });

    expect(result.current.fetchStatus).toBe('idle');
    expect(mockedFetchMediaDetail).not.toHaveBeenCalled();
  });

  it('fetches the detail by id', async () => {
    mockedFetchMediaDetail.mockResolvedValue(media);
    const { wrapper } = makeWrapper();
    const { result } = renderHook(() => useMediaDetail('m-1'), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockedFetchMediaDetail).toHaveBeenCalledWith('m-1');
    expect(result.current.data?.mimeType).toBe('image/jpeg');
  });

  it('caches under the media detail key', async () => {
    mockedFetchMediaDetail.mockResolvedValue(media);
    const { wrapper, queryClient } = makeWrapper();
    renderHook(() => useMediaDetail('m-1'), { wrapper });

    await waitFor(() => expect(queryClient.getQueryCache().getAll()).toHaveLength(1));

    expect(queryClient.getQueryCache().getAll()[0].queryKey).toEqual([
      'admin',
      'media',
      'detail',
      'm-1',
    ]);
  });

  it('exposes a notFound error for a missing media id', async () => {
    mockedFetchMediaDetail.mockRejectedValue({
      httpStatus: 404,
      kind: 'notFound',
      message: 'nope',
    });
    const { wrapper } = makeWrapper();
    const { result } = renderHook(() => useMediaDetail('missing'), { wrapper });

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(result.current.error).toMatchObject({ kind: 'notFound' });
  });
});
