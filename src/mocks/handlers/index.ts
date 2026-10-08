import type { RequestHandler } from 'msw';
import { authHandlers } from './auth.handlers';
import { dashboardHandlers } from './dashboard.handlers';
import { usersHandlers } from './users.handlers';

export const handlers: RequestHandler[] = [...authHandlers, ...dashboardHandlers, ...usersHandlers];
