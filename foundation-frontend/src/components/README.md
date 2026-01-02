# Components Module

This directory contains reusable React components used throughout the application.

## Components

### `Layout.tsx`
Main public-facing layout component with header, footer, and content area.

**Features:**
- Responsive navigation menu
- Dynamic footer with social media links
- Featured campaign modal on homepage
- Error boundary for graceful error handling
- Contact information display

**Props:**
- `children`: React nodes to render in content area

**Usage:**
```tsx
<Layout>
  <HomePage />
</Layout>
```

### `AdminLayout.tsx`
Admin panel layout with navigation sidebar and session management.

**Features:**
- Admin navigation menu (Dashboard, Campaigns, Donations, Categories, Users, Settings)
- Session timeout tracking (30 minutes for admin, 15 minutes for dashboard)
- Auto-logout on inactivity
- User information display
- Logout functionality

**Props:**
- Uses `<Outlet />` from React Router for nested routes

**Usage:**
```tsx
<AdminLayout>
  {/* Nested admin routes render here */}
</AdminLayout>
```

### `ErrorBoundary.tsx`
React error boundary for catching and displaying errors gracefully.

**Features:**
- Catches JavaScript errors in component tree
- Displays fallback UI with error message
- Logs error details for debugging
- Provides "Try again" button to retry

**Props:**
- `children`: React nodes to wrap with error boundary

**Usage:**
```tsx
<ErrorBoundary>
  <App />
</ErrorBoundary>
```

### `ToastProvider.tsx` & `useToast()`
Toast notification system for user feedback.

**Features:**
- Success, error, and info toast types
- Auto-dismiss after 4 seconds
- Click to dismiss manually
- Multiple toasts stacked vertically
- Context-based API

**API:**
```typescript
const showToast = useToast();

// Show success toast
showToast('Campaign saved successfully!', 'success');

// Show error toast
showToast('Failed to save campaign', 'error');

// Show info toast
showToast('Processing...', 'info');
```

**Usage:**
```tsx
// Wrap app with provider
<ToastProvider>
  <App />
</ToastProvider>

// Use in components
function MyComponent() {
  const showToast = useToast();
  
  const handleSave = async () => {
    try {
      await saveCampaign();
      showToast('Saved!', 'success');
    } catch (error) {
      showToast('Failed to save', 'error');
    }
  };
}
```

### `FeaturedCampaignModal.tsx`
Modal popup for spotlight campaign on homepage.

**Features:**
- Shows spotlight campaign or fallback active campaign
- Campaign image, title, description
- Progress bar with raised amount
- Donate button linking to donation form
- Close button and backdrop click to dismiss

**Props:**
- `isOpen`: boolean - Whether modal is visible
- `onClose`: () => void - Callback when modal closes
- `campaign`: Campaign object or null

**Usage:**
```tsx
<FeaturedCampaignModal
  isOpen={showModal}
  onClose={() => setShowModal(false)}
  campaign={spotlightCampaign}
/>
```

### `HeroCarousel.tsx`
Auto-advancing image carousel for homepage hero section.

**Features:**
- Auto-advance every 5 seconds
- Manual navigation with previous/next buttons
- Pause on hover
- Smooth transitions
- Indicator dots for current slide
- Responsive images

**Props:**
- `images`: Array of image objects with `id`, `imageUrl`, `title`, `subtitle`, `ctaText`, `ctaLink`

**Usage:**
```tsx
<HeroCarousel images={heroSlides} />
```

### `Pagination.tsx`
Pagination controls for lists.

**Features:**
- Previous/Next buttons
- Page number display
- Disabled states for first/last page
- Total pages and items display
- Accessible with ARIA labels

**Props:**
- `currentPage`: number - Current page (0-indexed)
- `totalPages`: number - Total number of pages
- `onPageChange`: (page: number) => void - Callback when page changes
- `itemsPerPage`: number - Items per page
- `totalItems`: number - Total items count

**Usage:**
```tsx
<Pagination
  currentPage={page}
  totalPages={10}
  onPageChange={setPage}
  itemsPerPage={25}
  totalItems={250}
/>
```

### `AdminHomeSections.tsx`
Admin interface for editing homepage sections (Hero, Why Donate, Stats, Testimonials).

**Features:**
- JSON editor for section configuration
- Validation before saving
- Success/error toast notifications
- Collapsible sections

**Usage:**
Used in admin settings pages.

## Styling

Each component has an associated CSS file:
- `Layout.css` - Public layout styles
- `AdminLayout.css` - Admin panel styles
- `Toast.css` - Toast notification styles
- etc.

Global styles in:
- `src/index.css` - Base styles and CSS variables
- `src/styles/ui-polish.css` - UI enhancements

## Best Practices

### Component Structure
```tsx
// 1. Imports
import { useState, useEffect } from 'react';
import './Component.css';

// 2. Types/Interfaces
interface ComponentProps {
  prop: string;
}

// 3. Component
export default function Component({ prop }: ComponentProps) {
  // State
  const [state, setState] = useState();
  
  // Effects
  useEffect(() => {
    // ...
  }, []);
  
  // Handlers
  const handleClick = () => {
    // ...
  };
  
  // Render
  return (
    <div>
      {/* JSX */}
    </div>
  );
}
```

### State Management
- Use `useState` for local component state
- Use `useContext` for shared state (ConfigContext, ToastContext)
- Lift state up when multiple components need it
- Keep state close to where it's used

### Error Handling
- Wrap app with `<ErrorBoundary>`
- Use try-catch for async operations
- Show user-friendly error messages with toast
- Log errors for debugging

### Accessibility
- Use semantic HTML elements
- Add ARIA labels for screen readers
- Ensure keyboard navigation works
- Maintain sufficient color contrast

### Performance
- Memoize expensive computations with `useMemo`
- Memoize callbacks with `useCallback`
- Use `React.memo()` for expensive components
- Lazy load routes with `React.lazy()`

## Adding New Components

1. Create component file in `src/components/`
2. Create associated CSS file if needed
3. Add TypeScript types/interfaces
4. Add JSDoc comments for props
5. Export as default
6. Add to this README

Example:
```tsx
/**
 * Button component with variants and sizes.
 * 
 * @param children - Button text or content
 * @param variant - Button style variant ('primary' | 'secondary' | 'danger')
 * @param size - Button size ('small' | 'medium' | 'large')
 * @param onClick - Click handler
 */
interface ButtonProps {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'danger';
  size?: 'small' | 'medium' | 'large';
  onClick?: () => void;
}

export default function Button({ 
  children, 
  variant = 'primary', 
  size = 'medium',
  onClick 
}: ButtonProps) {
  return (
    <button 
      className={`btn btn-${variant} btn-${size}`}
      onClick={onClick}
    >
      {children}
    </button>
  );
}
```

## Testing

Components should have unit tests:

```tsx
// Component.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import Component from './Component';

describe('Component', () => {
  it('renders correctly', () => {
    render(<Component />);
    expect(screen.getByText('Hello')).toBeInTheDocument();
  });
  
  it('handles click', () => {
    render(<Component />);
    fireEvent.click(screen.getByRole('button'));
    // Assertions...
  });
});
```

Run tests:
```bash
npm test
```

## Dependencies

Components use:
- React 18 (hooks, context)
- React Router (Link, NavLink, Outlet)
- TypeScript (type safety)
- CSS (styling)

No additional UI libraries - keeping it simple and lightweight.
