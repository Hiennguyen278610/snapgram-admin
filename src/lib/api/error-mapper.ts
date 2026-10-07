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

export function getErrorMessageKey(error: ApiError): string {
  return KIND_TO_KEY[error.kind] ?? 'error.unknown';
}
