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
  fieldErrors?: ApiFieldError[];
  retryAfterSeconds?: number;
  rawResponse?: unknown;
}
