import { http, HttpResponse } from 'msw';

const RBAC_URL = 'http://localhost:8080/api/auth/admin';
const ROLES_URL = `${RBAC_URL}/roles`;
const PERMISSIONS_URL = `${RBAC_URL}/permissions`;

export interface MockPermission {
  id: string;
  name: string;
  category: string;
  description: string;
}

export interface MockRole {
  id: string;
  name: string;
  description: string;
  permissions: MockPermission[];
  userCount: number;
  createdAt: string;
  updatedAt: string;
  system: boolean;
}

const SEEDED_AT = '2026-10-07T11:01:08.486816Z';

/**
 * Seed mirrors the LIVE backend (`GET /api/auth/admin/permissions`,
 * 2026-10-08): five categories, 17 permissions, real ids and the fixed
 * Vietnamese descriptions stored in the backend DB.
 *
 * Permission ids are the primary key used by `PUT /roles/{id}/permissions`,
 * and roles carry the FULL permission objects (not ids) exactly like
 * `RoleDetailResponse`.
 */
export const PERMISSIONS_BY_CATEGORY: Record<string, MockPermission[]> = {
  CONTENT_MODERATION: [
    {
      id: '4e75686a-75bf-4844-abe2-e96093de9b46',
      name: 'COMMENT:DELETE',
      category: 'CONTENT_MODERATION',
      description: 'Xóa bình luận vi phạm',
    },
    {
      id: 'a0680559-a8c1-43ce-9207-964b82bae654',
      name: 'CONTENT:MODERATE',
      category: 'CONTENT_MODERATION',
      description: 'Truy cập trung tâm kiểm duyệt nội dung',
    },
    {
      id: 'a2a0adaa-20e0-4d24-956d-90da01a01922',
      name: 'POST:DELETE',
      category: 'CONTENT_MODERATION',
      description: 'Xóa bài viết vi phạm',
    },
    {
      id: '0812940c-0554-4567-b900-cfe9500e9ef6',
      name: 'STORY:DELETE',
      category: 'CONTENT_MODERATION',
      description: 'Xóa story vi phạm',
    },
  ],
  REPORT_MANAGEMENT: [
    {
      id: 'c011581c-307d-4756-ab07-66b05e6b1e4e',
      name: 'REPORT:DISMISS',
      category: 'REPORT_MANAGEMENT',
      description: 'Bác bỏ báo cáo vi phạm',
    },
    {
      id: 'a7caa09f-8647-40fb-9299-15ae69083cd3',
      name: 'REPORT:RESOLVE',
      category: 'REPORT_MANAGEMENT',
      description: 'Xử lý báo cáo vi phạm',
    },
    {
      id: '04eb5064-5509-45a1-9f29-48fc389ddc1e',
      name: 'REPORT:VIEW',
      category: 'REPORT_MANAGEMENT',
      description: 'Xem danh sách báo cáo vi phạm',
    },
  ],
  SUPPORT: [
    {
      id: 'ab2cdec1-1e6d-4ccd-8174-4b62b0debe44',
      name: 'SUPPORT:TICKET_MANAGE',
      category: 'SUPPORT',
      description: 'Quản lý và phản hồi ticket',
    },
    {
      id: '98d325f1-f34e-4302-9b1f-6594d792fc19',
      name: 'SUPPORT:TICKET_READ',
      category: 'SUPPORT',
      description: 'Xem ticket yêu cầu hỗ trợ',
    },
    {
      id: 'a4c13064-bf31-4f4b-8920-4a99eac3f4c1',
      name: 'SUPPORT:USER_ASSIST',
      category: 'SUPPORT',
      description: 'Hỗ trợ trực tiếp tài khoản người dùng',
    },
  ],
  SYSTEM: [
    {
      id: 'c44d7a7b-8528-49d3-adbf-9ec9920ef349',
      name: 'AUDIT:VIEW',
      category: 'SYSTEM',
      description: 'Xem lịch sử kiểm toán hệ thống',
    },
    {
      id: 'ee307077-a56d-4b0b-9186-b380d0992e24',
      name: 'SYSTEM:SETTINGS_READ',
      category: 'SYSTEM',
      description: 'Xem cấu hình hệ thống',
    },
    {
      id: 'ea739a13-2ca2-48ce-b3fd-c2835a27f297',
      name: 'SYSTEM:SETTINGS_WRITE',
      category: 'SYSTEM',
      description: 'Thay đổi cấu hình hệ thống',
    },
  ],
  USER_MANAGEMENT: [
    {
      id: 'cbf25df4-c975-4265-adb8-a65d9a7e7edf',
      name: 'USER:BAN',
      category: 'USER_MANAGEMENT',
      description: 'Khóa tài khoản người dùng vi phạm',
    },
    {
      id: 'ae6c90af-a879-4e26-8530-1e8b0448ced5',
      name: 'USER:READ',
      category: 'USER_MANAGEMENT',
      description: 'Xem thông tin người dùng',
    },
    {
      id: '7d32c871-2946-4233-8cc2-d8c29b750340',
      name: 'USER:ROLE_ASSIGN',
      category: 'USER_MANAGEMENT',
      description: 'Gán hoặc thu hồi vai trò của người dùng',
    },
    {
      id: 'd746dccb-9058-4875-b4fa-7a059ccd127d',
      name: 'USER:UNBAN',
      category: 'USER_MANAGEMENT',
      description: 'Mở khóa tài khoản người dùng',
    },
  ],
};

