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

  it('maps INVALID_STATUS_TRANSITION to the conflict transition key', () => {
    const err: ApiError = {
      httpStatus: 409,
      kind: 'conflict',
      code: 'INVALID_STATUS_TRANSITION',
      message: 'Dismissed report cannot be resolved',
    };
    expect(getErrorMessageKey(err)).toBe('error.conflict.invalidStatusTransition');
  });

  it('keeps the kind-based conflict key for a duplicate-resource code', () => {
    const err: ApiError = {
      httpStatus: 409,
      kind: 'conflict',
      code: 'DUPLICATE_RESOURCE',
      message: 'Already exists',
    };
    expect(getErrorMessageKey(err)).toBe('error.conflict.duplicateData');
  });

  it('maps a BAD_REQUEST enum mismatch to the invalidEnum key', () => {
    const err: ApiError = {
      httpStatus: 400,
      kind: 'unknown',
      code: 'BAD_REQUEST',
      message:
        "Invalid value 'user' for parameter 'targetType'. Allowed values: [POST, COMMENT, USER]",
    };
    expect(getErrorMessageKey(err)).toBe('error.validation.invalidEnum');
  });

  it('keeps the kind-based key for a BAD_REQUEST without an enum mismatch', () => {
    const err: ApiError = {
      httpStatus: 400,
      kind: 'unknown',
      code: 'BAD_REQUEST',
      message: 'Malformed request',
    };
    expect(getErrorMessageKey(err)).toBe('error.unknown');
  });
});
