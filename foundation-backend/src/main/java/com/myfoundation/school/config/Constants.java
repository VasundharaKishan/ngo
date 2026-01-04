package com.myfoundation.school.config;

/**
 * Application-wide constants
 */
public final class Constants {

    private Constants() {
        // Prevent instantiation
    }

    // ===== Session Management =====
    public static final class Session {
        public static final int OTP_EXPIRY_MINUTES = 10;
        public static final int OTP_LENGTH = 6;
        public static final int PASSWORD_MIN_LENGTH = 8;
        public static final int PASSWORD_MAX_LENGTH = 100;
        public static final int MAX_LOGIN_ATTEMPTS = 5;
        public static final int LOCKOUT_DURATION_MINUTES = 30;
    }

    // ===== Pagination =====
    public static final class Pagination {
        public static final int DEFAULT_PAGE = 0;
        public static final int DEFAULT_SIZE = 25;
        public static final int MAX_SIZE = 100;
        public static final String DEFAULT_SORT = "createdAt,desc";
    }

    // ===== Validation =====
    public static final class Validation {
        public static final String EMAIL_PATTERN = "^[\\w.%+-]+@[\\w.-]+\\.[A-Z]{2,}$";
        public static final String PHONE_PATTERN = "^\\+?[1-9]\\d{9,14}$";
        public static final int NAME_MIN_LENGTH = 2;
        public static final int NAME_MAX_LENGTH = 100;
        public static final int CAMPAIGN_TITLE_MIN = 5;
        public static final int CAMPAIGN_TITLE_MAX = 200;
        public static final int CAMPAIGN_DESC_MIN = 20;
        public static final int CAMPAIGN_DESC_MAX = 5000;
    }

    // ===== Currency =====
    public static final class Currency {
        public static final String DEFAULT_CURRENCY = "INR";
        public static final String CURRENCY_SYMBOL_INR = "₹";
        public static final String CURRENCY_SYMBOL_USD = "$";
        public static final String CURRENCY_SYMBOL_EUR = "€";
        public static final int MIN_DONATION_AMOUNT = 1;
        public static final int MAX_DONATION_AMOUNT = 1000000;
    }

    // ===== File Upload =====
    public static final class FileUpload {
        public static final long MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
        public static final String[] ALLOWED_IMAGE_TYPES = {"image/jpeg", "image/png", "image/webp"};
        public static final String UPLOAD_DIR = "uploads/campaigns";
    }

    // ===== Sort Orders =====
    public static final class SortOrder {
        public static final int INCREMENT = 10;
        public static final int DEFAULT_START = 10;
    }

    // ===== User Roles =====
    public static final class Roles {
        public static final String ADMIN = "ADMIN";
        public static final String OPERATOR = "OPERATOR";
        public static final String USER = "USER";
    }

    // ===== Campaign Status =====
    public static final class CampaignStatus {
        public static final String DRAFT = "DRAFT";
        public static final String ACTIVE = "ACTIVE";
        public static final String PAUSED = "PAUSED";
        public static final String COMPLETED = "COMPLETED";
        public static final String CANCELLED = "CANCELLED";
    }

    // ===== Donation Status =====
    public static final class DonationStatus {
        public static final String PENDING = "PENDING";
        public static final String COMPLETED = "COMPLETED";
        public static final String FAILED = "FAILED";
        public static final String REFUNDED = "REFUNDED";
    }

    // ===== Error Messages =====
    public static final class ErrorMessages {
        public static final String UNAUTHORIZED = "You are not authorized to perform this action";
        public static final String NOT_FOUND = "Resource not found";
        public static final String VALIDATION_FAILED = "Validation failed";
        public static final String INTERNAL_ERROR = "Internal server error occurred";
        public static final String INVALID_TOKEN = "Invalid or expired token";
        public static final String DUPLICATE_ENTRY = "A record with this value already exists";
        public static final String INVALID_CREDENTIALS = "Invalid username or password";
    }

    // ===== Success Messages =====
    public static final class SuccessMessages {
        public static final String CREATED = "Resource created successfully";
        public static final String UPDATED = "Resource updated successfully";
        public static final String DELETED = "Resource deleted successfully";
        public static final String EMAIL_SENT = "Email sent successfully";
        public static final String PASSWORD_CHANGED = "Password changed successfully";
    }

    // ===== Cache Keys =====
    public static final class CacheKeys {
        public static final String CAMPAIGNS_PUBLIC = "campaigns:public";
        public static final String CATEGORIES_PUBLIC = "categories:public";
        public static final String STATS_PUBLIC = "stats:public";
        public static final String SETTINGS_SITE = "settings:site";
        public static final String SETTINGS_FOOTER = "settings:footer";
        public static final String SETTINGS_CONTACT = "settings:contact";
        public static final int CACHE_TTL_MINUTES = 30;
    }

    // ===== API Paths =====
    public static final class ApiPaths {
        public static final String API_BASE = "/api";
        public static final String AUTH = "/auth";
        public static final String ADMIN = "/admin";
        public static final String PUBLIC = "/public";
        public static final String CAMPAIGNS = "/campaigns";
        public static final String CATEGORIES = "/categories";
        public static final String DONATIONS = "/donations";
    }

    // ===== Progress Calculation =====
    public static final class Progress {
        public static final int MAX_PERCENTAGE = 100;
        public static final int MIN_PERCENTAGE = 0;
    }

    // ===== Default Values =====
    public static final class Defaults {
        public static final boolean ACTIVE_BY_DEFAULT = true;
        public static final boolean FEATURED_BY_DEFAULT = false;
        public static final boolean URGENT_BY_DEFAULT = false;
        public static final int DEFAULT_DISPLAY_ORDER = 0;
    }
}
