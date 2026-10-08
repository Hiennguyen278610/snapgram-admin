import { http, HttpResponse } from 'msw';

const USERS_URL = 'http://localhost:8080/api/auth/admin/users';

export interface MockUser {
  id: string;
  username: string;
  email: string;
  displayName: string;
  avatarUrl: string | null;
  privateAccount: boolean;
  emailVerified: boolean;
  twoFaEnabled: boolean;
  banned: boolean;
  bannedAt: string | null;
  banReason: string | null;
  lastSeenAt: string | null;
  createdAt: string;
  role: string;
  roles: string[];
}

const ROLES = ['USER', 'MODERATOR', 'ADMIN'] as const;
const BANNED_INDEXES = [3, 11, 19];
const TOTAL_USERS = 25;

function pad(index: number): string {
  return String(index).padStart(2, '0');
}

/**
 * Deterministic fixture user. `index` is 1-based (`user01` … `user25`).
 * A few entries intentionally have `avatarUrl: null` to exercise the avatar
 * fallback, and ~3 are banned to exercise the banned status + ban actions.
 */
export function makeUser(index: number): MockUser {
  const role = ROLES[(index - 1) % ROLES.length];
  const banned = BANNED_INDEXES.includes(index);
  const createdAt = new Date(Date.UTC(2026, 0, 1, 8, 0, 0) + index * 3_600_000).toISOString();
  const lastSeenAt = new Date(Date.UTC(2026, 1, 1, 8, 0, 0) + index * 1_800_000).toISOString();

  return {
    id: `00000000-0000-4000-8000-${String(index).padStart(12, '0')}`,
    username: `user${pad(index)}`,
    email: `user${pad(index)}@snapgram.dev`,
    displayName: `Snapgram User ${pad(index)}`,
    avatarUrl: index % 3 === 0 ? null : `https://cdn.snapgram.dev/avatars/user${pad(index)}.png`,
    privateAccount: index % 2 === 0,
    emailVerified: index % 5 !== 0,
    twoFaEnabled: index % 4 === 0,
    banned,
    bannedAt: banned ? '2026-09-30T10:00:00Z' : null,
    banReason: banned ? 'Repeated community guideline violations' : null,
    lastSeenAt,
    createdAt,
    role,
    roles: role === 'USER' ? ['USER'] : ['USER', role],
  };
}

/** Mutable module state so mutations are observable across queries. */
let users: MockUser[] = Array.from({ length: TOTAL_USERS }, (_, i) => makeUser(i + 1));

/** Restores the deterministic fixture set (used by tests between cases). */
export function resetUsers(): void {
  users = Array.from({ length: TOTAL_USERS }, (_, i) => makeUser(i + 1));
}

function byId(id: string): MockUser | undefined {
  return users.find((user) => user.id === id);
}

function matchesQuery(user: MockUser, q: string): boolean {
  const needle = q.toLowerCase();
  return user.username.toLowerCase().includes(needle) || user.email.toLowerCase().includes(needle);
}

export const usersHandlers = [
  http.get(USERS_URL, ({ request }) => {
    const searchParams = new URL(request.url).searchParams;
    const page = Number(searchParams.get('page') ?? 0);
    const size = Number(searchParams.get('size') ?? 20);
    const q = searchParams.get('q')?.trim() ?? '';

    const filtered = q ? users.filter((user) => matchesQuery(user, q)) : users;
    const totalElements = filtered.length;
    const totalPages = size > 0 ? Math.ceil(totalElements / size) : 0;
    const start = page * size;
    const content = filtered.slice(start, start + size);

    return HttpResponse.json({
      content,
      totalElements,
      totalPages,
      number: page,
      size,
      numberOfElements: content.length,
      first: page === 0,
      last: page >= totalPages - 1,
      empty: content.length === 0,
    });
  }),

  http.get(`${USERS_URL}/:id`, ({ params }) => {
    const user = byId(String(params.id));
    if (!user) {
      return HttpResponse.json(
        { status: 404, error: 'Not Found', message: 'User not found' },
        { status: 404 }
      );
    }
    return HttpResponse.json(user);
  }),

  http.post(`${USERS_URL}/:id/ban`, async ({ params, request }) => {
    const user = byId(String(params.id));
    if (!user) {
      return HttpResponse.json(
        { status: 404, error: 'Not Found', message: 'User not found' },
        { status: 404 }
      );
    }

    const body = (await request.json()) as { reason?: string };
    user.banned = true;
    user.bannedAt = new Date().toISOString();
    user.banReason = body.reason ?? '';

    return HttpResponse.json({ ...user });
  }),

  http.post(`${USERS_URL}/:id/unban`, ({ params }) => {
    const user = byId(String(params.id));
    if (!user) {
      return HttpResponse.json(
        { status: 404, error: 'Not Found', message: 'User not found' },
        { status: 404 }
      );
    }

    user.banned = false;
    user.bannedAt = null;
    user.banReason = null;

    return HttpResponse.json({ ...user });
  }),

  http.post(`${USERS_URL}/:id/roles`, async ({ params, request }) => {
    const user = byId(String(params.id));
    if (!user) {
      return HttpResponse.json(
        { status: 404, error: 'Not Found', message: 'User not found' },
        { status: 404 }
      );
    }

    const body = (await request.json()) as { role?: string };
    const role = body.role ?? '';
    if (role && !user.roles.includes(role)) {
      user.roles = [...user.roles, role];
    }

    return HttpResponse.json({ ...user });
  }),

  http.delete(`${USERS_URL}/:id/roles/:role`, ({ params }) => {
    const user = byId(String(params.id));
    if (!user) {
      return HttpResponse.json(
        { status: 404, error: 'Not Found', message: 'User not found' },
        { status: 404 }
      );
    }

    const role = String(params.role);
    user.roles = user.roles.filter((current) => current !== role);

    return HttpResponse.json({ ...user });
  }),
];
