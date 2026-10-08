import { describe, it, expect } from 'vitest';
import { dashboardKeys, userKeys } from './query-keys';

describe('dashboardKeys', () => {
  it('exposes the domain root key', () => {
    expect(dashboardKeys.all).toEqual(['dashboard']);
  });

  it('nests the stats key under the domain root', () => {
    expect(dashboardKeys.stats()).toEqual(['dashboard', 'stats']);
    expect(dashboardKeys.stats().slice(0, dashboardKeys.all.length)).toEqual([
      ...dashboardKeys.all,
    ]);
  });

  it('returns a fresh array per call while staying stable by value', () => {
    expect(dashboardKeys.stats()).not.toBe(dashboardKeys.stats());
    expect(dashboardKeys.stats()).toEqual(dashboardKeys.stats());
  });
});

describe('userKeys', () => {
  it('exposes the admin/users domain root key', () => {
    expect(userKeys.all).toEqual(['admin', 'users']);
  });

  it('nests lists and details under the domain root', () => {
    expect(userKeys.lists()).toEqual(['admin', 'users', 'list']);
    expect(userKeys.details()).toEqual(['admin', 'users', 'detail']);
  });

  it('appends the filters object to the list scope', () => {
    const filters = { page: 1, size: 20, q: 'alice' };

    expect(userKeys.list(filters)).toEqual(['admin', 'users', 'list', filters]);
  });

  it('appends the id to the detail scope', () => {
    expect(userKeys.detail('u-1')).toEqual(['admin', 'users', 'detail', 'u-1']);
  });

  it('prefix-matches every list key so invalidation reaches all pages', () => {
    const listKey = userKeys.list({ page: 3 });
    expect(listKey.slice(0, userKeys.lists().length)).toEqual([...userKeys.lists()]);
  });
});
