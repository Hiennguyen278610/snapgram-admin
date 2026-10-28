import axios from 'axios';
import { parseApiError } from './error-parser';

// In tests or when explicit NEXT_PUBLIC_API_URL is provided, use that.
// In browser without NEXT_PUBLIC_API_URL, use '' (same-origin via Next.js rewrites, D1).
// In SSR without NEXT_PUBLIC_API_URL, use GATEWAY_URL or fallback to http://localhost:8080.
const baseURL =
  process.env.NEXT_PUBLIC_API_URL ??
  (process.env.NODE_ENV === 'test'
    ? 'http://localhost:8080'
    : typeof window === 'undefined'
      ? (process.env.GATEWAY_URL ?? 'http://localhost:8080')
      : '');

export const apiClient = axios.create({
  baseURL,
  withCredentials: true,
  timeout: 30_000,
  headers: {
    'Content-Type': 'application/json',
    'X-Requested-With': 'XMLHttpRequest',
  },
});

// Response interceptor: normalize every failure into an ApiError
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const apiError = parseApiError(error);

    // 401: auth expired.
    return Promise.reject(apiError);
  }
);
