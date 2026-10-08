import { describe, it, expect } from 'vitest';
import { dashboardKeys } from './query-keys';

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
