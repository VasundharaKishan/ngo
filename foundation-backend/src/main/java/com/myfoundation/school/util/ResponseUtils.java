package com.myfoundation.school.util;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import java.util.Map;

/**
 * Utility class for building standardized HTTP responses.
 * Provides consistent response patterns across controllers.
 */
public final class ResponseUtils {

    private ResponseUtils() {
        throw new UnsupportedOperationException("Utility class cannot be instantiated");
    }

    /**
     * Creates a 200 OK response with a body.
     *
     * @param body the response body
     * @param <T> the type of the body
     * @return ResponseEntity with OK status
     */
    public static <T> ResponseEntity<T> ok(T body) {
        return ResponseEntity.ok(body);
    }

    /**
     * Creates a 200 OK response without a body.
     *
     * @return ResponseEntity with OK status and no body
     */
    public static <T> ResponseEntity<T> ok() {
        return ResponseEntity.ok().build();
    }

    /**
     * Creates a 201 CREATED response with a body.
     *
     * @param body the response body
     * @param <T> the type of the body
     * @return ResponseEntity with CREATED status
     */
    public static <T> ResponseEntity<T> created(T body) {
        return ResponseEntity.status(HttpStatus.CREATED).body(body);
    }

    /**
     * Creates a 400 BAD REQUEST response with an error message.
     *
     * @param message the error message
     * @return ResponseEntity with BAD_REQUEST status
     */
    public static ResponseEntity<Map<String, String>> badRequest(String message) {
        return ResponseEntity.badRequest()
                .body(Map.of("error", message));
    }

    /**
     * Creates a 400 BAD REQUEST response without a body.
     *
     * @return ResponseEntity with BAD_REQUEST status
     */
    public static <T> ResponseEntity<T> badRequest() {
        return ResponseEntity.badRequest().build();
    }

    /**
     * Creates a 401 UNAUTHORIZED response with an error message.
     *
     * @param message the error message
     * @return ResponseEntity with UNAUTHORIZED status
     */
    public static ResponseEntity<Map<String, String>> unauthorized(String message) {
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(Map.of("error", message));
    }

    /**
     * Creates a 403 FORBIDDEN response without a body.
     *
     * @return ResponseEntity with FORBIDDEN status
     */
    public static <T> ResponseEntity<T> forbidden() {
        return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
    }

    /**
     * Creates a 403 FORBIDDEN response with an error message.
     *
     * @param message the error message
     * @return ResponseEntity with FORBIDDEN status
     */
    public static ResponseEntity<Map<String, String>> forbidden(String message) {
        return ResponseEntity.status(HttpStatus.FORBIDDEN)
                .body(Map.of("error", message));
    }

    /**
     * Creates a 404 NOT FOUND response without a body.
     *
     * @return ResponseEntity with NOT_FOUND status
     */
    public static <T> ResponseEntity<T> notFound() {
        return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
    }

    /**
     * Creates a 404 NOT FOUND response with an error message.
     *
     * @param message the error message
     * @return ResponseEntity with NOT_FOUND status
     */
    public static ResponseEntity<Map<String, String>> notFound(String message) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(Map.of("error", message));
    }

    /**
     * Creates a 500 INTERNAL SERVER ERROR response with an error message.
     *
     * @param message the error message
     * @return ResponseEntity with INTERNAL_SERVER_ERROR status
     */
    public static ResponseEntity<Map<String, String>> internalServerError(String message) {
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("error", message));
    }

    /**
     * Creates a custom status response with a body.
     *
     * @param status the HTTP status
     * @param body the response body
     * @param <T> the type of the body
     * @return ResponseEntity with the specified status
     */
    public static <T> ResponseEntity<T> status(HttpStatus status, T body) {
        return ResponseEntity.status(status).body(body);
    }

    /**
     * Creates a custom status response with an error message.
     *
     * @param status the HTTP status
     * @param message the error message
     * @return ResponseEntity with the specified status
     */
    public static ResponseEntity<Map<String, String>> error(HttpStatus status, String message) {
        return ResponseEntity.status(status)
                .body(Map.of("error", message));
    }
}
