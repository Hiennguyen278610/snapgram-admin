import { http, HttpResponse } from 'msw';

/**
 * Mock for the server-side health proxy (`/api/health/[service]`).
 *
 * MSW resolves the relative path against the jsdom origin
 * (`http://localhost:3000`) so hook tests exercise the exact client URL.
 */
export const healthHandlers = [
  http.get('/api/health/:service', ({ params }) =>
    HttpResponse.json({ status: 'UP', service: params.service })
  ),
];
