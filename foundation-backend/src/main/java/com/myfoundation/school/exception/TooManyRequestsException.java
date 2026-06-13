package com.myfoundation.school.exception;

/**
 * Exception thrown when a per-client rate limit is exceeded.
 * Results in HTTP 429 Too Many Requests response.
 */
public class TooManyRequestsException extends RuntimeException {

    public TooManyRequestsException(String message) {
        super(message);
    }
}
