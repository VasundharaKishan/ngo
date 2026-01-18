import { describe, it, expect } from 'vitest';
import {
  CURRENCY_SYMBOLS,
  getCurrencySymbol,
  centsToAmount,
  amountToCents,
  formatCurrency,
  formatAmount,
  formatAmountForInput,
  calculateProgress,
  formatCurrencyCode,
  isValidAmount,
} from './currency';

describe('currency utils', () => {
  it('gets symbols and formats codes', () => {
    expect(getCurrencySymbol('usd')).toBe('$');
    expect(getCurrencySymbol('unknown')).toBe('$');
    expect(formatCurrencyCode('eur')).toBe('EUR');
    expect(formatCurrencyCode(null)).toBe('USD');
    expect(CURRENCY_SYMBOLS.inr).toBe('₹');
  });

  it('converts between cents and amount safely', () => {
    expect(centsToAmount(1234)).toBe(12.34);
    expect(centsToAmount(undefined)).toBe(0);
    expect(amountToCents(12.34)).toBe(1234);
    expect(amountToCents('bad')).toBe(0);
  });

  it('formats currency strings', () => {
    const formatted = formatCurrency(123456, 'usd', { decimals: 2, includeSymbol: true });
    expect(formatted).toContain('$');
    expect(formatCurrency(123456, 'usd', { includeSymbol: false, includeCurrencyCode: true })).toContain('USD');
  });

  it('formats amounts for display and input', () => {
    expect(formatAmount(123456)).toBe('1,234.56');
    expect(formatAmountForInput(123456)).toBe('1234.56');
  });

  it('calculates progress with safety', () => {
    expect(calculateProgress(50, 100)).toBe(50);
    expect(calculateProgress(200, 100)).toBe(100);
    expect(calculateProgress(null, null)).toBe(0);
  });

  it('validates amount strings', () => {
    expect(isValidAmount('10')).toBe(true);
    expect(isValidAmount('')).toBe(false);
    expect(isValidAmount('abc')).toBe(false);
  });
});
