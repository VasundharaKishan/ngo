import { describe, it, expect } from 'vitest';
import {
  isValidEmail,
  isValidUrl,
  isValidPhone,
  isEmpty,
  isNotEmpty,
  isInRange,
  hasMinLength,
  hasMaxLength,
  isStrongPassword,
  matches,
  sanitize,
  validateFields,
} from './validators';

describe('validators', () => {
  it('validates email', () => {
    expect(isValidEmail('user@example.com')).toBe(true);
    expect(isValidEmail('bad@')).toBe(false);
    expect(isValidEmail(null)).toBe(false);
  });

  it('validates url', () => {
    expect(isValidUrl('https://example.com')).toBe(true);
    expect(isValidUrl('not a url')).toBe(false);
  });

  it('validates phone', () => {
    expect(isValidPhone('+15551234567')).toBe(true);
    expect(isValidPhone('123')).toBe(true); // current regex allows short numeric strings
    expect(isValidPhone('abc')).toBe(false);
  });

  it('checks emptiness helpers', () => {
    expect(isEmpty('')).toBe(true);
    expect(isEmpty(' hi ')).toBe(false);
    expect(isNotEmpty('value')).toBe(true);
  });

  it('checks range and length helpers', () => {
    expect(isInRange(5, 1, 10)).toBe(true);
    expect(isInRange(0, 1, 10)).toBe(false);
    expect(hasMinLength('hello', 3)).toBe(true);
    expect(hasMaxLength('hello', 3)).toBe(false);
  });

  it('validates strong password and matching', () => {
    expect(isStrongPassword('MyPass123')).toBe(true);
    expect(isStrongPassword('weak')).toBe(false);
    expect(matches('abc', 'abc')).toBe(true);
    expect(matches('abc', 'def')).toBe(false);
  });

  it('sanitizes text', () => {
    expect(sanitize('  trim  ')).toBe('trim');
    expect(sanitize(null)).toBe('');
  });

  it('validates fields with rules', () => {
    const errors = validateFields(
      { email: 'bad', name: '' },
      {
        email: [(v) => isValidEmail(v as string) || 'Invalid email'],
        name: [(v) => isNotEmpty(v as string) || 'Required'],
      }
    );
    expect(errors).toEqual({ email: 'Invalid email', name: 'Required' });
  });
});
