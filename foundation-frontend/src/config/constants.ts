/**
 * Application-wide constants and configuration
 */

// ===== API Configuration =====
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api';

// ===== API Endpoints =====
export const API_ENDPOINTS = {
  // Authentication
  AUTH: {
    LOGIN: '/auth/login',
    REQUEST_OTP: '/auth/otp/request',
    VERIFY_OTP: '/auth/otp/verify',
    SETUP_PASSWORD: '/auth/setup-password',
    LOGOUT: '/auth/logout',
  },
  
  // Admin Users
  ADMIN: {
    USERS: '/admin/users',
    USER_BY_ID: (id: string) => `/admin/users/${id}`,
    USER_STATUS: (id: string) => `/admin/users/${id}/status`,
    USER_PASSWORD: (id: string) => `/admin/users/${id}/password`,
  },
  
  // Categories
  CATEGORIES: {
    ALL: '/categories',
    PUBLIC: '/categories/public',
    BY_ID: (id: string) => `/categories/${id}`,
    BY_SLUG: (slug: string) => `/categories/slug/${slug}`,
  },
  
  // Campaigns
  CAMPAIGNS: {
    ALL: '/campaigns',
    PUBLIC: '/campaigns/public',
    FEATURED: '/campaigns/featured',
    BY_ID: (id: string) => `/campaigns/${id}`,
    BY_SLUG: (slug: string) => `/campaigns/slug/${slug}`,
    SPOTLIGHT: '/campaigns/spotlight',
    SET_SPOTLIGHT: (id: string) => `/campaigns/${id}/spotlight`,
  },
  
  // Donations
  DONATIONS: {
    ALL: '/donations',
    BY_ID: (id: string) => `/donations/${id}`,
    CREATE: '/donations',
    WEBHOOK: '/donations/webhook',
  },
  
  // CMS Content
  CMS: {
    CONTENT: (section: string) => `/cms/content/${section}`,
    TESTIMONIALS: '/cms/testimonials',
    STATS: '/cms/stats',
    SOCIAL_MEDIA: '/cms/social-media',
    CAROUSEL: '/cms/carousel',
  },
  
  // Public APIs
  PUBLIC: {
    STATS: '/public/stats',
    CONTACT: '/config/public/contact',
    FOOTER: '/config/public/footer',
  },
  
  // Site Settings
  SETTINGS: {
    SITE: '/settings/site',
    FOOTER: '/settings/footer',
    CONTACT: '/settings/contact',
  },
  
  // Hero Slides
  HERO: {
    SLIDES: '/hero/slides',
    SLIDE_BY_ID: (id: string) => `/hero/slides/${id}`,
    REORDER: '/hero/slides/reorder',
  },
  
  // Home Sections
  HOME: {
    SECTIONS: '/home/sections',
    SECTION_BY_ID: (id: string) => `/home/sections/${id}`,
  },
} as const;

// ===== Timing Constants =====
export const TIMING = {
  // Session timeouts (in milliseconds)
  SESSION_TIMEOUT_ADMIN: 30 * 60 * 1000, // 30 minutes
  SESSION_TIMEOUT_DASHBOARD: 15 * 60 * 1000, // 15 minutes
  
  // Debounce delays
  DEBOUNCE_SEARCH: 300, // 300ms
  DEBOUNCE_INPUT: 500, // 500ms
  
  // Auto-advance intervals
  CAROUSEL_INTERVAL: 5000, // 5 seconds
  
  // Toast display duration
  TOAST_DURATION: 5000, // 5 seconds
} as const;

// ===== Pagination Constants =====
export const PAGINATION = {
  DEFAULT_PAGE: 0,
  DEFAULT_SIZE: 25,
  SIZE_OPTIONS: [10, 25, 50, 100] as const,
  MAX_VISIBLE_PAGES: 5,
} as const;

// ===== Donation Constants =====
export const DONATION = {
  PRESET_AMOUNTS: [500, 1000, 2500, 5000, 10000] as const,
  DEFAULT_AMOUNT: 1000,
  MIN_AMOUNT: 1,
  MAX_AMOUNT: 1000000,
  CURRENCY: 'INR',
} as const;

// ===== Sort Order Constants =====
export const SORT_ORDER = {
  INCREMENT: 10,
  DEFAULT_START: 10,
} as const;

// ===== Progress Bar Constants =====
export const PROGRESS = {
  MAX_PERCENTAGE: 100,
  ANIMATION_DURATION: 500, // 500ms
} as const;

