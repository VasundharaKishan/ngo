package com.myfoundation.school.exception;

/**
 * Exception thrown when a business rule is violated.
 * Results in HTTP 422 Unprocessable Entity response.
 */
public class BusinessException extends RuntimeException {
    
    private final String errorCode;
    
    public BusinessException(String message) {
        super(message);
        this.errorCode = null;
    }
    
    public BusinessException(String message, String errorCode) {
        super(message);
        this.errorCode = errorCode;
    }
    
    public BusinessException(String message, Throwable cause) {
        super(message, cause);
        this.errorCode = null;
    }
    
    public String getErrorCode() {
        return errorCode;
    }
}
