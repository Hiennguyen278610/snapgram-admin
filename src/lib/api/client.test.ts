// @vitest-environment node
import { describe, it, expect, afterEach } from 'vitest';
import { http, HttpResponse } from 'msw';
import { server } from '@/mocks/server';
import { apiClient } from './client';

describe('apiClient', () => {
  afterEach(() => server.resetHandlers());

  it('has withCredentials enabled', () => {
    expect(apiClient.defaults.withCredentials).toBe(true);
  });

  it('has baseURL from env', () => {
    expect(apiClient.defaults.baseURL).toBe('http://localhost:8080');
  });

  it('transforms axios error into ApiError', async () => {
    server.use(
      http.get('http://localhost:8080/test-404', () =>
        HttpResponse.json({ status: 404, error: 'Not Found', message: 'Missing' }, { status: 404 })
      )
    );

    await expect(apiClient.get('/test-404')).rejects.toMatchObject({
      httpStatus: 404,
      kind: 'notFound',
    });
  });

  it('transforms network error into network kind', async () => {
    server.use(
      http.get('http://localhost:8080/test-network', () => HttpResponse.error())
    );

    await expect(apiClient.get('/test-network')).rejects.toMatchObject({
      kind: 'network',
    });
  });
});
