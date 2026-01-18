import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  formatDate,
  formatDateTime,
  formatShortDate,
  formatLongDate,
  getCurrentYear,
  isValidDate,
  parseDate,
} from './dateUtils';

describe('dateUtils', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('formats dates safely', () => {
    expect(formatDate('2025-01-15')).toContain('2025');
    expect(formatDate(null)).toBe('');
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    expect(formatDate('bad-date')).toBe('');
  });

  it('formats date-times safely', () => {
    expect(formatDateTime('2025-01-15T14:30:00')).toContain('2025');
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    expect(formatDateTime('bad')).toBe('');
  });

  it('formats short and long dates', () => {
    expect(formatShortDate('2025-01-15')).toBe(formatDate('2025-01-15', 'en-US', { year: 'numeric', month: 'numeric', day: 'numeric' }));
    expect(formatLongDate('2025-01-15')).toContain('2025');
  });

  it('returns current year', () => {
    const year = new Date().getFullYear().toString();
    expect(getCurrentYear()).toBe(year);
  });

  it('checks valid dates', () => {
    expect(isValidDate('2025-01-15')).toBe(true);
    expect(isValidDate('invalid')).toBe(false);
  });

  it('parses dates', () => {
    expect(parseDate('2025-01-15')).toBeInstanceOf(Date);
    expect(parseDate('invalid')).toBeNull();
    expect(parseDate(null)).toBeNull();
  });
});
