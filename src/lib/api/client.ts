import axios from 'axios';
import { parseApiError } from './error-parser';

const baseURL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8080';

export const apiClient = axios.create({
  baseURL,
  withCredentials: true,
  timeout: 30_000,
  headers: { 'Content-Type': 'application/json' },
});

// Response interceptor: normalize every failure into an ApiError
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const apiError = parseApiError(error);

    // 401: auth expired. Sprint 1.4 ONLY throws, it does NOT redirect
    // (route /admin/login does not exist yet - Sprint 2.1 adds the redirect).

    return Promise.reject(apiError);
  }
);
