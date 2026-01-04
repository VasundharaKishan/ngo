/**
 * Date formatting utilities for consistent date/time display across the application.
 */

/**
 * Format options for date display
 */
export interface DateFormatOptions {
  year?: 'numeric' | '2-digit';
  month?: 'numeric' | '2-digit' | 'long' | 'short' | 'narrow';
  day?: 'numeric' | '2-digit';
  hour?: 'numeric' | '2-digit';
  minute?: 'numeric' | '2-digit';
  second?: 'numeric' | '2-digit';
}

/**
 * Default format for displaying dates (e.g., "Jan 15, 2025")
 */
const DEFAULT_DATE_FORMAT: DateFormatOptions = {
  year: 'numeric',
  month: 'short',
  day: 'numeric',
};

/**
 * Default format for displaying date and time (e.g., "Jan 15, 2025, 2:30 PM")
 */
const DEFAULT_DATETIME_FORMAT: DateFormatOptions = {
  year: 'numeric',
  month: 'short',
  day: 'numeric',
  hour: 'numeric',
  minute: '2-digit',
};

/**
 * Formats a date string or Date object to a localized date string.
 *
 * @param date - The date to format (string, Date, or null/undefined)
 * @param locale - The locale to use (defaults to 'en-US')
 * @param options - Custom format options (defaults to DEFAULT_DATE_FORMAT)
 * @returns Formatted date string, or empty string if date is invalid
 *
 * @example
 * formatDate('2025-01-15') // "Jan 15, 2025"
 * formatDate(new Date()) // "Jan 15, 2025"
 * formatDate('2025-01-15', 'en-US', { month: 'long' }) // "January 15, 2025"
 */
export function formatDate(
  date: string | Date | null | undefined,
  locale: string = 'en-US',
  options: DateFormatOptions = DEFAULT_DATE_FORMAT
): string {
  if (!date) return '';

  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    
    if (isNaN(dateObj.getTime())) {
      console.warn('Invalid date provided to formatDate:', date);
      return '';
    }

    return dateObj.toLocaleDateString(locale, options);
  } catch (error) {
    console.error('Error formatting date:', error);
    return '';
  }
}

/**
 * Formats a date string or Date object to a localized date and time string.
 *
 * @param date - The date to format (string, Date, or null/undefined)
 * @param locale - The locale to use (defaults to 'en-US')
 * @param options - Custom format options (defaults to DEFAULT_DATETIME_FORMAT)
 * @returns Formatted date-time string, or empty string if date is invalid
 *
 * @example
 * formatDateTime('2025-01-15T14:30:00') // "Jan 15, 2025, 2:30 PM"
 * formatDateTime(new Date()) // "Jan 15, 2025, 2:30 PM"
 */
export function formatDateTime(
  date: string | Date | null | undefined,
  locale: string = 'en-US',
  options: DateFormatOptions = DEFAULT_DATETIME_FORMAT
): string {
  if (!date) return '';

  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    
    if (isNaN(dateObj.getTime())) {
      console.warn('Invalid date provided to formatDateTime:', date);
      return '';
    }

    return dateObj.toLocaleString(locale, options);
  } catch (error) {
    console.error('Error formatting date-time:', error);
    return '';
  }
}

/**
 * Formats a date to a short date string (e.g., "1/15/2025")
 *
 * @param date - The date to format
 * @param locale - The locale to use (defaults to 'en-US')
 * @returns Short date string
 *
 * @example
 * formatShortDate('2025-01-15') // "1/15/2025"
 */
export function formatShortDate(
  date: string | Date | null | undefined,
  locale: string = 'en-US'
): string {
  return formatDate(date, locale, {
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
  });
}

/**
 * Formats a date to a long date string (e.g., "January 15, 2025")
 *
 * @param date - The date to format
 * @param locale - The locale to use (defaults to 'en-US')
 * @returns Long date string
 *
 * @example
 * formatLongDate('2025-01-15') // "January 15, 2025"
 */
export function formatLongDate(
  date: string | Date | null | undefined,
  locale: string = 'en-US'
): string {
  return formatDate(date, locale, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

/**
 * Gets the current year as a string.
 *
 * @returns Current year (e.g., "2025")
 *
 * @example
 * getCurrentYear() // "2025"
 */
export function getCurrentYear(): string {
  return new Date().getFullYear().toString();
}

/**
 * Checks if a date string or Date object is valid.
 *
 * @param date - The date to check
 * @returns true if the date is valid, false otherwise
 *
 * @example
 * isValidDate('2025-01-15') // true
 * isValidDate('invalid') // false
 * isValidDate(null) // false
 */
export function isValidDate(date: string | Date | null | undefined): boolean {
  if (!date) return false;

  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return !isNaN(dateObj.getTime());
  } catch {
    return false;
  }
}

/**
 * Parses a date string to a Date object.
 *
 * @param dateString - The date string to parse
 * @returns Date object, or null if invalid
 *
 * @example
 * parseDate('2025-01-15') // Date object
 * parseDate('invalid') // null
 */
export function parseDate(dateString: string | null | undefined): Date | null {
  if (!dateString) return null;

  try {
    const date = new Date(dateString);
    return isNaN(date.getTime()) ? null : date;
  } catch {
    return null;
  }
}
