package com.myfoundation.school.validation;

import java.util.regex.Pattern;

/**
 * Validation utilities for common input validation
 */
public class ValidationUtils {
    
    // URL validation pattern - matches http, https URLs
    private static final Pattern URL_PATTERN = Pattern.compile(
        "^(https?://)" + // Protocol
        "([\\w-]+\\.)+[\\w-]+" + // Domain
        "(/[\\w-./?%&=]*)?$" // Path (optional)
    );
    
    // Email validation pattern - RFC 5322 simplified
    private static final Pattern EMAIL_PATTERN = Pattern.compile(
        "^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$"
    );
    
    // Phone number validation pattern - international format
    // Matches: +353 899540707, +91 9987379321, etc.
    private static final Pattern PHONE_PATTERN = Pattern.compile(
        "^\\+\\d{1,3}\\s?\\d{6,14}$"
    );
    
    /**
     * Validates if a string is a valid HTTP/HTTPS URL
     */
    public static boolean isValidUrl(String url) {
        if (url == null || url.trim().isEmpty()) {
            return false;
        }
        return URL_PATTERN.matcher(url.trim()).matches();
    }
    
    /**
     * Validates if a string is a valid email address
     */
    public static boolean isValidEmail(String email) {
        if (email == null || email.trim().isEmpty()) {
            return false;
        }
        return EMAIL_PATTERN.matcher(email.trim()).matches();
    }
    
    /**
     * Validates if a string is a valid international phone number
     */
    public static boolean isValidPhoneNumber(String phone) {
        if (phone == null || phone.trim().isEmpty()) {
            return false;
        }
        return PHONE_PATTERN.matcher(phone.trim()).matches();
    }
    
    /**
     * Validates if a string is not null or blank
     */
    public static boolean isNotBlank(String value) {
        return value != null && !value.trim().isEmpty();
    }
}