/** All 17 seeded permissions, flattened in render order. */
export const ALL_PERMISSIONS: MockPermission[] = Object.values(PERMISSIONS_BY_CATEGORY).flat();

const PERMISSION_BY_ID = new Map(ALL_PERMISSIONS.map((permission) => [permission.id, permission]));

/** Fresh deep copy so handlers never leak module state into the response. */
function permissionCatalog(): Record<string, MockPermission[]> {
  return structuredClone(PERMISSIONS_BY_CATEGORY);
}

function permissionsByIds(ids: string[]): MockPermission[] {
  return ids
    .map((id) => PERMISSION_BY_ID.get(id))
    .filter((permission): permission is MockPermission => Boolean(permission))
    .sort((a, b) => a.name.localeCompare(b.name))
    .map((permission) => ({ ...permission }));
}

function namesOf(permissionNames: string[]): MockPermission[] {
  return ALL_PERMISSIONS.filter((permission) => permissionNames.includes(permission.name))
    .sort((a, b) => a.name.localeCompare(b.name))
    .map((permission) => ({ ...permission }));
}

function buildSeedRoles(): MockRole[] {
  return [
    {
      id: 'd0bbcbce-aa30-45c6-9615-fdb15cd34864',
      name: 'ADMIN',
      description: 'Quản trị viên toàn quyền hệ thống',
      permissions: permissionsByIds(ALL_PERMISSIONS.map((permission) => permission.id)),
      userCount: 1,
      createdAt: SEEDED_AT,
      updatedAt: SEEDED_AT,
      system: true,
    },
    {
      id: 'ff55a458-0b8c-4800-9687-4ec7572ba1b2',
      name: 'MODERATOR',
      description: 'Điều hành viên nội dung và báo cáo',
      permissions: namesOf([
        'COMMENT:DELETE',
        'CONTENT:MODERATE',
        'POST:DELETE',
        'REPORT:DISMISS',
        'REPORT:RESOLVE',
        'REPORT:VIEW',
        'STORY:DELETE',
        'USER:BAN',
        'USER:READ',
      ]),
      userCount: 0,
      createdAt: SEEDED_AT,
      updatedAt: SEEDED_AT,
      system: false,
    },
    {
      id: '2de23311-61e9-4396-81f6-ce5bb9806743',
      name: 'SUPPORT',
      description: 'Nhân viên hỗ trợ người dùng và khiếu nại',
      permissions: namesOf([
        'REPORT:VIEW',
        'SUPPORT:TICKET_MANAGE',
        'SUPPORT:TICKET_READ',
        'SUPPORT:USER_ASSIST',
        'USER:READ',
      ]),
      userCount: 0,
      createdAt: SEEDED_AT,
      updatedAt: SEEDED_AT,
      system: false,
    },
    {
      id: '903febdd-d549-4b93-bf9a-836a34d422b0',
      name: 'USER',
      description: 'Người dùng tiêu chuẩn hệ thống',
      permissions: [],
      userCount: 0,
      createdAt: SEEDED_AT,
      updatedAt: SEEDED_AT,
      system: true,
    },
  ];
}

