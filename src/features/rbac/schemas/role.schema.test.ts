import { describe, it, expect } from 'vitest';
import {
  ROLE_NAME_PATTERN,
  createRoleSchema,
  isRoleFieldErrorKey,
  roleDetailSchema,
  roleListSchema,
  updateRoleSchema,
} from './role.schema';

const PERMISSION = {
  id: '4e75686a-75bf-4844-abe2-e96093de9b46',
  name: 'COMMENT:DELETE',
  category: 'CONTENT_MODERATION',
  description: 'Xóa bình luận vi phạm',
};

describe('roleDetailSchema', () => {
  it('parses a full role detail response including embedded permissions', () => {
    const parsed = roleDetailSchema.parse({
      id: 'd0bbcbce-aa30-45c6-9615-fdb15cd34864',
      name: 'ADMIN',
      description: 'Quản trị viên toàn quyền hệ thống',
      permissions: [PERMISSION],
      userCount: 1,
      createdAt: '2026-10-07T11:01:08.486816Z',
      updatedAt: '2026-10-07T11:01:08.486816Z',
      system: true,
    });

    expect(parsed.permissions[0].name).toBe('COMMENT:DELETE');
    expect(parsed.system).toBe(true);
  });

  it('defaults permissions/userCount/system when the backend omits them', () => {
    const parsed = roleDetailSchema.parse({ id: 'r-1', name: 'USER' });

    expect(parsed.permissions).toEqual([]);
    expect(parsed.userCount).toBe(0);
    expect(parsed.system).toBe(false);
  });

  it('accepts a nullable description', () => {
    expect(
      roleDetailSchema.parse({ id: 'r-1', name: 'USER', description: null }).description
    ).toBeNull();
  });

  it('requires id and name', () => {
    expect(roleDetailSchema.safeParse({ name: 'USER' }).success).toBe(false);
    expect(roleDetailSchema.safeParse({ id: 'r-1' }).success).toBe(false);
  });
});

describe('roleListSchema', () => {
  it('parses the flat array returned by GET /admin/roles', () => {
    const parsed = roleListSchema.parse([
      { id: 'r-1', name: 'ADMIN', system: true },
      { id: 'r-2', name: 'SUPPORT', system: false },
    ]);

    expect(parsed).toHaveLength(2);
    expect(parsed[0].permissions).toEqual([]);
  });

  it('rejects the paged object shape used by the users endpoint', () => {
    expect(roleListSchema.safeParse({ content: [] }).success).toBe(false);
  });
});

describe('createRoleSchema', () => {
  it('trims and uppercases the name and trims the description', () => {
    const parsed = createRoleSchema.parse({
      name: '  support_lead ',
      description: '  Help desk  ',
    });

    expect(parsed.name).toBe('SUPPORT_LEAD');
    expect(parsed.description).toBe('Help desk');
  });

  it('uses the backend pattern and reports it through an i18n key', () => {
    expect(ROLE_NAME_PATTERN.source).toBe('^[A-Z0-9_]+$');

    const parsed = createRoleSchema.safeParse({ name: 'SUPPORT-LEAD' });
    expect(parsed.success).toBe(false);
    if (!parsed.success) {
      expect(parsed.error.issues[0].message).toBe('rbac.error.namePattern');
    }
  });

  it('enforces the 2..50 length bounds through an i18n key', () => {
    const tooShort = createRoleSchema.safeParse({ name: 'A' });
    expect(tooShort.success).toBe(false);
    if (!tooShort.success) {
      expect(tooShort.error.issues[0].message).toBe('rbac.error.nameLength');
    }

    const tooLong = createRoleSchema.safeParse({ name: 'A'.repeat(51) });
    expect(tooLong.success).toBe(false);
    if (!tooLong.success) {
      expect(tooLong.error.issues[0].message).toBe('rbac.error.nameLength');
    }

    expect(createRoleSchema.safeParse({ name: 'AB' }).success).toBe(true);
  });

  it('enforces the 255-char description bound through an i18n key', () => {
    const tooLong = createRoleSchema.safeParse({ name: 'SUPPORT', description: 'x'.repeat(256) });
    expect(tooLong.success).toBe(false);
    if (!tooLong.success) {
      expect(tooLong.error.issues[0].message).toBe('rbac.error.descriptionLength');
    }
  });

  it('accepts an omitted description', () => {
    expect(createRoleSchema.safeParse({ name: 'SUPPORT' }).success).toBe(true);
  });
});

describe('updateRoleSchema', () => {
  it('applies the same name normalisation as create', () => {
    expect(updateRoleSchema.parse({ name: 'support_lead' }).name).toBe('SUPPORT_LEAD');
  });
});

describe('isRoleFieldErrorKey', () => {
  it('recognises our i18n keys and rejects raw zod messages', () => {
    expect(isRoleFieldErrorKey('rbac.error.namePattern')).toBe(true);
    expect(isRoleFieldErrorKey('Invalid input')).toBe(false);
    expect(isRoleFieldErrorKey(undefined)).toBe(false);
  });
});
