// @vitest-environment node
import { describe, it, expect, vi, afterEach } from 'vitest';
import { http, HttpResponse } from 'msw';
import { server } from '@/mocks/server';
import type { ApiError } from '@/lib/api/types';
import { resetUsers } from '@/mocks/handlers/users.handlers';
import {
  USERS_ENDPOINT,
  assignRole,
  banUser,
  fetchUser,
  fetchUsers,
  removeRole,
  unbanUser,
} from './users.service';

const USERS_URL = 'http://localhost:8080/api/auth/admin/users';
const FIRST_USER_ID = '00000000-0000-4000-8000-000000000001';

describe('users.service', () => {
  afterEach(() => {
    resetUsers();
    vi.restoreAllMocks();
  });

  it('exposes the admin users endpoint constant', () => {
    expect(USERS_ENDPOINT).toBe('/api/auth/admin/users');
  });

  it('returns the first page with 20 of the 25 fixture users', async () => {
    const page = await fetchUsers();

    expect(page.content).toHaveLength(20);
    expect(page.totalElements).toBe(25);
    expect(page.totalPages).toBe(2);
    expect(page.number).toBe(0);
    expect(page.size).toBe(20);
    expect(page.first).toBe(true);
    expect(page.last).toBe(false);
    expect(page.content[0].username).toBe('user01');
  });

  it('returns the trailing 5 users on the second page', async () => {
    const page = await fetchUsers({ page: 1, size: 20 });

    expect(page.content).toHaveLength(5);
    expect(page.number).toBe(1);
    expect(page.last).toBe(true);
  });

  it('filters by the q parameter on username and email (brief D1)', async () => {
    const byUsername = await fetchUsers({ q: 'user07' });
    expect(byUsername.content).toHaveLength(1);
    expect(byUsername.content[0].username).toBe('user07');

    const byEmail = await fetchUsers({ q: 'USER07@SNAPGRAM.DEV' });
    expect(byEmail.content).toHaveLength(1);
    expect(byEmail.content[0].email).toBe('user07@snapgram.dev');
  });

  it('returns an empty page when q matches nothing', async () => {
    const page = await fetchUsers({ q: 'zzz-no-match' });

    expect(page.content).toEqual([]);
    expect(page.totalElements).toBe(0);
    expect(page.empty).toBe(true);
  });

  it('omits the q param entirely when no keyword is provided', async () => {
    let receivedUrl = '';
    server.use(
      http.get(USERS_URL, ({ request }) => {
        receivedUrl = request.url;
        return HttpResponse.json({ content: [] });
      })
    );

    await fetchUsers({ page: 0, size: 20 });

    expect(receivedUrl).not.toContain('q=');
    expect(receivedUrl).toContain('page=0');
    expect(receivedUrl).toContain('size=20');
  });

  it('throws a normalized server ApiError when the list shape is invalid', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    server.use(http.get(USERS_URL, () => HttpResponse.json({ content: 'nope' })));

    await expect(fetchUsers()).rejects.toMatchObject({
      httpStatus: 0,
      kind: 'server',
      message: 'Invalid response shape',
    } satisfies Partial<ApiError>);

    expect(warn).toHaveBeenCalledTimes(1);
  });

  it('fetches a single user by id', async () => {
    const user = await fetchUser(FIRST_USER_ID);

    expect(user.username).toBe('user01');
    expect(user.role).toBe('USER');
  });

  it('surfaces a 404 ApiError for an unknown user id', async () => {
    await expect(fetchUser('00000000-0000-4000-8000-999999999999')).rejects.toMatchObject({
      httpStatus: 404,
      kind: 'notFound',
    } satisfies Partial<ApiError>);
  });

  it('throws a normalized ApiError when the detail shape is invalid', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    server.use(http.get(`${USERS_URL}/:id`, () => HttpResponse.json({ nope: true })));

    await expect(fetchUser(FIRST_USER_ID)).rejects.toMatchObject({
      httpStatus: 0,
      kind: 'server',
      message: 'Invalid response shape',
    } satisfies Partial<ApiError>);

    expect(warn).toHaveBeenCalledTimes(1);
  });

  it('bans a user and persists the reason', async () => {
    const banned = await banUser(FIRST_USER_ID, 'Spam');

    expect(banned.banned).toBe(true);
    expect(banned.banReason).toBe('Spam');
    expect(banned.bannedAt).toBeTruthy();

    const refetched = await fetchUser(FIRST_USER_ID);
    expect(refetched.banned).toBe(true);
  });

  it('throws a normalized ApiError when the ban response shape is invalid', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    server.use(http.post(`${USERS_URL}/:id/ban`, () => HttpResponse.json({ nope: true })));

    await expect(banUser(FIRST_USER_ID, 'Spam')).rejects.toMatchObject({
      message: 'Invalid response shape',
    } satisfies Partial<ApiError>);

    expect(warn).toHaveBeenCalledTimes(1);
  });

  it('unbans a previously banned user and clears the ban metadata', async () => {
    const bannedId = '00000000-0000-4000-8000-000000000003';
    expect((await fetchUser(bannedId)).banned).toBe(true);

    const unbanned = await unbanUser(bannedId);

    expect(unbanned.banned).toBe(false);
    expect(unbanned.bannedAt).toBeNull();
    expect(unbanned.banReason).toBeNull();
  });

  it('throws a normalized ApiError when the unban response shape is invalid', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    server.use(http.post(`${USERS_URL}/:id/unban`, () => HttpResponse.json({ nope: true })));

    await expect(unbanUser(FIRST_USER_ID)).rejects.toMatchObject({
      message: 'Invalid response shape',
    } satisfies Partial<ApiError>);

    expect(warn).toHaveBeenCalledTimes(1);
  });

  it('assigns a role without duplicating an existing one', async () => {
    const assigned = await assignRole(FIRST_USER_ID, 'MODERATOR');
    expect(assigned.roles).toEqual(['USER', 'MODERATOR']);

    const again = await assignRole(FIRST_USER_ID, 'MODERATOR');
    expect(again.roles).toEqual(['USER', 'MODERATOR']);
  });

  it('throws a normalized ApiError when the assign-role response shape is invalid', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    server.use(http.post(`${USERS_URL}/:id/roles`, () => HttpResponse.json({ nope: true })));

    await expect(assignRole(FIRST_USER_ID, 'MODERATOR')).rejects.toMatchObject({
      message: 'Invalid response shape',
    } satisfies Partial<ApiError>);

    expect(warn).toHaveBeenCalledTimes(1);
  });

  it('removes a role from the user', async () => {
    const removed = await removeRole(FIRST_USER_ID, 'USER');

    expect(removed.roles).toEqual([]);
    const refetched = await fetchUser(FIRST_USER_ID);
    expect(refetched.roles).toEqual([]);
  });

  it('throws a normalized ApiError when the remove-role response shape is invalid', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    server.use(
      http.delete(`${USERS_URL}/:id/roles/:role`, () => HttpResponse.json({ nope: true }))
    );

    await expect(removeRole(FIRST_USER_ID, 'USER')).rejects.toMatchObject({
      message: 'Invalid response shape',
    } satisfies Partial<ApiError>);

    expect(warn).toHaveBeenCalledTimes(1);
  });

  it('resetUsers restores the default fixture set', async () => {
    await banUser(FIRST_USER_ID, 'Spam');
    resetUsers();

    expect((await fetchUser(FIRST_USER_ID)).banned).toBe(false);
  });
});
