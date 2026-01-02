package com.myfoundation.school.util;

import java.util.regex.Pattern;

/**
 * Utility class for common validation operations.
 * Provides reusable validation methods for strings, emails, URLs, etc.
 */
public final class ValidationUtils {

    private ValidationUtils() {
        throw new UnsupportedOperationException("Utility class cannot be instantiated");
    }

    // Email validation pattern
    private static final Pattern EMAIL_PATTERN = Pattern.compile(
        "^[A-Za-z0-9+_.-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$"
    );

    // URL validation pattern
    private static final Pattern URL_PATTERN = Pattern.compile(
        "^(https?://)?([a-zA-Z0-9-]+\\.)+[a-zA-Z]{2,}(/.*)?$"
    );

    /**
     * Checks if a string is null or empty (after trimming).
     *
     * @param value the string to check
     * @return true if the string is null or empty/blank
     */
    public static boolean isEmpty(String value) {
        return value == null || value.trim().isEmpty();
    }

    /**
     * Checks if a string is not null and not empty (after trimming).
     *
     * @param value the string to check
     * @return true if the string is not null and not empty/blank
     */
    public static boolean isNotEmpty(String value) {
        return !isEmpty(value);
    }

    /**
     * Checks if a string is null or blank (using String.isBlank() for Java 11+).
     *
     * @param value the string to check
     * @return true if the string is null or blank
     */
    public static boolean isBlank(String value) {
        return value == null || value.isBlank();
    }

    /**
     * Checks if a string is not null and not blank.
     *
     * @param value the string to check
     * @return true if the string is not null and not blank
     */
    public static boolean isNotBlank(String value) {
        return !isBlank(value);
    }

    /**
     * Validates if a string is a valid email address.
     *
     * @param email the email string to validate
     * @return true if the email is valid
     */
    public static boolean isValidEmail(String email) {
        if (isEmpty(email)) {
            return false;
        }
        return EMAIL_PATTERN.matcher(email.trim()).matches();
    }

    /**
     * Validates if a string is a valid URL.
     *
     * @param url the URL string to validate
     * @return true if the URL is valid
     */
    public static boolean isValidUrl(String url) {
        if (isEmpty(url)) {
            return false;
        }
        return URL_PATTERN.matcher(url.trim()).matches();
    }

    /**
     * Requires that a value is not empty, throwing an exception if it is.
     *
     * @param value the value to check
     * @param fieldName the name of the field (for error message)
     * @throws IllegalArgumentException if the value is empty
     */
    public static void requireNonEmpty(String value, String fieldName) {
        if (isEmpty(value)) {
            throw new IllegalArgumentException(fieldName + " cannot be empty");
        }
    }

    /**
     * Requires that a value is not blank, throwing an exception if it is.
     *
     * @param value the value to check
     * @param fieldName the name of the field (for error message)
     * @throws IllegalArgumentException if the value is blank
     */
    public static void requireNonBlank(String value, String fieldName) {
        if (isBlank(value)) {
            throw new IllegalArgumentException(fieldName + " cannot be blank");
        }
    }

    /**
     * Gets a trimmed string or returns null if the original is empty.
     *
     * @param value the string to trim
     * @return the trimmed string, or null if empty
     */
    public static String trimOrNull(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }

    /**
     * Gets a trimmed string or returns a default value if the original is empty.
     *
     * @param value the string to trim
     * @param defaultValue the default value to return if empty
     * @return the trimmed string, or default value if empty
     */
    public static String trimOrDefault(String value, String defaultValue) {
        String trimmed = trimOrNull(value);
        return trimmed != null ? trimmed : defaultValue;
    }
}
