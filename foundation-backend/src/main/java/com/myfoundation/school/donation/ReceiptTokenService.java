package com.myfoundation.school.donation;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jws;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Date;
import java.util.Optional;

@Service
public class ReceiptTokenService {

    private static final long TOKEN_VALIDITY_HOURS = 72;

    @Value("${app.jwt.secret}")
    private String secret;

    private SecretKey key;

    @PostConstruct
    void init() {
        this.key = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
    }

    public String generateToken(String donationId) {
        Instant now = Instant.now();
        return Jwts.builder()
                .subject(donationId)
                .claim("purpose", "receipt")
                .issuedAt(Date.from(now))
                .expiration(Date.from(now.plus(TOKEN_VALIDITY_HOURS, ChronoUnit.HOURS)))
                .signWith(key)
                .compact();
    }

    public Optional<String> validateToken(String token, String donationId) {
        try {
            Jws<Claims> claims = Jwts.parser()
                    .verifyWith(key)
                    .build()
                    .parseSignedClaims(token);
            String subject = claims.getPayload().getSubject();
            String purpose = claims.getPayload().get("purpose", String.class);
            if ("receipt".equals(purpose) && donationId.equals(subject)) {
                return Optional.of(subject);
            }
            return Optional.empty();
        } catch (Exception e) {
            return Optional.empty();
        }
    }
}
