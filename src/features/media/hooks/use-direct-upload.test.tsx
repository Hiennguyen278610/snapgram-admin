import { describe, it, expect, vi, beforeEach } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { QueryClientProvider } from '@tanstack/react-query';
import { ReactNode } from 'react';
import { makeQueryClient } from '@/test-utils/render';
import type { Media } from '../schemas/media.schema';
import { directUpload } from '../services/media.service';
import { useDirectUpload } from './use-direct-upload';

vi.mock('../services/media.service', () => ({ directUpload: vi.fn() }));

const mockedDirectUpload = vi.mocked(directUpload);

const media: Media = {
  id: 'm-2',
  ownerId: 'u-1',
  url: 'http://localhost:9000/x.png',
  thumbnailUrl: null,
  mimeType: 'image/png',
  sizeBytes: 3,
  status: 'READY',
  width: null,
  height: null,
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

describe('useDirectUpload', () => {
  beforeEach(() => {
    mockedDirectUpload.mockReset();
  });

  it('uploads the file and returns the created media', async () => {
    mockedDirectUpload.mockResolvedValue(media);
    const { wrapper } = makeWrapper();
    const { result } = renderHook(() => useDirectUpload(), { wrapper });
    const file = { name: 'a.png', type: 'image/png' } as File;

    let response;
    await act(async () => {
      response = await result.current.mutateAsync(file);
    });

    expect(mockedDirectUpload).toHaveBeenCalledWith(file);
    expect(response).toMatchObject({ id: 'm-2' });
  });

  it('invalidates the media lists after a successful upload', async () => {
    mockedDirectUpload.mockResolvedValue(media);
    const { wrapper, queryClient } = makeWrapper();
    const invalidate = vi.spyOn(queryClient, 'invalidateQueries');
    const { result } = renderHook(() => useDirectUpload(), { wrapper });

    await act(async () => {
      await result.current.mutateAsync({ name: 'a.png', type: 'image/png' } as File);
    });

    const invalidatedKeys = invalidate.mock.calls.map(([arg]) => arg?.queryKey);
    expect(invalidatedKeys).toContainEqual(['admin', 'media', 'list']);
  });

  it('exposes the error when the upload fails', async () => {
    mockedDirectUpload.mockRejectedValue({ httpStatus: 500, kind: 'server', message: 'nope' });
    const { wrapper } = makeWrapper();
    const { result } = renderHook(() => useDirectUpload(), { wrapper });

    await act(async () => {
      await expect(
        result.current.mutateAsync({ name: 'a.png', type: 'image/png' } as File)
      ).rejects.toMatchObject({ kind: 'server' });
    });

    expect(result.current.isError).toBe(true);
  });
});