// ===== Validation Constants =====
export const VALIDATION = {
  // Email
  EMAIL_MAX_LENGTH: 255,
  EMAIL_PATTERN: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  
  // Password
  PASSWORD_MIN_LENGTH: 8,
  PASSWORD_MAX_LENGTH: 100,
  
  // Name fields
  NAME_MIN_LENGTH: 2,
  NAME_MAX_LENGTH: 100,
  
  // URLs
  URL_PATTERN: /^https?:\/\/.+/,
  
  // Phone
  PHONE_PATTERN: /^\+?[1-9]\d{9,14}$/,
  
  // Campaign
  CAMPAIGN_TITLE_MIN: 5,
  CAMPAIGN_TITLE_MAX: 200,
  CAMPAIGN_DESCRIPTION_MIN: 20,
  CAMPAIGN_DESCRIPTION_MAX: 5000,
  
  // OTP
  OTP_LENGTH: 6,
  OTP_EXPIRY_MINUTES: 10,
} as const;

// ===== Image Constants =====
export const IMAGES = {
  PLACEHOLDER: {
    CAMPAIGN: 'https://placehold.co/800x600/667eea/ffffff?text=Campaign+Image',
    DEFAULT: 'https://images.unsplash.com/photo-1532629345422-7515f3d16bb6?w=800&auto=format&fit=crop&q=80',
  },
  MAX_SIZE_MB: 5,
  ALLOWED_TYPES: ['image/jpeg', 'image/png', 'image/webp'] as const,
} as const;

// ===== Local Storage Keys =====
export const STORAGE_KEYS = {
  AUTH_TOKEN: 'auth_token',
  USER_INFO: 'user_info',
  SESSION_ID: 'session_id',
  LAST_ACTIVITY: 'last_activity',
  THEME: 'theme',
} as const;

// ===== User Roles =====
export const USER_ROLES = {
  ADMIN: 'ADMIN',
  OPERATOR: 'OPERATOR',
  USER: 'USER',
} as const;

// ===== Campaign Status =====
export const CAMPAIGN_STATUS = {
  DRAFT: 'DRAFT',
  ACTIVE: 'ACTIVE',
  PAUSED: 'PAUSED',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED',
} as const;

// ===== Donation Status =====
export const DONATION_STATUS = {
  PENDING: 'PENDING',
  COMPLETED: 'COMPLETED',
  FAILED: 'FAILED',
  REFUNDED: 'REFUNDED',
} as const;

// ===== Toast Types =====
export const TOAST_TYPES = {
  SUCCESS: 'success',
  ERROR: 'error',
  INFO: 'info',
  WARNING: 'warning',
} as const;

// ===== Social Media Platforms =====
export const SOCIAL_PLATFORMS = {
  FACEBOOK: 'facebook',
  TWITTER: 'twitter',
  INSTAGRAM: 'instagram',
  YOUTUBE: 'youtube',
  LINKEDIN: 'linkedin',
} as const;

// ===== Error Messages =====
export const ERROR_MESSAGES = {
  NETWORK: 'Network error. Please check your connection.',
  UNAUTHORIZED: 'You are not authorized to perform this action.',
  SERVER_ERROR: 'Server error. Please try again later.',
  VALIDATION_FAILED: 'Please check your input and try again.',
  SESSION_EXPIRED: 'Your session has expired. Please log in again.',
  NOT_FOUND: 'The requested resource was not found.',
} as const;

// ===== Success Messages =====
export const SUCCESS_MESSAGES = {
  SAVED: 'Changes saved successfully.',
  CREATED: 'Created successfully.',
  UPDATED: 'Updated successfully.',
  DELETED: 'Deleted successfully.',
  LOGGED_IN: 'Logged in successfully.',
  LOGGED_OUT: 'Logged out successfully.',
} as const;

// ===== HTTP Status Codes =====
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  SERVER_ERROR: 500,
} as const;

// ===== Date Formats =====
export const DATE_FORMATS = {
  DISPLAY: 'MMM DD, YYYY',
  DISPLAY_WITH_TIME: 'MMM DD, YYYY HH:mm',
  ISO: 'YYYY-MM-DD',
  API: 'YYYY-MM-DDTHH:mm:ss',
} as const;

// Type exports for better type safety
export type ApiEndpoint = typeof API_ENDPOINTS;
export type UserRole = typeof USER_ROLES[keyof typeof USER_ROLES];
export type CampaignStatus = typeof CAMPAIGN_STATUS[keyof typeof CAMPAIGN_STATUS];
export type DonationStatus = typeof DONATION_STATUS[keyof typeof DONATION_STATUS];
export type ToastType = typeof TOAST_TYPES[keyof typeof TOAST_TYPES];
export type SocialPlatform = typeof SOCIAL_PLATFORMS[keyof typeof SOCIAL_PLATFORMS];
