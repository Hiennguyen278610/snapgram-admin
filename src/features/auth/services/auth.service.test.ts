// @vitest-environment node
import { describe, it, expect } from 'vitest';
import { loginAdmin, verifyTwoFa } from './auth.service';
import type { ApiError } from '@/lib/api/types';

describe('auth.service', () => {
  it('loginAdmin returns user on valid credentials', async () => {
    const result = await loginAdmin({ email: 'admin@snapgram.dev', password: 'password' });
    expect(result.user?.email).toBe('admin@snapgram.dev');
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
});
