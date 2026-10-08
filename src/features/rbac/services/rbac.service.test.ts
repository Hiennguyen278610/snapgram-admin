// @vitest-environment node
import { describe, it, expect, vi, afterEach } from 'vitest';
import { http, HttpResponse } from 'msw';
import { server } from '@/mocks/server';
import type { ApiError } from '@/lib/api/types';
import { resetRbac } from '@/mocks/handlers/rbac.handlers';
import {
  PERMISSIONS_ENDPOINT,
  ROLES_ENDPOINT,
  createRole,
  deleteRole,
  fetchPermissions,
  fetchRoleDetail,
  fetchRoles,
  setRolePermissions,
  updateRole,
} from './rbac.service';

const ROLES_URL = 'http://localhost:8080/api/auth/admin/roles';
const PERMISSIONS_URL = 'http://localhost:8080/api/auth/admin/permissions';

const ADMIN_ID = 'd0bbcbce-aa30-45c6-9615-fdb15cd34864';
const MODERATOR_ID = 'ff55a458-0b8c-4800-9687-4ec7572ba1b2';
const USER_ID = '903febdd-d549-4b93-bf9a-836a34d422b0';
const COMMENT_DELETE_ID = '4e75686a-75bf-4844-abe2-e96093de9b46';

describe('rbac.service', () => {
  afterEach(() => {
    resetRbac();
    vi.restoreAllMocks();
  });

  it('exposes the admin rbac endpoint constants', () => {
    expect(ROLES_ENDPOINT).toBe('/api/auth/admin/roles');
    expect(PERMISSIONS_ENDPOINT).toBe('/api/auth/admin/permissions');
  });

  it('returns the flat array of four roles with their live system flags', async () => {
    const roles = await fetchRoles();

    expect(Array.isArray(roles)).toBe(true);
    expect(roles.map((role) => role.name)).toEqual(['ADMIN', 'MODERATOR', 'SUPPORT', 'USER']);
    expect(roles.map((role) => role.system)).toEqual([true, false, false, true]);
    expect(roles.map((role) => role.permissions.length)).toEqual([17, 9, 5, 0]);
    expect(roles[0].userCount).toBe(1);
  });

  it('fetches a single role with its embedded permission objects', async () => {
    const role = await fetchRoleDetail(MODERATOR_ID);

    expect(role.name).toBe('MODERATOR');
    expect(role.permissions).toHaveLength(9);
    expect(role.permissions[0]).toHaveProperty('id');
    expect(role.permissions[0]).toHaveProperty('name');
  });

  it('surfaces a 404 ApiError for an unknown role id', async () => {
    await expect(fetchRoleDetail('00000000-0000-4000-8000-999999999999')).rejects.toMatchObject({
      httpStatus: 404,
      kind: 'notFound',
    } satisfies Partial<ApiError>);
  });

  it('returns the permissions as a category map (record), not an array', async () => {
    const permissions = await fetchPermissions();

    expect(Array.isArray(permissions)).toBe(false);
    expect(Object.keys(permissions)).toEqual([
      'CONTENT_MODERATION',
      'REPORT_MANAGEMENT',
      'SUPPORT',
      'SYSTEM',
      'USER_MANAGEMENT',
    ]);
    const total = Object.values(permissions).reduce((sum, list) => sum + list.length, 0);
    expect(total).toBe(17);
  });

  it('creates a custom role and defaults permissionIds to an empty list', async () => {
    const created = await createRole({ name: 'SUPPORT_LEAD', description: 'Leads support' });

    expect(created.name).toBe('SUPPORT_LEAD');
    expect(created.system).toBe(false);
    expect(created.userCount).toBe(0);
    expect(created.permissions).toEqual([]);

    const roles = await fetchRoles();
    expect(roles.map((role) => role.name)).toContain('SUPPORT_LEAD');
  });

  it('creates a role with the provided permissionIds', async () => {
    const created = await createRole({
      name: 'REPORT_READER',
      permissionIds: [COMMENT_DELETE_ID],
    });

    expect(created.permissions.map((permission) => permission.name)).toEqual(['COMMENT:DELETE']);
  });

  it('rejects a duplicate role name with a 409 conflict', async () => {
    await expect(createRole({ name: 'ADMIN' })).rejects.toMatchObject({
      httpStatus: 409,
      kind: 'conflict',
    } satisfies Partial<ApiError>);
  });

  it('rejects a blank role name with a 400', async () => {
    await expect(createRole({ name: '' })).rejects.toMatchObject({
      httpStatus: 400,
    } satisfies Partial<ApiError>);
  });

  it('updates a custom role and persists the change', async () => {
    const updated = await updateRole(MODERATOR_ID, {
      name: 'MODERATOR_PLUS',
      description: 'Extended moderation',
    });

    expect(updated.name).toBe('MODERATOR_PLUS');
    expect(updated.description).toBe('Extended moderation');

    const refetched = await fetchRoleDetail(MODERATOR_ID);
    expect(refetched.name).toBe('MODERATOR_PLUS');
  });

  it('rejects a duplicate name on update with a 409', async () => {
    await expect(updateRole(MODERATOR_ID, { name: 'SUPPORT' })).rejects.toMatchObject({
      httpStatus: 409,
    } satisfies Partial<ApiError>);
  });

  it('rejects updating a system role with a 403 (backend guard)', async () => {
    await expect(updateRole(ADMIN_ID, { name: 'ADMIN_TWO' })).rejects.toMatchObject({
      httpStatus: 403,
      kind: 'forbidden',
    } satisfies Partial<ApiError>);
  });

  it('deletes a custom role and does NOT parse the empty 200 body', async () => {
    // `deleteRole` must resolve even though the response carries no JSON body —
    // a schema.parse here would throw "Invalid response shape".
    await expect(deleteRole('ff55a458-0b8c-4800-9687-4ec7572ba1b2')).resolves.toBeUndefined();

    await expect(fetchRoleDetail(MODERATOR_ID)).rejects.toMatchObject({ httpStatus: 404 });
    expect((await fetchRoles()).map((role) => role.name)).not.toContain('MODERATOR');
  });

  it('rejects deleting a system role with a 403', async () => {
    await expect(deleteRole(USER_ID)).rejects.toMatchObject({
      httpStatus: 403,
      kind: 'forbidden',
    } satisfies Partial<ApiError>);
  });

  it('rejects deleting an unknown role with a 404', async () => {
    await expect(deleteRole('00000000-0000-4000-8000-999999999999')).rejects.toMatchObject({
      httpStatus: 404,
    } satisfies Partial<ApiError>);
  });

  it('replaces the permissions of a role', async () => {
    const updated = await setRolePermissions(MODERATOR_ID, [COMMENT_DELETE_ID]);

    expect(updated.permissions).toHaveLength(1);
    expect(updated.permissions[0].id).toBe(COMMENT_DELETE_ID);

    const refetched = await fetchRoleDetail(MODERATOR_ID);
    expect(refetched.permissions).toHaveLength(1);
  });

  it('rejects a missing permissionIds payload with a 400', async () => {
    await expect(
      setRolePermissions(MODERATOR_ID, undefined as unknown as string[])
    ).rejects.toMatchObject({ httpStatus: 400 } satisfies Partial<ApiError>);
  });

  it('rejects setting permissions on an unknown role with a 404', async () => {
    await expect(
      setRolePermissions('00000000-0000-4000-8000-999999999999', [])
    ).rejects.toMatchObject({ httpStatus: 404 } satisfies Partial<ApiError>);
  });

  it('throws a normalized ApiError when the roles list shape is invalid', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    server.use(http.get(ROLES_URL, () => HttpResponse.json({ content: [] })));

    await expect(fetchRoles()).rejects.toMatchObject({
      httpStatus: 0,
      kind: 'server',
      message: 'Invalid response shape',
    } satisfies Partial<ApiError>);
    expect(warn).toHaveBeenCalledTimes(1);
  });

  it('throws a normalized ApiError when the role detail shape is invalid', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    server.use(http.get(`${ROLES_URL}/:roleId`, () => HttpResponse.json({ nope: true })));

    await expect(fetchRoleDetail(ADMIN_ID)).rejects.toMatchObject({
      message: 'Invalid response shape',
    } satisfies Partial<ApiError>);
    expect(warn).toHaveBeenCalledTimes(1);
  });

  it('throws a normalized ApiError when the permissions payload is a flat array', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    server.use(
      http.get(PERMISSIONS_URL, () =>
        HttpResponse.json([{ id: 'p-1', name: 'USER:READ', category: 'SYSTEM' }])
      )
    );

    await expect(fetchPermissions()).rejects.toMatchObject({
      message: 'Invalid response shape',
    } satisfies Partial<ApiError>);
    expect(warn).toHaveBeenCalledTimes(1);
  });

  it('throws a normalized ApiError when the create response shape is invalid', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    server.use(http.post(ROLES_URL, () => HttpResponse.json({ nope: true })));

    await expect(createRole({ name: 'SUPPORT_LEAD' })).rejects.toMatchObject({
      message: 'Invalid response shape',
    } satisfies Partial<ApiError>);
    expect(warn).toHaveBeenCalledTimes(1);
  });

  it('throws a normalized ApiError when the update response shape is invalid', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    server.use(http.put(`${ROLES_URL}/:roleId`, () => HttpResponse.json({ nope: true })));

    await expect(updateRole(MODERATOR_ID, { name: 'MODERATOR' })).rejects.toMatchObject({
      message: 'Invalid response shape',
    } satisfies Partial<ApiError>);
    expect(warn).toHaveBeenCalledTimes(1);
  });

  it('throws a normalized ApiError when the set-permissions response shape is invalid', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    server.use(
      http.put(`${ROLES_URL}/:roleId/permissions`, () => HttpResponse.json({ nope: true }))
    );

    await expect(setRolePermissions(MODERATOR_ID, [])).rejects.toMatchObject({
      message: 'Invalid response shape',
    } satisfies Partial<ApiError>);
    expect(warn).toHaveBeenCalledTimes(1);
  });
});
