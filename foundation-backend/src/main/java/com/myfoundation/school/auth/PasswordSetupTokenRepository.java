package com.myfoundation.school.auth;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.time.Instant;
import java.util.Optional;

@Repository
public interface PasswordSetupTokenRepository extends JpaRepository<PasswordSetupToken, String> {
    Optional<PasswordSetupToken> findByTokenAndUsedFalseAndExpiresAtAfter(String token, Instant now);
    void deleteByUserId(String userId);
}
