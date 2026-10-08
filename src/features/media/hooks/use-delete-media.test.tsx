import { describe, it, expect, vi, beforeEach } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { QueryClientProvider } from '@tanstack/react-query';
import { ReactNode } from 'react';
import { makeQueryClient } from '@/test-utils/render';
import { deleteMedia } from '../services/media.service';
import { useDeleteMedia } from './use-delete-media';

vi.mock('../services/media.service', () => ({ deleteMedia: vi.fn() }));

const mockedDeleteMedia = vi.mocked(deleteMedia);

function makeWrapper() {
  const queryClient = makeQueryClient();
  return {
    queryClient,
    wrapper: ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    ),
  };
}

describe('useDeleteMedia', () => {
  beforeEach(() => {
    mockedDeleteMedia.mockReset();
  });

  it('deletes the media by id', async () => {
    mockedDeleteMedia.mockResolvedValue(undefined);
    const { wrapper } = makeWrapper();
    const { result } = renderHook(() => useDeleteMedia(), { wrapper });

    await act(async () => {
      await result.current.mutateAsync('m-1');
    });

    expect(mockedDeleteMedia).toHaveBeenCalledWith('m-1');
  });

  it('invalidates the media lists and the deleted detail (conventions §6)', async () => {
    mockedDeleteMedia.mockResolvedValue(undefined);
    const { wrapper, queryClient } = makeWrapper();
    const invalidate = vi.spyOn(queryClient, 'invalidateQueries');
    const { result } = renderHook(() => useDeleteMedia(), { wrapper });

    await act(async () => {
      await result.current.mutateAsync('m-1');
    });

    const invalidatedKeys = invalidate.mock.calls.map(([arg]) => arg?.queryKey);
    expect(invalidatedKeys).toContainEqual(['admin', 'media', 'list']);
    expect(invalidatedKeys).toContainEqual(['admin', 'media', 'detail', 'm-1']);
  });

  it('exposes a notFound error when the file is already gone', async () => {
    mockedDeleteMedia.mockRejectedValue({ httpStatus: 404, kind: 'notFound', message: 'nope' });
    const { wrapper } = makeWrapper();
    const { result } = renderHook(() => useDeleteMedia(), { wrapper });

    await act(async () => {
      await expect(result.current.mutateAsync('missing')).rejects.toMatchObject({
        kind: 'notFound',
      });
    });

    expect(result.current.isError).toBe(true);
  });
});
