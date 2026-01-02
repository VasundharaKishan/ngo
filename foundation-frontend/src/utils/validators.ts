/**
 * Form validation utilities for consistent validation across the application.
 */

/**
 * Validates if a string is a valid email address.
 *
 * @param email - The email string to validate
 * @returns true if the email is valid, false otherwise
 *
 * @example
 * isValidEmail('user@example.com') // true
 * isValidEmail('invalid-email') // false
 */
export function isValidEmail(email: string | null | undefined): boolean {
  if (!email || typeof email !== 'string') return false;

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim());
}

/**
 * Validates if a string is a valid URL.
 *
 * @param url - The URL string to validate
 * @returns true if the URL is valid, false otherwise
 *
 * @example
 * isValidUrl('https://example.com') // true
 * isValidUrl('invalid-url') // false
 */
export function isValidUrl(url: string | null | undefined): boolean {
  if (!url || typeof url !== 'string') return false;

  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * Validates if a string is a valid phone number (simple validation).
 *
 * @param phone - The phone string to validate
 * @returns true if the phone is valid, false otherwise
 *
 * @example
 * isValidPhone('+1234567890') // true
 * isValidPhone('123') // false
 */
export function isValidPhone(phone: string | null | undefined): boolean {
  if (!phone || typeof phone !== 'string') return false;

  const phoneRegex = /^[+]?[(]?[0-9]{1,4}[)]?[-\s.]?[(]?[0-9]{1,4}[)]?[-\s.]?[0-9]{1,9}$/;
  return phoneRegex.test(phone.trim());
}

/**
 * Checks if a string is empty or contains only whitespace.
 *
 * @param value - The string to check
 * @returns true if the string is empty or whitespace, false otherwise
 *
 * @example
 * isEmpty('') // true
 * isEmpty('  ') // true
 * isEmpty('hello') // false
 */
export function isEmpty(value: string | null | undefined): boolean {
  return !value || value.trim() === '';
}

/**
 * Checks if a string is not empty.
 *
 * @param value - The string to check
 * @returns true if the string is not empty, false otherwise
 */
export function isNotEmpty(value: string | null | undefined): boolean {
  return !isEmpty(value);
}

/**
 * Validates if a number is within a specified range.
 *
 * @param value - The number to validate
 * @param min - The minimum value (inclusive)
 * @param max - The maximum value (inclusive)
 * @returns true if the number is within range, false otherwise
 *
 * @example
 * isInRange(5, 1, 10) // true
 * isInRange(15, 1, 10) // false
 */
export function isInRange(
  value: number | null | undefined,
  min: number,
  max: number
): boolean {
  if (value === null || value === undefined || isNaN(value)) return false;
  return value >= min && value <= max;
}

/**
 * Validates if a string has a minimum length.
 *
 * @param value - The string to validate
 * @param minLength - The minimum length required
 * @returns true if the string meets the minimum length, false otherwise
 *
 * @example
 * hasMinLength('hello', 3) // true
 * hasMinLength('hi', 5) // false
 */
export function hasMinLength(
  value: string | null | undefined,
  minLength: number
): boolean {
  if (!value) return false;
  return value.length >= minLength;
}

/**
 * Validates if a string has a maximum length.
 *
 * @param value - The string to validate
 * @param maxLength - The maximum length allowed
 * @returns true if the string meets the maximum length, false otherwise
 *
 * @example
 * hasMaxLength('hello', 10) // true
 * hasMaxLength('hello world', 5) // false
 */
export function hasMaxLength(
  value: string | null | undefined,
  maxLength: number
): boolean {
  if (!value) return true; // Empty values are considered valid for max length
  return value.length <= maxLength;
}

/**
 * Validates if a password meets strength requirements.
 * Requirements: At least 8 characters, contains uppercase, lowercase, and number.
 *
 * @param password - The password to validate
 * @returns true if the password is strong, false otherwise
 *
 * @example
 * isStrongPassword('MyPass123') // true
 * isStrongPassword('weak') // false
 */
export function isStrongPassword(password: string | null | undefined): boolean {
  if (!password || typeof password !== 'string') return false;

  const hasMinLength = password.length >= 8;
  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);

  return hasMinLength && hasUppercase && hasLowercase && hasNumber;
}

/**
 * Validates if two strings match (useful for password confirmation).
 *
 * @param value1 - The first string
 * @param value2 - The second string
 * @returns true if both strings match, false otherwise
 *
 * @example
 * matches('password', 'password') // true
 * matches('password', 'different') // false
 */
export function matches(
  value1: string | null | undefined,
  value2: string | null | undefined
): boolean {
  if (!value1 || !value2) return false;
  return value1 === value2;
}

/**
 * Sanitizes a string by trimming whitespace.
 *
 * @param value - The string to sanitize
 * @returns Trimmed string, or empty string if input is null/undefined
 *
 * @example
 * sanitize('  hello  ') // 'hello'
 * sanitize(null) // ''
 */
export function sanitize(value: string | null | undefined): string {
  return value ? value.trim() : '';
}

/**
 * Validates multiple fields and returns an object with error messages.
 *
 * @param fields - Object containing field names and values to validate
 * @param rules - Object containing field names and validation rules
 * @returns Object with error messages for invalid fields
 *
 * @example
 * validateFields(
 *   { email: 'invalid', name: '' },
 *   { email: [(v) => isValidEmail(v) || 'Invalid email'], name: [(v) => isNotEmpty(v) || 'Required'] }
 * )
 * // { email: 'Invalid email', name: 'Required' }
 */
export function validateFields(
  fields: Record<string, unknown>,
  rules: Record<string, Array<(value: unknown) => string | boolean>>
): Record<string, string> {
  const errors: Record<string, string> = {};

  for (const [fieldName, validators] of Object.entries(rules)) {
    const value = fields[fieldName];
    
    for (const validator of validators) {
      const result = validator(value);
      if (typeof result === 'string') {
        errors[fieldName] = result;
        break; // Stop at first error for this field
      }
    }
  }

  return errors;
}
