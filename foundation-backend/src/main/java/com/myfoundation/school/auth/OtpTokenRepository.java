package com.myfoundation.school.auth;

import org.springframework.data.jpa.repository.JpaRepository;

import java.time.Instant;
import java.util.Optional;

public interface OtpTokenRepository extends JpaRepository<OtpToken, String> {
    Optional<OtpToken> findTopByUserIdAndUsedFalseAndExpiresAtAfterOrderByCreatedAtDesc(String userId, Instant now);
    void deleteByUserId(String userId);
}
