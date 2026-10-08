import { describe, it, expect, vi, beforeEach } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { QueryClientProvider } from '@tanstack/react-query';
import { ReactNode } from 'react';
import { makeQueryClient } from '@/test-utils/render';
import type { Media } from '../schemas/media.schema';
import { confirmPresignedUpload } from '../services/media.service';
import { useConfirmUpload } from './use-confirm-upload';

vi.mock('../services/media.service', () => ({ confirmPresignedUpload: vi.fn() }));

const mockedConfirmPresignedUpload = vi.mocked(confirmPresignedUpload);

const media: Media = {
  id: 'm-1',
  ownerId: 'u-1',
  url: 'http://localhost:9000/x.jpg',
  thumbnailUrl: null,
  mimeType: 'image/jpeg',
  sizeBytes: 10,
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

describe('useConfirmUpload', () => {
  beforeEach(() => {
    mockedConfirmPresignedUpload.mockReset();
  });

  it('confirms the upload for the given media id', async () => {
    mockedConfirmPresignedUpload.mockResolvedValue(media);
    const { wrapper } = makeWrapper();
    const { result } = renderHook(() => useConfirmUpload(), { wrapper });

    let response;
    await act(async () => {
      response = await result.current.mutateAsync('m-1');
    });

    expect(mockedConfirmPresignedUpload).toHaveBeenCalledWith('m-1');
    expect(response).toMatchObject({ id: 'm-1', status: 'READY' });
  });

  it('invalidates the media lists and the affected detail (conventions §6)', async () => {
    mockedConfirmPresignedUpload.mockResolvedValue(media);
    const { wrapper, queryClient } = makeWrapper();
    const invalidate = vi.spyOn(queryClient, 'invalidateQueries');
    const { result } = renderHook(() => useConfirmUpload(), { wrapper });

    await act(async () => {
      await result.current.mutateAsync('m-1');
    });

    const invalidatedKeys = invalidate.mock.calls.map(([arg]) => arg?.queryKey);
    expect(invalidatedKeys).toContainEqual(['admin', 'media', 'list']);
    expect(invalidatedKeys).toContainEqual(['admin', 'media', 'detail', 'm-1']);
  });

  it('exposes the error when the confirm call fails', async () => {
    mockedConfirmPresignedUpload.mockRejectedValue({
      httpStatus: 404,
      kind: 'notFound',
      message: 'nope',
    });
    const { wrapper } = makeWrapper();
    const { result } = renderHook(() => useConfirmUpload(), { wrapper });

    await act(async () => {
      await expect(result.current.mutateAsync('missing')).rejects.toMatchObject({
        kind: 'notFound',
      });
    });

    expect(result.current.isError).toBe(true);
  });
});
