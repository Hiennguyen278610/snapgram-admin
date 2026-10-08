import { describe, it, expect } from 'vitest';
import { PERMISSIONS_BY_CATEGORY } from '@/mocks/handlers/rbac.handlers';
import {
  PERMISSION_CATEGORIES,
  flattenPermissions,
  isPermissionCategory,
  permissionMapSchema,
  permissionResponseSchema,
} from './permission.schema';

const LIVE_PERMISSION_NAMES = [
  'COMMENT:DELETE',
  'CONTENT:MODERATE',
  'POST:DELETE',
  'STORY:DELETE',
  'REPORT:DISMISS',
  'REPORT:RESOLVE',
  'REPORT:VIEW',
  'SUPPORT:TICKET_MANAGE',
  'SUPPORT:TICKET_READ',
  'SUPPORT:USER_ASSIST',
  'AUDIT:VIEW',
  'SYSTEM:SETTINGS_READ',
  'SYSTEM:SETTINGS_WRITE',
  'USER:BAN',
  'USER:READ',
  'USER:ROLE_ASSIGN',
  'USER:UNBAN',
];

describe('PERMISSION_CATEGORIES', () => {
  it('locks the five live categories and their render order', () => {
    expect(PERMISSION_CATEGORIES).toEqual([
      'CONTENT_MODERATION',
      'REPORT_MANAGEMENT',
      'SUPPORT',
      'SYSTEM',
      'USER_MANAGEMENT',
    ]);
  });

  it('narrows known categories with isPermissionCategory', () => {
    expect(isPermissionCategory('SYSTEM')).toBe(true);
    expect(isPermissionCategory('CUSTOM_GROUP')).toBe(false);
  });
});

describe('permissionMapSchema', () => {
  it('parses the live category map (record) shape', () => {
    const parsed = permissionMapSchema.safeParse(PERMISSIONS_BY_CATEGORY);

    expect(parsed.success).toBe(true);
    if (!parsed.success) return;

    expect(Object.keys(parsed.data)).toEqual([...PERMISSION_CATEGORIES]);
    expect(flattenPermissions(parsed.data)).toHaveLength(17);
    expect(
      flattenPermissions(parsed.data)
        .map((permission) => permission.name)
        .sort()
    ).toEqual([...LIVE_PERMISSION_NAMES].sort());
  });

  it('rejects the flat array shape the original brief assumed', () => {
    const flatArray = flattenPermissions(PERMISSIONS_BY_CATEGORY);
    expect(Array.isArray(flatArray)).toBe(true);

    const parsed = permissionMapSchema.safeParse(flatArray);
    expect(parsed.success).toBe(false);
  });

  it('rejects a category whose value is not a permission array', () => {
    expect(permissionMapSchema.safeParse({ SYSTEM: 'nope' }).success).toBe(false);
  });
});

describe('permissionResponseSchema', () => {
  it('requires id/name/category and keeps description optional', () => {
    expect(
      permissionResponseSchema.safeParse({ id: 'p-1', name: 'USER:READ', category: 'SYSTEM' })
        .success
    ).toBe(true);
    expect(
      permissionResponseSchema.safeParse({ name: 'USER:READ', category: 'SYSTEM' }).success
    ).toBe(false);
    expect(permissionResponseSchema.safeParse({ id: 'p-1', category: 'SYSTEM' }).success).toBe(
      false
    );
  });
});

describe('flattenPermissions', () => {
  it('appends unknown categories after the five known ones', () => {
    const custom = {
      id: 'custom-1',
      name: 'CUSTOM:DO',
      category: 'CUSTOM_GROUP',
      description: 'custom',
    };

    const flat = flattenPermissions({ ...PERMISSIONS_BY_CATEGORY, CUSTOM_GROUP: [custom] });

    expect(flat).toHaveLength(18);
    expect(flat.at(-1)?.name).toBe('CUSTOM:DO');
  });

  it('tolerates a missing category', () => {
    const withoutSystem = Object.fromEntries(
      Object.entries(PERMISSIONS_BY_CATEGORY).filter(([category]) => category !== 'SYSTEM')
    );

    expect(flattenPermissions(withoutSystem)).toHaveLength(14);
  });
});
