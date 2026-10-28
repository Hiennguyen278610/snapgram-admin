import { describe, it, expect, vi, beforeEach } from 'vitest';
import { act, renderHook, waitFor } from '@testing-library/react';
import { QueryClientProvider } from '@tanstack/react-query';
import { ReactNode } from 'react';
import { makeQueryClient } from '@/test-utils/render';
import type { PresignedUrlResponse } from '../schemas/media.schema';
import { requestPresignedUrl } from '../services/media.service';
import { useRequestPresignedUrl } from './use-request-presigned-url';

vi.mock('../services/media.service', () => ({ requestPresignedUrl: vi.fn() }));

const mockedRequestPresignedUrl = vi.mocked(requestPresignedUrl);

const response: PresignedUrlResponse = {
  mediaId: 'm-1',
  uploadUrl: 'http://localhost:9000/snapgram-media/m-1.mp4',
  fileUrl: 'http://localhost:9000/snapgram-media/m-1.mp4',
  expiresInSeconds: 900,
};

function makeWrapper() {
  const queryClient = makeQueryClient();
  function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  }
  return Wrapper;
}

describe('useRequestPresignedUrl', () => {
  beforeEach(() => {
    mockedRequestPresignedUrl.mockReset();
  });

  it('starts idle', () => {
    const { result } = renderHook(() => useRequestPresignedUrl(), { wrapper: makeWrapper() });

    expect(result.current.isIdle).toBe(true);
  });

  it('sends the exact presigned payload', async () => {
    mockedRequestPresignedUrl.mockResolvedValue(response);
    const { result } = renderHook(() => useRequestPresignedUrl(), { wrapper: makeWrapper() });

    await act(async () => {
      await result.current.mutateAsync({
        fileName: 'clip.mp4',
        mimeType: 'video/mp4',
        sizeBytes: 8_000_000,
      });
    });

    expect(mockedRequestPresignedUrl).toHaveBeenCalledWith({
      fileName: 'clip.mp4',
      mimeType: 'video/mp4',
      sizeBytes: 8_000_000,
    });
  });

  it('exposes the error when requesting the URL fails', async () => {
    mockedRequestPresignedUrl.mockRejectedValue({
      httpStatus: 500,
      kind: 'server',
      message: 'nope',
    });
    const { result } = renderHook(() => useRequestPresignedUrl(), { wrapper: makeWrapper() });

    await act(async () => {
      await expect(
        result.current.mutateAsync({ fileName: 'a.jpg', mimeType: 'image/jpeg', sizeBytes: 1 })
      ).rejects.toMatchObject({ kind: 'server' });
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});
