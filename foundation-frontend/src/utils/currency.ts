/**
 * Currency and Amount Formatting Utilities
 * 
 * Centralized functions for consistent currency display across the application.
 * All amounts are stored in cents/smallest currency unit and need conversion for display.
 * 
 * These utilities handle null/undefined values safely to prevent NaN errors.
 */

/**
 * Currency symbols map
 */
export const CURRENCY_SYMBOLS: Record<string, string> = {
  usd: '$',
  eur: '€',
  gbp: '£',
  inr: '₹',
  aud: 'A$',
  cad: 'C$',
  jpy: '¥',
  cny: '¥',
};

/**
 * Get currency symbol from currency code
 */
export function getCurrencySymbol(currencyCode: string): string {
  const code = currencyCode?.toLowerCase() || 'usd';
  return CURRENCY_SYMBOLS[code] || '$';
}

/**
 * Convert cents to dollars (or equivalent currency unit)
 * Safely handles null/undefined/NaN values
 * 
 * @param amountInCents - Amount in smallest currency unit (cents)
 * @returns Amount in main currency unit (dollars), defaults to 0
 */
export function centsToAmount(amountInCents: number | null | undefined): number {
  const amount = amountInCents ?? 0;
  if (isNaN(amount)) return 0;
  return amount / 100;
}

/**
 * Convert dollars to cents (or equivalent currency unit)
 * Safely handles null/undefined/NaN values
 * 
 * @param amount - Amount in main currency unit (dollars)
 * @returns Amount in smallest currency unit (cents), defaults to 0
 */
export function amountToCents(amount: number | string | null | undefined): number {
  if (amount === null || amount === undefined || amount === '') return 0;
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (isNaN(numAmount)) return 0;
  return Math.round(numAmount * 100);
}

/**
 * Format amount with currency symbol
 * Safely handles null/undefined/NaN values
 * 
 * @param amountInCents - Amount in smallest currency unit
 * @param currencyCode - Currency code (usd, eur, gbp, etc.)
 * @param options - Formatting options
 * @returns Formatted string like "$1,234.56"
 */
export function formatCurrency(
  amountInCents: number | null | undefined,
  currencyCode: string = 'usd',
  options: { 
    decimals?: number;
    includeSymbol?: boolean;
    includeCurrencyCode?: boolean;
  } = {}
): string {
  const {
    decimals = 2,
    includeSymbol = true,
    includeCurrencyCode = false,
  } = options;

  const amount = centsToAmount(amountInCents);
  const symbol = includeSymbol ? getCurrencySymbol(currencyCode) : '';
  const code = includeCurrencyCode ? ` ${currencyCode.toUpperCase()}` : '';
  
  const formatted = amount.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });

  return `${symbol}${formatted}${code}`.trim();
}

/**
 * Format amount for display without currency symbol
 * Useful for input fields and calculations
 * 
 * @param amountInCents - Amount in smallest currency unit
 * @param decimals - Number of decimal places
 * @returns Formatted number string like "1,234.56"
 */
export function formatAmount(
  amountInCents: number | null | undefined,
  decimals: number = 2
): string {
  const amount = centsToAmount(amountInCents);
  return amount.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

/**
 * Format amount for form input (no thousands separator)
 * 
 * @param amountInCents - Amount in smallest currency unit
 * @returns Plain number string like "1234.56"
 */
export function formatAmountForInput(amountInCents: number | null | undefined): string {
  const amount = centsToAmount(amountInCents);
  return amount.toFixed(2);
}

/**
 * Calculate percentage progress
 * Safely handles null/undefined/zero denominator
 * 
 * @param current - Current amount
 * @param target - Target amount
 * @param decimals - Number of decimal places
 * @returns Percentage value (0-100), capped at 100
 */
export function calculateProgress(
  current: number | null | undefined,
  target: number | null | undefined,
  decimals: number = 1
): number {
  const currentVal = current ?? 0;
  const targetVal = target ?? 1; // Avoid division by zero
  
  if (targetVal === 0 || isNaN(currentVal) || isNaN(targetVal)) return 0;
  
  const percentage = (currentVal / targetVal) * 100;
  const capped = Math.min(percentage, 100);
  
  return Number(capped.toFixed(decimals));
}

/**
 * Format currency code to uppercase
 * 
 * @param currencyCode - Currency code
 * @returns Uppercase currency code, defaults to 'USD'
 */
export function formatCurrencyCode(currencyCode: string | null | undefined): string {
  return (currencyCode || 'USD').toUpperCase();
}

/**
 * Validate if a string is a valid amount
 * 
 * @param value - String value to validate
 * @returns true if valid, false otherwise
 */
export function isValidAmount(value: string): boolean {
  if (!value || value.trim() === '') return false;
  const num = parseFloat(value);
  return !isNaN(num) && num > 0;
}
