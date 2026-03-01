package com.myfoundation.school.security;

import com.myfoundation.school.auth.AdminUser;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.ExpiredJwtException;
import io.jsonwebtoken.Jws;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import jakarta.annotation.PostConstruct;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Date;
import java.util.Optional;

/**
 * Minimal JWT helper to issue and validate signed tokens for admin users.
 */
@Service
@Slf4j
public class JwtService {

    @Value("${app.jwt.secret}")
    private String secret;

    @Value("${app.jwt.expiration-minutes:60}")
    private long expirationMinutes;

    private SecretKey key;

    @PostConstruct
    void init() {
        byte[] secretBytes = secret.getBytes(StandardCharsets.UTF_8);
        // HMAC-SHA-256 requires at least 32 bytes (256 bits). Fail fast at startup.
        if (secretBytes.length < 32) {
            throw new IllegalStateException(
                "JWT secret is too short: " + secretBytes.length + " bytes. " +
                "Set app.jwt.secret to a random string of at least 32 characters.");
        }
        this.key = Keys.hmacShaKeyFor(secretBytes);
    }

    public String generateToken(AdminUser user) {
        Instant now = Instant.now();
        return Jwts.builder()
                .subject(user.getId())
                .claim("username", user.getUsername())
                .claim("role", user.getRole().name())
                .issuedAt(Date.from(now))
                .expiration(Date.from(now.plus(expirationMinutes, ChronoUnit.MINUTES)))
                .signWith(key)
                .compact();
    }

    public Optional<Jws<Claims>> parseToken(String token) {
        try {
            return Optional.of(Jwts.parser()
                    .verifyWith(key)
                    .build()
                    .parseSignedClaims(token));
        } catch (ExpiredJwtException ex) {
            log.warn("Expired JWT received");
            return Optional.empty();
        } catch (Exception ex) {
            log.warn("Failed to parse JWT: {}", ex.getMessage());
            return Optional.empty();
        }
    }
}
