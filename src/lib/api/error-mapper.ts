import type { ApiError, ErrorKind } from './types';

const KIND_TO_KEY: Record<ErrorKind, string> = {
  validation: 'error.validation.invalidFields',
  auth: 'error.auth.invalidCredentials',
  locked: 'error.locked.accountLocked',
  forbidden: 'error.forbidden.accessDenied',
  notFound: 'error.notFound.resource',
  conflict: 'error.conflict.duplicateData',
  rateLimit: 'error.rateLimit.exceeded',
  server: 'error.server.internalError',
  network: 'error.network.disconnected',
  unknown: 'error.unknown',
};

/**
 * Backend `code` values that need a key more specific than their HTTP kind
 * (verified live 2026-10-16). Anything not listed keeps the kind-based key.
 */
const CODE_TO_KEY: Record<string, string> = {
  INVALID_STATUS_TRANSITION: 'error.conflict.invalidStatusTransition',
};

export function getErrorMessageKey(error: ApiError): string {
  const byCode = error.code ? CODE_TO_KEY[error.code] : undefined;
  if (byCode) return byCode;

  // Invalid query enum: Spring's MethodArgumentTypeMismatchException answers
  // `400 { code: 'BAD_REQUEST', message: "Invalid value 'x' for parameter 'y'.
  // Allowed values: [...]" }`.
  if (error.code === 'BAD_REQUEST' && /allowed values/i.test(error.message)) {
    return 'error.validation.invalidEnum';
  }

  return KIND_TO_KEY[error.kind] ?? 'error.unknown';
}
