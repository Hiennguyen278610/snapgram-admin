import { describe, it, expect } from 'vitest';
import { loginSchema, twoFactorSchema } from './login.schema';

describe('loginSchema', () => {
  it('accepts valid input', () => {
    expect(loginSchema.safeParse({ email: 'a@b.com', password: 'x' }).success).toBe(true);
  });
  it('rejects empty email', () => {
    expect(loginSchema.safeParse({ email: '', password: 'x' }).success).toBe(false);
  });
  it('rejects invalid email', () => {
    expect(loginSchema.safeParse({ email: 'not-email', password: 'x' }).success).toBe(false);
  });
  it('rejects empty password', () => {
    expect(loginSchema.safeParse({ email: 'a@b.com', password: '' }).success).toBe(false);
  });
});

describe('twoFactorSchema', () => {
  it('accepts 6-digit code', () => {
    expect(twoFactorSchema.safeParse({ code: '123456' }).success).toBe(true);
  });
  it('rejects 5 digits', () => {
    expect(twoFactorSchema.safeParse({ code: '12345' }).success).toBe(false);
  });
  it('rejects non-digit', () => {
    expect(twoFactorSchema.safeParse({ code: 'abcdef' }).success).toBe(false);
  });
});
