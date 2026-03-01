package com.myfoundation.school.auth;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.beans.factory.annotation.Value;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Base64;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import com.myfoundation.school.audit.AuditAction;
import com.myfoundation.school.audit.AuditLogService;
import com.myfoundation.school.config.Constants;
import com.myfoundation.school.security.JwtService;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuthService {
    
    private final AdminUserRepository adminUserRepository;
    private final EmailService emailService;
    private final PasswordSetupTokenRepository tokenRepository;
    private final UserSecurityAnswerRepository securityAnswerRepository;
    private final SecurityQuestionRepository securityQuestionRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final OtpTokenRepository otpTokenRepository;
    private final AuditLogService auditLogService;

    @Value("${app.auth.otp-enabled:false}")
    private boolean otpEnabled;
    @Value("${app.auth.otp-expiration-minutes:5}")
    private long otpExpirationMinutes;
    @Value("${app.auth.otp-max-attempts:5}")
    private int otpMaxAttempts;
    @Value("${app.auth.otp-length:6}")
    private int otpLength;
    private final SecureRandom secureRandom = new SecureRandom();
    
    @Transactional
    public LoginResponse login(LoginRequest request) {
        AdminUser user = adminUserRepository.findByUsername(request.getUsername())
                .orElseThrow(() -> new RuntimeException("Invalid username or password"));
        
        if (!user.getActive()) {
            throw new RuntimeException("User account is disabled");
        }

        // Check if account is locked
        if (user.getLockedUntil() != null && user.getLockedUntil().isAfter(Instant.now())) {
            long minutesRemaining = ChronoUnit.MINUTES.between(Instant.now(), user.getLockedUntil()) + 1;
            throw new RuntimeException("Account temporarily locked. Try again in " + minutesRemaining + " minute(s).");
        }
        
        if (!passwordMatches(user, request.getPassword())) {
            int attempts = user.getFailedLoginAttempts() + 1;
            user.setFailedLoginAttempts(attempts);
            if (attempts >= Constants.Session.MAX_LOGIN_ATTEMPTS) {
                user.setLockedUntil(Instant.now().plus(Constants.Session.LOCKOUT_DURATION_MINUTES, ChronoUnit.MINUTES));
                adminUserRepository.save(user);
                log.warn("Account locked for user {} after {} failed attempts", user.getUsername(), attempts);
                auditLogService.log(AuditAction.ACCOUNT_LOCKED, "AdminUser", user.getId(), user.getUsername(), "Locked after " + attempts + " failed attempts");
                throw new RuntimeException("Too many failed login attempts. Account locked for "
                        + Constants.Session.LOCKOUT_DURATION_MINUTES + " minutes.");
            }
            adminUserRepository.save(user);
            auditLogService.log(AuditAction.LOGIN_FAILED, "AdminUser", null, request.getUsername(), "Invalid password");
            throw new RuntimeException("Invalid username or password");
        }

        // Reset lockout counters on successful authentication
        if (user.getFailedLoginAttempts() > 0 || user.getLockedUntil() != null) {
            user.setFailedLoginAttempts(0);
            user.setLockedUntil(null);
        }

        if (otpEnabled) {
            issueOtp(user);
            log.info("OTP issued for user {}", user.getUsername());
            return LoginResponse.otpRequired(user);
        }

        // Update last login
        user.setLastLoginAt(Instant.now());
        adminUserRepository.save(user);

        String token = jwtService.generateToken(user);
        log.debug("Issued JWT for user {}", user.getUsername());

        log.info("User {} logged in successfully", user.getUsername());
        auditLogService.log(AuditAction.LOGIN_SUCCESS, "AdminUser", user.getId(), user.getUsername(), null);
        return LoginResponse.withToken(user, token);
    }
    
    @Transactional
    public AdminUser createUser(CreateUserRequest request) {
        // Normalize email to lowercase to prevent case-sensitive duplicates
        String normalizedEmail = request.getEmail().toLowerCase().trim();
        request.setEmail(normalizedEmail);
        
        if (adminUserRepository.existsByUsername(request.getUsername()) ||
            adminUserRepository.existsByEmail(request.getEmail())) {
            throw new RuntimeException("A user with these details already exists");
        }
        
        // Don't set password yet - user will set it via email link
        AdminUser user = AdminUser.builder()
                .username(request.getUsername())
                .email(request.getEmail())
                .password("") // Temporary - will be set via email
                .fullName(request.getFullName())
                .role(request.getRole())
                .active(false) // User must complete setup first
                .createdAt(Instant.now())
                .updatedAt(Instant.now())
                .build();
        
        AdminUser savedUser = adminUserRepository.save(user);
        
        // Generate password setup token and send email
        String token = generatePasswordSetupToken(savedUser);
        emailService.sendPasswordSetupEmail(savedUser.getEmail(), savedUser.getUsername(), token);
        
        log.info("Created new user: {} with role: {} - Password setup email sent", savedUser.getUsername(), savedUser.getRole());
        auditLogService.log(AuditAction.USER_CREATED, "AdminUser", savedUser.getId(), savedUser.getUsername(), "Role: " + savedUser.getRole());
        return savedUser;
    }
    
    private String generatePasswordSetupToken(AdminUser user) {
        // Delete any existing tokens for this user
        tokenRepository.deleteByUserId(user.getId());
        
        PasswordSetupToken tokenEntity = new PasswordSetupToken();
        tokenEntity.setToken(UUID.randomUUID().toString());
        tokenEntity.setUser(user);
        tokenEntity.setExpiresAt(Instant.now().plus(24, ChronoUnit.HOURS));
        tokenEntity.setUsed(false);
        
        PasswordSetupToken saved = tokenRepository.save(tokenEntity);
        return saved.getToken();
    }
    
    @Transactional
    public void completePasswordSetup(String token, String password, List<SecurityAnswerRequest> securityAnswers) {
        validatePasswordStrength(password);

        PasswordSetupToken tokenEntity = tokenRepository
                .findByTokenAndUsedFalseAndExpiresAtAfter(token, Instant.now())
                .orElseThrow(() -> new RuntimeException("Invalid or expired token"));
        
        AdminUser user = tokenEntity.getUser();
        
        // Set password
        user.setPassword(passwordEncoder.encode(password));
        user.setActive(true);
        user.setUpdatedAt(Instant.now());
        adminUserRepository.save(user);
        
        // Save security answers
        securityAnswerRepository.deleteByUserId(user.getId());
        for (SecurityAnswerRequest answerReq : securityAnswers) {
            SecurityQuestion question = securityQuestionRepository.findById(answerReq.getQuestionId())
                    .orElseThrow(() -> new RuntimeException("Invalid security question"));
            
            UserSecurityAnswer answer = new UserSecurityAnswer();
            answer.setUser(user);
            answer.setQuestion(question);
            answer.setAnswer(hashPassword(answerReq.getAnswer().toLowerCase().trim()));
            securityAnswerRepository.save(answer);
        }
        
        // Mark token as used
        tokenEntity.setUsed(true);
        tokenRepository.save(tokenEntity);
        
        log.info("User {} completed password setup", user.getUsername());
        auditLogService.log(AuditAction.PASSWORD_SETUP_COMPLETED, "AdminUser", user.getId(), user.getUsername(), null);
    }
    
    public AdminUser validateToken(String token) {
        PasswordSetupToken tokenEntity = tokenRepository
                .findByTokenAndUsedFalseAndExpiresAtAfter(token, Instant.now())
                .orElseThrow(() -> new RuntimeException("Invalid or expired token"));
        return tokenEntity.getUser();
    }
    
    public List<SecurityQuestion> getActiveSecurityQuestions() {
        return securityQuestionRepository.findByActiveOrderByDisplayOrder(true);
    }
    
    @Transactional
    public AdminUser updateUser(String id, CreateUserRequest request) {
        AdminUser user = adminUserRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found"));
        
        // Check username/email uniqueness (excluding current user)
        boolean usernameConflict = !user.getUsername().equals(request.getUsername()) &&
            adminUserRepository.existsByUsername(request.getUsername());
        boolean emailConflict = !user.getEmail().equals(request.getEmail()) &&
            adminUserRepository.existsByEmail(request.getEmail());
        if (usernameConflict || emailConflict) {
            throw new RuntimeException("A user with these details already exists");
        }
        
        user.setUsername(request.getUsername());
        user.setEmail(request.getEmail());
        user.setFullName(request.getFullName());
        user.setRole(request.getRole());
        user.setActive(request.getActive());
        
        // Only update password if provided
        if (request.getPassword() != null && !request.getPassword().isEmpty()) {
            validatePasswordStrength(request.getPassword());
            user.setPassword(passwordEncoder.encode(request.getPassword()));
        }
        
        user.setUpdatedAt(Instant.now());
        return adminUserRepository.save(user);
    }

    @Transactional
    public AdminUser updateUserStatus(String id, boolean active) {
        AdminUser user = adminUserRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found"));
        user.setActive(active);
        user.setUpdatedAt(Instant.now());
        return adminUserRepository.save(user);
    }
    
    @Transactional
    public void deleteUser(String id, String actingUsername) {
        AdminUser target = adminUserRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("User not found"));

        AdminUser actor = adminUserRepository.findByUsernameIgnoreCase(actingUsername)
            .orElseThrow(() -> new RuntimeException("Acting user not found"));

        boolean actorIsSuperAdmin = actor.getUsername().equalsIgnoreCase("admin");

        if (target.getUsername().equalsIgnoreCase("admin")) {
            throw new RuntimeException("Cannot delete the default admin user.");
        }
        if (actor.getId().equals(target.getId())) {
            throw new RuntimeException("You cannot delete your own account.");
        }
        if (target.getRole() == UserRole.ADMIN && !actorIsSuperAdmin) {
            throw new RuntimeException("Only the default admin can delete other admins.");
        }

        // Prevent deleting the last admin user
        if (target.getRole() == UserRole.ADMIN) {
            long adminCount = adminUserRepository.countByRole(UserRole.ADMIN);
            if (adminCount <= 1) {
                throw new RuntimeException("Cannot delete the last admin user. At least one admin must remain.");
            }
        }

        // Clean up dependent records to satisfy FK constraints
        tokenRepository.deleteByUserId(target.getId());
        otpTokenRepository.deleteByUserId(target.getId());
        securityAnswerRepository.deleteByUserId(target.getId());

        adminUserRepository.delete(target);
        log.info("Deleted user: {} by {}", target.getUsername(), actor.getUsername());
    }
    
    public List<AdminUser> getAllUsers() {
        return adminUserRepository.findAll();
    }
    
    @Transactional
    public void initializeDefaultAdmin() {
        // Guard: skip if any admin user already exists (not just the default email)
        long userCount = adminUserRepository.count();
        if (userCount > 0) {
            log.info("Admin initialization skipped - {} user(s) already exist", userCount);
            return;
        }

        // Create default admin user
        AdminUser admin = AdminUser.builder()
                .username("admin")
                .email("admin@hopefoundation.org")
                .password(passwordEncoder.encode("Admin123!"))
                .fullName("System Administrator")
                .role(UserRole.ADMIN)
                .active(true)
                .createdAt(Instant.now())
                .updatedAt(Instant.now())
                .build();

        adminUserRepository.save(admin);
        log.info("Created default admin user - disable app.allow-admin-bootstrap in production");
    }

    @Transactional
    public LoginResponse verifyOtp(OtpVerifyRequest request) {
        AdminUser user = adminUserRepository.findByUsernameIgnoreCase(request.getUsername())
                .orElseThrow(() -> new RuntimeException("Invalid username or code"));

        if (!user.isActive()) {
            throw new RuntimeException("User account is disabled");
        }

        OtpToken otpToken = otpTokenRepository
                .findTopByUserIdAndUsedFalseAndExpiresAtAfterOrderByCreatedAtDesc(user.getId(), Instant.now())
                .orElseThrow(() -> new RuntimeException("No valid code found. Please login again."));

        if (otpToken.getAttempts() >= otpMaxAttempts) {
            otpTokenRepository.delete(otpToken);
            throw new RuntimeException("Too many invalid attempts. Please login again.");
        }

        // Use BCrypt-aware matching (passwordEncoder.matches handles both BCrypt and
        // legacy SHA-256 hashes transparently via the DelegatingPasswordEncoder).
        if (!passwordEncoder.matches(request.getCode(), otpToken.getCodeHash())) {
            otpToken.setAttempts(otpToken.getAttempts() + 1);
            otpTokenRepository.save(otpToken);

            if (otpToken.getAttempts() >= otpMaxAttempts) {
                otpTokenRepository.delete(otpToken);
                throw new RuntimeException("Too many invalid attempts. Please login again.");
            }

            throw new RuntimeException("Invalid verification code");
        }

        otpToken.setUsed(true);
        otpTokenRepository.save(otpToken);

        user.setLastLoginAt(Instant.now());
        adminUserRepository.save(user);

        String token = jwtService.generateToken(user);
        log.info("User {} completed OTP verification and logged in", user.getUsername());
        return LoginResponse.withToken(user, token);
    }

    private void issueOtp(AdminUser user) {
        // Remove any existing OTPs for this user
        otpTokenRepository.deleteByUserId(user.getId());

        String code = generateNumericCode(otpLength);
        // Use BCrypt (via PasswordEncoder) for OTP storage — resistant to rainbow tables.
        String codeHash = passwordEncoder.encode(code);

        OtpToken otpToken = OtpToken.builder()
                .user(user)
                .codeHash(codeHash)
                .expiresAt(Instant.now().plus(otpExpirationMinutes, ChronoUnit.MINUTES))
                .build();
        otpTokenRepository.save(otpToken);

        emailService.sendOtpEmail(user.getEmail(), user.getUsername(), code);
    }

    private String generateNumericCode(int length) {
        StringBuilder sb = new StringBuilder();
        for (int i = 0; i < length; i++) {
            sb.append(secureRandom.nextInt(10));
        }
        return sb.toString();
    }
    
    private String hashPassword(String password) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(password.getBytes(StandardCharsets.UTF_8));
            return Base64.getEncoder().encodeToString(hash);
        } catch (NoSuchAlgorithmException e) {
            throw new RuntimeException("Error hashing password", e);
        }
    }

    /**
     * Validates password strength to ensure minimum security requirements.
     * Requirements:
     * - At least 8 characters
     * - Contains uppercase letter
     * - Contains lowercase letter
     * - Contains digit
     */
    public void validatePasswordStrength(String password) {
        if (password == null || password.trim().isEmpty()) {
            throw new IllegalArgumentException("Password cannot be empty");
        }
        
        if (password.length() < 8) {
            throw new IllegalArgumentException("Password must be at least 8 characters long");
        }
        
        boolean hasUpper = password.chars().anyMatch(Character::isUpperCase);
        boolean hasLower = password.chars().anyMatch(Character::isLowerCase);
        boolean hasDigit = password.chars().anyMatch(Character::isDigit);
        
        if (!hasUpper || !hasLower || !hasDigit) {
            throw new IllegalArgumentException(
                "Password must contain at least one uppercase letter, one lowercase letter, and one digit"
            );
        }
    }
    
    /**
     * Support legacy SHA-256 hashes while migrating users to BCrypt.
     */
    private boolean passwordMatches(AdminUser user, String rawPassword) {
        String stored = user.getPassword();

        if (stored != null && stored.startsWith("$2")) {
            return passwordEncoder.matches(rawPassword, stored);
        }

        String legacyHash = hashPassword(rawPassword);
        if (legacyHash.equals(stored)) {
            user.setPassword(passwordEncoder.encode(rawPassword));
            adminUserRepository.save(user);
            log.info("Upgraded password hash for user {}", user.getUsername());
            return true;
        }

        return false;
    }
}