/** Mutable module state so mutations are observable across queries. */
let roles: MockRole[] = buildSeedRoles();
/** Deterministic id sequence for roles created through the mock (no crypto dep). */
let createdCount = 0;

function nextRoleId(): string {
  createdCount += 1;
  return `00000000-0000-4000-8000-${String(createdCount).padStart(12, '0')}`;
}

/** Restores the deterministic fixture set (used by tests between cases). */
export function resetRbac(): void {
  roles = buildSeedRoles();
  createdCount = 0;
}

function roleById(roleId: string): MockRole | undefined {
  return roles.find((role) => role.id === roleId);
}

function hasNameConflict(name: string, exceptId?: string): boolean {
  const needle = name.trim().toUpperCase();
  return roles.some((role) => role.id !== exceptId && role.name.toUpperCase() === needle);
}

function notFound() {
  return HttpResponse.json(
    { status: 404, error: 'Not Found', message: 'Role not found' },
    { status: 404 }
  );
}

function systemRoleForbidden() {
  return HttpResponse.json(
    { status: 403, error: 'Forbidden', message: 'System roles cannot be modified' },
    { status: 403 }
  );
}

export const rbacHandlers = [
  // NOTE: returns an OBJECT map (category -> permissions), never a flat array.
  http.get(PERMISSIONS_URL, () => HttpResponse.json(permissionCatalog())),

  http.get(ROLES_URL, () => HttpResponse.json(roles.map((role) => ({ ...role })))),

  http.get(`${ROLES_URL}/:roleId`, ({ params }) => {
    const role = roleById(String(params.roleId));
    return role ? HttpResponse.json({ ...role }) : notFound();
  }),

  http.post(ROLES_URL, async ({ request }) => {
    const body = (await request.json()) as {
      name?: string;
      description?: string;
      permissionIds?: string[];
    };

    const name = (body.name ?? '').trim();
    if (!name) {
      return HttpResponse.json(
        { status: 400, error: 'Bad Request', message: 'Role name is required' },
        { status: 400 }
      );
    }
    if (hasNameConflict(name)) {
      return HttpResponse.json(
        { status: 409, error: 'Conflict', message: 'A role with this name already exists' },
        { status: 409 }
      );
    }

    const timestamp = new Date().toISOString();
    const created: MockRole = {
      id: nextRoleId(),
      name,
      description: body.description ?? '',
      permissions: permissionsByIds(body.permissionIds ?? []),
      userCount: 0,
      createdAt: timestamp,
      updatedAt: timestamp,
      system: false,
    };
    roles = [...roles, created];

    return HttpResponse.json({ ...created }, { status: 201 });
  }),

  http.put(`${ROLES_URL}/:roleId`, async ({ params, request }) => {
    const role = roleById(String(params.roleId));
    if (!role) return notFound();
    if (role.system) return systemRoleForbidden();

    const body = (await request.json()) as { name?: string; description?: string };
    if (body.name && hasNameConflict(body.name, role.id)) {
      return HttpResponse.json(
        { status: 409, error: 'Conflict', message: 'A role with this name already exists' },
        { status: 409 }
      );
    }

    role.name = body.name ?? role.name;
    role.description = body.description ?? role.description;
    role.updatedAt = new Date().toISOString();

    return HttpResponse.json({ ...role });
  }),

  http.delete(`${ROLES_URL}/:roleId`, ({ params }) => {
    const roleId = String(params.roleId);
    const role = roleById(roleId);
    if (!role) return notFound();
    if (role.system) return systemRoleForbidden();

    roles = roles.filter((current) => current.id !== roleId);

    // The live backend answers 200 with an EMPTY body (no JSON payload).
    return new HttpResponse(null, { status: 200 });
  }),

  http.put(`${ROLES_URL}/:roleId/permissions`, async ({ params, request }) => {
    const role = roleById(String(params.roleId));
    if (!role) return notFound();

    const body = (await request.json()) as { permissionIds?: unknown };
    if (!Array.isArray(body.permissionIds)) {
      return HttpResponse.json(
        { status: 400, error: 'Bad Request', message: 'permissionIds is required' },
        { status: 400 }
      );
    }

    role.permissions = permissionsByIds(body.permissionIds.map(String));
    role.updatedAt = new Date().toISOString();

    return HttpResponse.json({ ...role });
  }),
];
