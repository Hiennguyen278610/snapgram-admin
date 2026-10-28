import axios from 'axios';
import type { ApiError, ApiFieldError, ErrorKind } from './types';

export function parseApiError(error: unknown): ApiError {
  // 1. Network error
  if (!axios.isAxiosError(error) || !error.response) {
    return { httpStatus: 0, kind: 'network', message: 'Network connection failure or timeout' };
  }

  const { status, data, headers } = error.response;

  // 2. Retry-After header (2 standards)
  let retryAfterSeconds: number | undefined;
  const h = headers as Record<string, string | undefined>;
  if (h['retry-after']) {
    retryAfterSeconds = parseInt(h['retry-after'], 10);
  } else if (h['x-rate-limit-reset']) {
    const resetTime = parseInt(h['x-rate-limit-reset'], 10);
    retryAfterSeconds = Math.max(0, resetTime - Math.floor(Date.now() / 1000));
  }

  // 3. Extract code + message + fieldErrors (Shape A vs Shape B)
  let extractedMessage = 'An unexpected error occurred';
  let extractedCode: string | undefined;
  let fieldErrors: ApiFieldError[] | undefined;
  if (data && typeof data === 'object') {
    const d = data as Record<string, unknown>;
    if (typeof d.code === 'string' && d.code) {
      extractedCode = d.code;
    }
    if (typeof d.status === 'number') {
      extractedMessage =
        (typeof d.message === 'string' && d.message) ||
        (typeof d.error === 'string' && d.error) ||
        extractedMessage;
      if (Array.isArray(d.errors) && d.errors.length > 0) {
        fieldErrors = d.errors as ApiFieldError[];
      }
    } else if (typeof d.error === 'string') {
      extractedMessage = d.error;
    }
  }

  // 4. Classify kind
  let kind: ErrorKind = 'unknown';
  switch (status) {
    case 400:
      kind = fieldErrors ? 'validation' : 'unknown';
      break;
    case 401:
      if (/lock|attempt/i.test(extractedMessage)) {
        kind = 'locked';
        if (!retryAfterSeconds) retryAfterSeconds = 900;
      } else {
        kind = 'auth';
      }
      break;
    case 403:
      kind = 'forbidden';
      break;
    case 404:
      kind = 'notFound';
      break;
    case 409:
      kind = 'conflict';
      break;
    case 423:
      kind = 'locked';
      if (!retryAfterSeconds) retryAfterSeconds = 900;
      break;
    case 429:
      kind = 'rateLimit';
      if (!retryAfterSeconds) retryAfterSeconds = 60;
      break;
    case 500:
    case 502:
    case 503:
    case 504:
      kind = 'server';
      break;
    default:
      kind = 'unknown';
  }

  return {
    httpStatus: status,
    kind,
    message: extractedMessage,
    code: extractedCode,
    fieldErrors,
    retryAfterSeconds,
    rawResponse: data,
  };
}
