import { describe, it, expect } from 'vitest';
import { healthStatusSchema, normalizeHealthStatus } from './health.schema';

describe('healthStatusSchema', () => {
  it('parses the actuator status-only payload', () => {
    const payload = { groups: ['liveness', 'readiness'], status: 'UP' };

    expect(healthStatusSchema.parse(payload)).toEqual({ status: 'UP' });
  });

  it('accepts an optional error field on the proxy DOWN payload', () => {
    expect(healthStatusSchema.parse({ status: 'DOWN', error: 'fetch failed' })).toEqual({
      status: 'DOWN',
      error: 'fetch failed',
    });
  });

  it('rejects a payload without a status string', () => {
    expect(healthStatusSchema.safeParse({ error: 'boom' }).success).toBe(false);
  });
});

describe('normalizeHealthStatus', () => {
  it('maps UP to UP', () => {
    expect(normalizeHealthStatus('UP')).toBe('UP');
  });

  it('maps DOWN to DOWN', () => {
    expect(normalizeHealthStatus('DOWN')).toBe('DOWN');
  });

  it('maps OUT_OF_SERVICE to DOWN', () => {
    expect(normalizeHealthStatus('OUT_OF_SERVICE')).toBe('DOWN');
  });

  it('maps UNKNOWN and any other value to UNKNOWN', () => {
    expect(normalizeHealthStatus('UNKNOWN')).toBe('UNKNOWN');
    expect(normalizeHealthStatus('DEGRADED')).toBe('UNKNOWN');
    expect(normalizeHealthStatus('')).toBe('UNKNOWN');
  });
});
