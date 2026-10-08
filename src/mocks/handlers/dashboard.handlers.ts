import { http, HttpResponse } from 'msw';

const DASHBOARD_STATS_URL = 'http://localhost:8080/api/auth/admin/dashboard/stats';

const recentUsers = [
  {
    id: '11111111-1111-4111-8111-111111111111',
    username: 'alice',
    email: 'alice@snapgram.dev',
    displayName: 'Alice Nguyen',
    avatarUrl: null,
    banned: false,
    createdAt: '2026-10-07T09:15:00Z',
  },
  {
    id: '22222222-2222-4222-8222-222222222222',
    username: 'bob',
    email: 'bob@snapgram.dev',
    displayName: 'Bob Tran',
    avatarUrl: null,
    banned: false,
    createdAt: '2026-10-07T08:40:00Z',
  },
  {
    id: '33333333-3333-4333-8333-333333333333',
    username: 'carol',
    email: 'carol@snapgram.dev',
    displayName: 'Carol Le',
    avatarUrl: null,
    banned: false,
    createdAt: '2026-10-06T21:05:00Z',
  },
  {
    id: '44444444-4444-4444-8444-444444444444',
    username: 'dave',
    email: 'dave@snapgram.dev',
    displayName: 'Dave Pham',
    avatarUrl: null,
    banned: false,
    createdAt: '2026-10-06T17:30:00Z',
  },
  {
    id: '55555555-5555-4555-8555-555555555555',
    username: 'erin',
    email: 'erin@snapgram.dev',
    displayName: 'Erin Vo',
    avatarUrl: null,
    banned: false,
    createdAt: '2026-10-06T11:00:00Z',
  },
];

export const dashboardHandlers = [
  http.get(DASHBOARD_STATS_URL, () =>
    HttpResponse.json({
      totalUsers: 1250,
      activeUsers: 1180,
      bannedUsers: 70,
      newUsersToday: 12,
      newUsersThisWeek: 87,
      emailVerifiedUsers: 1100,
      twoFaEnabledUsers: 240,
      recentUsers,
    })
  ),
];
