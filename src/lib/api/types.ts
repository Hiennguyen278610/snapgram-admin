export type ErrorKind =
  | 'validation'
  | 'auth'
  | 'forbidden'
  | 'notFound'
  | 'conflict'
  | 'locked'
  | 'rateLimit'
  | 'server'
  | 'network'
  | 'unknown';

export interface ApiFieldError {
  field: string;
  message: string;
}

export interface ApiError {
  httpStatus: number;
  kind: ErrorKind;
  message: string;
  /** Machine-readable code from the backend error body (e.g. `INVALID_STATUS_TRANSITION`). */
  code?: string;
  fieldErrors?: ApiFieldError[];
  retryAfterSeconds?: number;
  rawResponse?: unknown;
}
