import { describe, it, expect } from 'vitest';
import { getErrorMessageKey } from './error-mapper';
import type { ApiError, ErrorKind } from './types';

const KINDS: ErrorKind[] = [
  'validation',
  'auth',
  'locked',
  'forbidden',
  'notFound',
  'conflict',
  'rateLimit',
  'server',
  'network',
  'unknown',
];

describe('getErrorMessageKey', () => {
  it.each(KINDS)('maps kind "%s" to a valid i18n key', (kind) => {
    const err: ApiError = { httpStatus: 0, kind, message: '' };
    const key = getErrorMessageKey(err);
    expect(key).toMatch(/^error\./);
  });

  it('falls back to error.unknown for unknown kind', () => {
    const err = { httpStatus: 0, kind: 'unknown' as const, message: '' };
    expect(getErrorMessageKey(err)).toBe('error.unknown');
  });
});
