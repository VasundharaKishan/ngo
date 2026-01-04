# Utils Module

This directory contains utility functions used throughout the application for common tasks.

## Files

### `auth.ts`
Authentication utilities for secure API communication.

**Key Functions:**
- `authFetch()` - Fetch wrapper with automatic CSRF protection and cookie handling
- `getAuthToken()` - Deprecated, kept for backward compatibility
- `withAuthHeaders()` - Deprecated, kept for backward compatibility

**Security Features:**
- httpOnly cookie authentication
- CSRF token extraction and injection
- Automatic credentials inclusion

### `currency.ts`
Currency formatting and calculation utilities.

**Key Functions:**
- `formatCurrency()` - Format amounts with currency symbols
- `centsToAmount()` - Convert cents to dollars/main currency unit
- `amountToCents()` - Convert dollars to cents/smallest currency unit
- `calculateProgress()` - Calculate donation progress percentage
- `getCurrencySymbol()` - Get symbol for currency code

**Features:**
- Handles null/undefined values safely
- Supports multiple currencies (USD, EUR, GBP, INR, etc.)
- Consistent formatting across application

### `validators.ts`
Form validation utilities.

**Key Functions:**
- `isValidEmail()` - Email format validation
- `isValidUrl()` - URL format validation
- `isValidPhone()` - Phone number validation
- `isEmpty()` - Check if string is empty
- `isNotEmpty()` - Check if string is not empty
- `validatePasswordStrength()` - Password strength validation
- `validateAmount()` - Donation amount validation

**Features:**
- Comprehensive JSDoc documentation
- Type-safe validation
- Handles edge cases (null, undefined, whitespace)

### `dateUtils.ts`
Date formatting utilities.

**Key Functions:**
- `formatDate()` - Format Date objects to readable strings
- `getCurrentYear()` - Get current year for copyright notices
- `parseDate()` - Parse ISO date strings
- `isValidDate()` - Date validation

**Features:**
- Consistent date formatting
- Timezone handling
- Null-safe operations

### `contactApi.ts`
Contact information API client.

**Key Functions:**
- `fetchContactInfo()` - Get contact information from API
- `type ContactInfo` - TypeScript interface for contact data

**Usage:**
```typescript
const contact = await fetchContactInfo();
console.log(contact.email, contact.phone, contact.address);
```

## Usage Examples

### Authentication
```typescript
import { authFetch } from './utils/auth';

// Authenticated GET request
const response = await authFetch('/api/admin/campaigns');
const campaigns = await response.json();

// Authenticated POST request
const response = await authFetch('/api/admin/campaigns', {
  method: 'POST',
  body: JSON.stringify({ title: 'New Campaign' })
});
```

### Currency Formatting
```typescript
import { formatCurrency, calculateProgress } from './utils/currency';

// Format amount
formatCurrency(150000, 'INR'); // "₹1,500"

// Calculate progress
calculateProgress(75000, 100000); // 75
```

### Validation
```typescript
import { isValidEmail, validatePasswordStrength } from './utils/validators';

// Email validation
if (!isValidEmail(email)) {
  setError('Invalid email address');
}

// Password strength
const strength = validatePasswordStrength(password);
if (strength === 'weak') {
  setError('Password too weak');
}
```

### Date Formatting
```typescript
import { formatDate, getCurrentYear } from './utils/dateUtils';

// Format date
formatDate(new Date()); // "Jan 1, 2026"

// Copyright year
const year = getCurrentYear(); // 2026
```

## Best Practices

1. **Always use utility functions** instead of implementing formatting inline
2. **Handle null/undefined** - All utilities safely handle missing values
3. **Type safety** - Use TypeScript types from utilities
4. **Test utilities** - Add unit tests for any new utility functions
5. **Document functions** - Add JSDoc comments for public functions

## Adding New Utilities

When adding a new utility function:

1. Choose the appropriate file or create a new one
2. Add comprehensive JSDoc documentation
3. Handle edge cases (null, undefined, empty values)
4. Use TypeScript for type safety
5. Write unit tests in `.test.ts` file
6. Update this README

Example:
```typescript
/**
 * Description of what the function does
 * 
 * @param paramName - Description of parameter
 * @returns Description of return value
 * 
 * @example
 * myFunction('input'); // 'output'
 */
export function myFunction(paramName: string): string {
  // Implementation
  return result;
}
```

## Testing

All utility functions should have unit tests:

```bash
# Run tests
npm test

# Run tests for specific file
npm test -- validators.test.ts
```

## Dependencies

Utilities have minimal dependencies:
- No external libraries (except TypeScript types)
- Pure functions where possible
- No side effects

## Security Considerations

- **auth.ts**: Implements CSRF protection and secure cookie handling
- **validators.ts**: Prevents XSS with input validation
- **All utilities**: Sanitize inputs and handle edge cases safely
