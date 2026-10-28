import { describe, it, expect } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClientProvider } from '@tanstack/react-query';
import { http, HttpResponse } from 'msw';
import { ReactNode } from 'react';
import { server } from '@/mocks/server';
import { makeQueryClient } from '@/test-utils/render';
import { useAllServicesHealth } from './use-all-services-health';

function makeWrapper() {
  const queryClient = makeQueryClient();
  return {
    wrapper: ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    ),
  };
}

function forceTextError(service: string, status = 502) {
  server.use(http.get(`/api/admin/health/${service}`, () => new HttpResponse('down', { status })));
}

describe('useAllServicesHealth', () => {
  it('starts loading before the first results settle', () => {
    const { wrapper } = makeWrapper();
    const { result } = renderHook(() => useAllServicesHealth(), { wrapper });

    expect(result.current.isLoading).toBe(true);
    expect(result.current.isError).toBe(false);
  });

  it('returns one entry per configured service in registry order', async () => {
    const { wrapper } = makeWrapper();
    const { result } = renderHook(() => useAllServicesHealth(), { wrapper });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.services.map((service) => service.id)).toEqual([
      'gateway',
      'auth',
      'chatbot',
      'chat',
      'content',
      'media',
      'notification',
      'payment',
      'recommender',
    ]);
    expect(result.current.services.map((service) => service.labelKey)).toEqual([
      'health.services.gateway',
      'health.services.auth',
      'health.services.chatbot',
      'health.services.chat',
      'health.services.content',
      'health.services.media',
      'health.services.notification',
      'health.services.payment',
      'health.services.recommender',
    ]);
  });

  it('normalizes every status and exposes a last-checked timestamp', async () => {
    const { wrapper } = makeWrapper();
    const { result } = renderHook(() => useAllServicesHealth(), { wrapper });

    await waitFor(() =>
      expect(result.current.services.every((service) => service.status === 'UP')).toBe(true)
    );

    expect(result.current.isError).toBe(false);
    expect(result.current.lastChecked).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    expect(result.current.services.every((service) => service.lastChecked !== null)).toBe(true);
  });

  it('keeps the page in a healthy state when only one service is down', async () => {
    server.use(
      http.get('/api/admin/health/auth', () =>
        HttpResponse.json({ status: 'DOWN', error: 'refused' }, { status: 503 })
      )
    );

    const { wrapper } = makeWrapper();
    const { result } = renderHook(() => useAllServicesHealth(), { wrapper });

    await waitFor(() =>
      expect(result.current.services.find((service) => service.id === 'auth')?.status).toBe('DOWN')
    );

    expect(result.current.services.find((service) => service.id === 'gateway')?.status).toBe('UP');
    expect(result.current.isError).toBe(false);
  });

  it('maps OUT_OF_SERVICE to DOWN', async () => {
    server.use(
      http.get('/api/admin/health/media', () => HttpResponse.json({ status: 'OUT_OF_SERVICE' }))
    );

    const { wrapper } = makeWrapper();
    const { result } = renderHook(() => useAllServicesHealth(), { wrapper });

    await waitFor(() =>
      expect(result.current.services.find((service) => service.id === 'media')?.status).toBe('DOWN')
    );
  });

  it('reports a page-level error only when every check fails', async () => {
    forceTextError('gateway');
    forceTextError('auth');
    forceTextError('chatbot');
    forceTextError('chat');
    forceTextError('content');
    forceTextError('media');
    forceTextError('notification');
    forceTextError('payment');
    forceTextError('recommender');

    const { wrapper } = makeWrapper();
    const { result } = renderHook(() => useAllServicesHealth(), { wrapper });

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(result.current.isLoading).toBe(false);
    expect(result.current.services.every((service) => service.isError)).toBe(true);
    expect(result.current.services[0].error).toBeInstanceOf(Error);
  });

  it('exposes refetch for the page and for each card', async () => {
    const { wrapper } = makeWrapper();
    const { result } = renderHook(() => useAllServicesHealth(), { wrapper });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(() => {
      result.current.refetch();
      result.current.services.forEach((service) => service.refetch());
    }).not.toThrow();
  });
});
