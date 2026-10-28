// @vitest-environment node
import { describe, it, expect } from 'vitest';
import { fetchCurrentUser, loginAdmin, logoutAdmin, verifyTwoFa } from './auth.service';
import type { ApiError } from '@/lib/api/types';

describe('auth.service', () => {
  it('loginAdmin returns user on valid credentials', async () => {
    const result = await loginAdmin({ email: 'admin@snapgram.dev', password: 'password' });
    expect(result.user?.email).toBe('admin@snapgram.dev');
  });

  it('loginAdmin allows MODERATOR user to log in', async () => {
    const result = await loginAdmin({ email: 'mod@snapgram.dev', password: 'password' });
    expect(result.user?.email).toBe('mod@snapgram.dev');
    expect(result.user?.role).toBe('MODERATOR');
  });

  it('loginAdmin throws forbidden for regular USER without staff role', async () => {
    await expect(
      loginAdmin({ email: 'user@snapgram.dev', password: 'password' })
    ).rejects.toMatchObject({
      kind: 'forbidden',
      httpStatus: 403,
    } satisfies Partial<ApiError>);
  });

  it('loginAdmin throws locked on locked account', async () => {
    await expect(loginAdmin({ email: 'x@y.com', password: 'locked' })).rejects.toMatchObject({
      kind: 'locked',
    } satisfies Partial<ApiError>);
  });

  it('verifyTwoFa returns user on valid code', async () => {
    const result = await verifyTwoFa({ tempToken: 'temp', code: '123456' });
    expect(result.user?.role).toBe('ADMIN');
  });

  it('fetchCurrentUser returns the current authenticated user', async () => {
    const user = await fetchCurrentUser();
    expect(user.username).toBe('admin');
    expect(user.email).toBe('admin@snapgram.com');
    expect(user.role).toBe('ADMIN');
  });

  it('logoutAdmin calls logout endpoint successfully', async () => {
    await expect(logoutAdmin()).resolves.toBeUndefined();
  });
});
