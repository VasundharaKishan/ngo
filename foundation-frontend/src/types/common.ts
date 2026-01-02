/**
 * Common TypeScript type definitions for the application
 */

import { type ReactNode } from 'react';

/**
 * React Error Info provided by React's componentDidCatch
 */
export interface ReactErrorInfo {
  componentStack: string;
  digest?: string;
}

/**
 * Generic configuration object type
 * Used for dynamic configurations that can have arbitrary keys
 */
export type JsonValue = string | number | boolean | null | JsonValue[] | { [key: string]: JsonValue };
export type JsonConfig = Record<string, JsonValue>;

/**
 * Home section configuration types
 */
export interface HeroSectionConfig {
  heading: string;
  subheading: string;
  ctaText: string;
  ctaLink: string;
  backgroundImage?: string;
}

export interface WhyDonateSectionConfig {
  title: string;
  description: string;
  reasons: Array<{
    icon: string;
    title: string;
    description: string;
  }>;
}

export interface StatsSectionConfig {
  title: string;
  stats: Array<{
    value: string;
    label: string;
    icon?: string;
  }>;
}

export interface TestimonialsSectionConfig {
  title: string;
  testimonials: Array<{
    name: string;
    role: string;
    content: string;
    imageUrl?: string;
  }>;
}

/**
 * Validation function type for form fields
 */
export type ValidationRule<T = unknown> = (value: T) => string | boolean;

/**
 * Form error state type
 */
export type FormErrors = Record<string, string>;

/**
 * Generic API response wrapper
 */
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

/**
 * Paginated API response
 */
export interface PaginatedResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  first: boolean;
  last: boolean;
}

/**
 * Common props for components with children
 */
export interface ChildrenProps {
  children: ReactNode;
}

/**
 * Generic ID type
 */
export type EntityId = string;

/**
 * Timestamp type (ISO 8601 string)
 */
export type Timestamp = string;

/**
 * Currency code (ISO 4217)
 */
export type CurrencyCode = 'USD' | 'EUR' | 'GBP' | string;

/**
 * HTTP method types
 */
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';

/**
 * Toast notification types
 */
export type ToastType = 'success' | 'error' | 'info' | 'warning';

/**
 * User role types
 */
export type UserRole = 'ADMIN' | 'OPERATOR' | 'USER';

/**
 * Campaign status types
 */
export type CampaignStatus = 'DRAFT' | 'ACTIVE' | 'PAUSED' | 'COMPLETED' | 'CANCELLED';

/**
 * Donation status types
 */
export type DonationStatus = 'SUCCESS' | 'PENDING' | 'FAILED' | 'REFUNDED';

/**
 * Sort direction
 */
export type SortDirection = 'asc' | 'desc';

/**
 * Filter operators
 */
export type FilterOperator = 'equals' | 'contains' | 'startsWith' | 'endsWith' | 'greaterThan' | 'lessThan';
