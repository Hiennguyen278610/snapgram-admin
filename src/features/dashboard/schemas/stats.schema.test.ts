import { describe, it, expect } from 'vitest';
import { adminDashboardResponseSchema, adminUserResponseSchema } from './stats.schema';

const validResponse = {
  totalUsers: 1250,
  activeUsers: 1180,
  bannedUsers: 70,
  newUsersToday: 12,
  newUsersThisWeek: 87,
  emailVerifiedUsers: 1100,
  twoFaEnabledUsers: 240,
  recentUsers: [
    {
      id: '11111111-1111-4111-8111-111111111111',
      username: 'alice',
      email: 'alice@snapgram.dev',
      displayName: 'Alice Nguyen',
      avatarUrl: null,
      banned: false,
      createdAt: '2026-10-07T09:15:00Z',
    },
  ],
};

describe('adminDashboardResponseSchema', () => {
  it('accepts a valid payload and keeps its values', () => {
    const parsed = adminDashboardResponseSchema.safeParse(validResponse);

    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.totalUsers).toBe(1250);
      expect(parsed.data.twoFaEnabledUsers).toBe(240);
      expect(parsed.data.recentUsers).toHaveLength(1);
      expect(parsed.data.recentUsers[0].username).toBe('alice');
    }
  });

  it('fails when a required field is missing', () => {
    const incomplete: Record<string, unknown> = { ...validResponse };
    delete incomplete.totalUsers;

    const parsed = adminDashboardResponseSchema.safeParse(incomplete);

    expect(parsed.success).toBe(false);
    if (!parsed.success) {
      expect(parsed.error.issues.some((issue) => issue.path.includes('totalUsers'))).toBe(true);
    }
  });

  it('fails when a field has the wrong type', () => {
    const parsed = adminDashboardResponseSchema.safeParse({
      ...validResponse,
      totalUsers: 'many',
    });

    expect(parsed.success).toBe(false);
  });

  it('defaults recentUsers to an empty array when it is undefined', () => {
    const parsed = adminDashboardResponseSchema.safeParse({
      ...validResponse,
      recentUsers: undefined,
    });

    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.recentUsers).toEqual([]);
    }
  });
});

describe('adminUserResponseSchema', () => {
  it('accepts a user without the optional relations fields', () => {
    const parsed = adminUserResponseSchema.safeParse({
      id: 'u-1',
      username: 'alice',
      email: 'alice@snapgram.dev',
    });

    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.displayName).toBeUndefined();
    }
  });
});
