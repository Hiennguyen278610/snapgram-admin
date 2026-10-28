import { describe, it, expect } from 'vitest';
import { currentUserSchema } from './current-user.schema';

describe('currentUserSchema', () => {
  it('parses valid user me response', () => {
    const raw = {
      id: '01dd12b3-c2fb-46cc-ac26-b237aee68510',
      username: 'admin',
      email: 'admin@snapgram.com',
      displayName: 'Snapgram Admin',
      role: 'ADMIN',
      avatarUrl: null,
      emailVerified: true,
      verified: false,
      createdAt: '2026-10-20T01:14:58Z',
    };

    const parsed = currentUserSchema.safeParse(raw);
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.username).toBe('admin');
      expect(parsed.data.displayName).toBe('Snapgram Admin');
      expect(parsed.data.role).toBe('ADMIN');
    }
  });

  it('defaults role to ADMIN if missing', () => {
    const raw = {
      id: '01dd12b3-c2fb-46cc-ac26-b237aee68510',
      username: 'admin',
      email: 'admin@snapgram.com',
    };

    const parsed = currentUserSchema.safeParse(raw);
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.role).toBe('ADMIN');
    }
  });
});
