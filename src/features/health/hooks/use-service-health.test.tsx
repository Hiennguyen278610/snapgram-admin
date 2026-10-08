import { describe, it, expect } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClientProvider } from '@tanstack/react-query';
import { http, HttpResponse } from 'msw';
import { ReactNode } from 'react';
import { server } from '@/mocks/server';
import { makeQueryClient } from '@/test-utils/render';
import { fetchServiceHealth, useServiceHealth } from './use-service-health';

function makeWrapper() {
  const queryClient = makeQueryClient();
  return {
    queryClient,
    wrapper: ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    ),
  };
}

describe('useServiceHealth', () => {
  it('starts pending', () => {
    const { wrapper } = makeWrapper();
    const { result } = renderHook(() => useServiceHealth('gateway'), { wrapper });

    expect(result.current.isPending).toBe(true);
  });

  it('resolves the proxy status payload', async () => {
    const { wrapper } = makeWrapper();
    const { result } = renderHook(() => useServiceHealth('gateway'), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    // Zod strips unknown keys, so only the actuator `status` survives.
    expect(result.current.data).toEqual({ status: 'UP' });
  });

  it('caches under the hierarchical health service key', async () => {
    const { wrapper, queryClient } = makeWrapper();
    renderHook(() => useServiceHealth('auth'), { wrapper });

    await waitFor(() => expect(queryClient.getQueryCache().getAll()).toHaveLength(1));

    expect(queryClient.getQueryCache().getAll()[0].queryKey).toEqual(['health', 'service', 'auth']);
  });

  it('treats a proxied 503 DOWN as data, not an error', async () => {
    server.use(
      http.get('/api/health/content', () =>
        HttpResponse.json({ status: 'DOWN', error: 'connect ECONNREFUSED' }, { status: 503 })
      )
    );

    const { wrapper } = makeWrapper();
    const { result } = renderHook(() => useServiceHealth('content'), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toEqual({ status: 'DOWN', error: 'connect ECONNREFUSED' });
    expect(result.current.isError).toBe(false);
  });

  it('surfaces an error when the payload is not a health status', async () => {
    server.use(http.get('/api/health/media', () => new HttpResponse('not json', { status: 502 })));

    const { wrapper } = makeWrapper();
    const { result } = renderHook(() => useServiceHealth('media'), { wrapper });

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(result.current.error).toBeInstanceOf(Error);
  });
});

describe('fetchServiceHealth', () => {
  it('throws for an unrecognized payload', async () => {
    server.use(http.get('/api/health/gateway', () => HttpResponse.json({ ok: true })));

    await expect(fetchServiceHealth('gateway')).rejects.toThrow(
      'Invalid health response for gateway'
    );
  });
});
