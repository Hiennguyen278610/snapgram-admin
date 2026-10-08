import { describe, it, expect } from 'vitest';
import { adminUserSchema, banUserSchema, getUserStatus, pageAdminUserSchema } from './user.schema';

const validUser = {
  id: '11111111-1111-4111-8111-111111111111',
  username: 'alice',
  email: 'alice@snapgram.dev',
  displayName: 'Alice Nguyen',
  avatarUrl: null,
  privateAccount: false,
  emailVerified: true,
  twoFaEnabled: false,
  banned: false,
  bannedAt: null,
  banReason: null,
  lastSeenAt: '2026-10-07T09:15:00Z',
  createdAt: '2026-10-01T09:15:00Z',
  role: 'ADMIN',
  roles: ['USER', 'ADMIN'],
};

describe('adminUserSchema', () => {
  it('accepts a full AdminUserResponse payload', () => {
    const parsed = adminUserSchema.safeParse(validUser);

    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.username).toBe('alice');
      expect(parsed.data.roles).toEqual(['USER', 'ADMIN']);
    }
  });

  it('accepts a payload with only the three always-present fields', () => {
    const parsed = adminUserSchema.safeParse({
      id: 'u-1',
      username: 'alice',
      email: 'alice@snapgram.dev',
    });

    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.roles).toEqual([]);
      expect(parsed.data.displayName).toBeUndefined();
    }
  });

  it('rejects a payload missing the id', () => {
    const incomplete: Record<string, unknown> = { ...validUser };
    delete incomplete.id;

    const parsed = adminUserSchema.safeParse(incomplete);

    expect(parsed.success).toBe(false);
    if (!parsed.success) {
      expect(parsed.error.issues.some((issue) => issue.path.includes('id'))).toBe(true);
    }
  });

  it('rejects a payload with the wrong type for a known field', () => {
    expect(adminUserSchema.safeParse({ ...validUser, banned: 'yes' }).success).toBe(false);
  });
});

describe('pageAdminUserSchema', () => {
  it('accepts a Spring Page payload and keeps the pagination metadata', () => {
    const parsed = pageAdminUserSchema.safeParse({
      content: [validUser],
      totalElements: 25,
      totalPages: 2,
      number: 0,
      size: 20,
      numberOfElements: 20,
      first: true,
      last: false,
      empty: false,
      sort: { sorted: false },
      pageable: { pageNumber: 0 },
    });

    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.totalElements).toBe(25);
      expect(parsed.data.totalPages).toBe(2);
      expect(parsed.data.content).toHaveLength(1);
      expect(parsed.data.first).toBe(true);
      expect(parsed.data.last).toBe(false);
    }
  });

  it('defaults every optional field for a bare {} payload', () => {
    const parsed = pageAdminUserSchema.safeParse({});

    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data).toMatchObject({
        content: [],
        totalElements: 0,
        totalPages: 0,
        number: 0,
        size: 0,
        numberOfElements: 0,
        first: true,
        last: true,
        empty: false,
      });
    }
  });

  it('rejects a payload whose content is not an array', () => {
    expect(pageAdminUserSchema.safeParse({ content: 'nope' }).success).toBe(false);
  });
});

describe('getUserStatus', () => {
  it('reports banned when the account is banned', () => {
    expect(getUserStatus({ banned: true, emailVerified: false })).toBe('banned');
  });

  it('reports pending when the e-mail is not verified yet', () => {
    expect(getUserStatus({ banned: false, emailVerified: false })).toBe('pending');
  });

  it('reports active for a verified, unbanned account', () => {
    expect(getUserStatus({ banned: false, emailVerified: true })).toBe('active');
  });

  it('reports active when the verification flag is absent', () => {
    expect(getUserStatus({})).toBe('active');
  });
});

describe('banUserSchema', () => {
  it('accepts a reason with content', () => {
    expect(banUserSchema.safeParse({ reason: 'Spam' }).success).toBe(true);
  });

  it('rejects an empty or whitespace-only reason (brief D3: stricter than api-docs)', () => {
    expect(banUserSchema.safeParse({ reason: '' }).success).toBe(false);
    expect(banUserSchema.safeParse({ reason: '   ' }).success).toBe(false);
  });

  it('rejects a reason longer than 255 characters', () => {
    expect(banUserSchema.safeParse({ reason: 'a'.repeat(256) }).success).toBe(false);
    expect(banUserSchema.safeParse({ reason: 'a'.repeat(255) }).success).toBe(true);
  });
});
