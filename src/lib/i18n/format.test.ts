import { describe, it, expect } from 'vitest';
import { formatCurrency, formatDateTime, formatNumber } from './format';

describe('formatNumber', () => {
  it('groups thousands with the en-US separator', () => {
    expect(formatNumber(1250, 'en')).toBe('1,250');
  });

  it('groups thousands with the vi-VN separator', () => {
    expect(formatNumber(1250, 'vi')).toBe('1.250');
  });

  it('formats small values without a separator', () => {
    expect(formatNumber(87, 'en')).toBe('87');
  });
});

describe('formatDateTime', () => {
  const iso = '2026-10-07T09:15:00Z';

  it('formats a valid ISO timestamp for both locales', () => {
    expect(formatDateTime(iso, 'en')).toMatch(/\d{2}\/\d{2}\/\d{4}/);
    expect(formatDateTime(iso, 'vi')).toMatch(/\d{2}\/\d{2}\/\d{4}/);
  });

  it('returns a non-empty string containing the time', () => {
    const formatted = formatDateTime(iso, 'en');

    expect(formatted.length).toBeGreaterThan(0);
    expect(formatted).toMatch(/\d{1,2}:\d{2}/);
  });
});

describe('formatCurrency', () => {
  it('formats currency correctly in en and vi', () => {
    expect(formatCurrency(199000, 'VND', 'en')).toContain('199,000');
    expect(formatCurrency(199000, 'VND', 'vi')).toContain('199.000');
  });
});
