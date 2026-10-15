import { describe, it, expect } from 'vitest';
import { AxiosError, AxiosHeaders } from 'axios';
import { parseApiError } from './error-parser';

function makeAxiosError(status: number, data: unknown, headers: Record<string, string> = {}) {
  const error = new AxiosError('Request failed');
  error.response = {
    status,
    statusText: '',
    data,
    headers: new AxiosHeaders(headers),
    config: { headers: new AxiosHeaders() },
  } as never;
  return error;
}

describe('parseApiError', () => {
  it('returns network for no response', () => {
    const result = parseApiError(new AxiosError('Network Error'));
    expect(result.kind).toBe('network');
    expect(result.httpStatus).toBe(0);
  });

  it('classifies 400 with errors[] as validation', () => {
    const err = makeAxiosError(400, {
      status: 400,
      error: 'Validation Failed',
      message: 'Validation failed',
      errors: [{ field: 'email', message: 'Required' }],
    });
    const result = parseApiError(err);
    expect(result.kind).toBe('validation');
    expect(result.fieldErrors).toEqual([{ field: 'email', message: 'Required' }]);
  });

  it('classifies 401 with "locked" message as locked + retryAfter 900', () => {
    const err = makeAxiosError(401, {
      status: 401,
      error: 'Unauthorized',
      message: 'Account is locked',
    });
    const result = parseApiError(err);
    expect(result.kind).toBe('locked');
    expect(result.retryAfterSeconds).toBe(900);
  });

  it('classifies 401 without lock keyword as auth', () => {
    const err = makeAxiosError(401, {
      status: 401,
      error: 'Unauthorized',
      message: 'Invalid email or password',
    });
    const result = parseApiError(err);
    expect(result.kind).toBe('auth');
  });

  it('handles Shape B (Gateway) with 429 + X-Rate-Limit-Reset', () => {
    const future = Math.floor(Date.now() / 1000) + 30;
    const err = makeAxiosError(
      429,
      { error: 'Rate limit exceeded' },
      {
        'x-rate-limit-reset': String(future),
      }
    );
    const result = parseApiError(err);
    expect(result.kind).toBe('rateLimit');
    expect(result.retryAfterSeconds).toBeGreaterThanOrEqual(29);
    expect(result.retryAfterSeconds).toBeLessThanOrEqual(31);
  });

  it('respects Retry-After header over X-Rate-Limit-Reset', () => {
    const err = makeAxiosError(
      429,
      { error: 'Rate limit' },
      {
        'retry-after': '60',
        'x-rate-limit-reset': String(Math.floor(Date.now() / 1000) + 30),
      }
    );
    const result = parseApiError(err);
    expect(result.retryAfterSeconds).toBe(60);
  });

  it('classifies 400 without errors[] as unknown', () => {
    const err = makeAxiosError(400, { status: 400, error: 'Bad Request', message: 'Nope' });
    expect(parseApiError(err).kind).toBe('unknown');
  });

  it.each([
    [403, 'forbidden'],
    [404, 'notFound'],
    [409, 'conflict'],
    [423, 'locked'],
    [500, 'server'],
    [502, 'server'],
    [503, 'server'],
    [504, 'server'],
  ])('classifies %d as %s', (status, expected) => {
    const err = makeAxiosError(status, { status, error: 'Err', message: 'Msg' });
    expect(parseApiError(err).kind).toBe(expected);
  });

  it('falls back to default message when Shape A has no message', () => {
    const err = makeAxiosError(500, { status: 500 });
    const result = parseApiError(err);
    expect(result.message).toBe('An unexpected error occurred');
  });

  it('handles unknown status code as unknown', () => {
    const err = makeAxiosError(418, { status: 418, error: 'Teapot', message: 'I am a teapot' });
    expect(parseApiError(err).kind).toBe('unknown');
  });

  it('uses error field as message when Shape A message missing', () => {
    const err = makeAxiosError(500, { status: 500, error: 'Server Error' });
    expect(parseApiError(err).message).toBe('Server Error');
  });

  it('extracts the backend error code when present', () => {
    const err = makeAxiosError(409, {
      status: 409,
      code: 'INVALID_STATUS_TRANSITION',
      error: 'Conflict',
      message: 'Dismissed report cannot be resolved',
    });
    expect(parseApiError(err).code).toBe('INVALID_STATUS_TRANSITION');
  });

  it('leaves code undefined when the body has none', () => {
    const err = makeAxiosError(500, { status: 500, error: 'Err', message: 'Msg' });
    expect(parseApiError(err).code).toBeUndefined();
  });
});
