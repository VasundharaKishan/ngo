package com.myfoundation.school.exception;

/**
 * Exception thrown when a user attempts an unauthorized action.
 * Results in HTTP 403 Forbidden response.
 */
public class UnauthorizedException extends RuntimeException {
    
    public UnauthorizedException(String message) {
        super(message);
    }
    
    public UnauthorizedException(String message, Throwable cause) {
        super(message, cause);
    }
}
