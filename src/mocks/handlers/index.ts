import type { RequestHandler } from 'msw';
import { authHandlers } from './auth.handlers';

export const handlers: RequestHandler[] = [...authHandlers];
