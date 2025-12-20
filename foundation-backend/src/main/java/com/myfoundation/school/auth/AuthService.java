package com.myfoundation.school.auth;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Base64;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuthService {
    
    private final AdminUserRepository adminUserRepository;
    private final EmailService emailService;
    private final PasswordSetupTokenRepository tokenRepository;
    private final UserSecurityAnswerRepository securityAnswerRepository;
    private final SecurityQuestionRepository securityQuestionRepository;
    
    @Transactional
    public LoginResponse login(LoginRequest request) {
        AdminUser user = adminUserRepository.findByUsername(request.getUsername())
                .orElseThrow(() -> new RuntimeException("Invalid username or password"));
        
        if (!user.getActive()) {
            throw new RuntimeException("User account is disabled");
        }
        
        String hashedPassword = hashPassword(request.getPassword());
        if (!user.getPassword().equals(hashedPassword)) {
            throw new RuntimeException("Invalid username or password");
        }
        
        // Update last login
        user.setLastLoginAt(Instant.now());
        adminUserRepository.save(user);
        
        // Generate simple token (in production, use JWT)
        String token = generateToken(user);
        
        log.info("User {} logged in successfully", user.getUsername());
        return new LoginResponse(token, user.getUsername(), user.getEmail(), user.getFullName(), user.getRole());
    }
    
    @Transactional
    public AdminUser createUser(CreateUserRequest request) {
        if (adminUserRepository.existsByUsername(request.getUsername())) {
            throw new RuntimeException("Username already exists");
        }
        
        if (adminUserRepository.existsByEmail(request.getEmail())) {
            throw new RuntimeException("Email already exists");
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
        PasswordSetupToken tokenEntity = tokenRepository
                .findByTokenAndUsedFalseAndExpiresAtAfter(token, Instant.now())
                .orElseThrow(() -> new RuntimeException("Invalid or expired token"));
        
        AdminUser user = tokenEntity.getUser();
        
        // Set password
        user.setPassword(hashPassword(password));
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
        
        // Check username uniqueness (excluding current user)
        if (!user.getUsername().equals(request.getUsername()) && 
            adminUserRepository.existsByUsername(request.getUsername())) {
            throw new RuntimeException("Username already exists");
        }
        
        // Check email uniqueness (excluding current user)
        if (!user.getEmail().equals(request.getEmail()) && 
            adminUserRepository.existsByEmail(request.getEmail())) {
            throw new RuntimeException("Email already exists");
        }
        
        user.setUsername(request.getUsername());
        user.setEmail(request.getEmail());
        user.setFullName(request.getFullName());
        user.setRole(request.getRole());
        user.setActive(request.getActive());
        
        // Only update password if provided
        if (request.getPassword() != null && !request.getPassword().isEmpty()) {
            user.setPassword(hashPassword(request.getPassword()));
        }
        
        user.setUpdatedAt(Instant.now());
        return adminUserRepository.save(user);
    }
    
    @Transactional
    public void deleteUser(String id) {
        AdminUser user = adminUserRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("User not found"));
        if (user.getUsername().equalsIgnoreCase("admin")) {
            throw new RuntimeException("Super user cannot be deleted.");
        }
        if (user.getRole() == UserRole.ADMIN) {
            throw new RuntimeException("Admin users cannot be deleted. Only operators can be deleted.");
        }
        adminUserRepository.delete(user);
        log.info("Deleted user: {}", user.getUsername());
    }
    
    public List<AdminUser> getAllUsers() {
        return adminUserRepository.findAll();
    }
    
    @Transactional
    public void initializeDefaultAdmin() {
        if (adminUserRepository.count() == 0) {
            AdminUser admin = AdminUser.builder()
                    .username("admin")
                    .email("admin@hopefoundation.org")
                    .password(hashPassword("admin123"))
                    .fullName("System Administrator")
                    .role(UserRole.ADMIN)
                    .active(true)
                    .createdAt(Instant.now())
                    .updatedAt(Instant.now())
                    .build();
            
            adminUserRepository.save(admin);
            log.info("Created default admin user");
        }
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
    
    private String generateToken(AdminUser user) {
        // Simple token generation (in production, use JWT)
        String data = user.getId() + ":" + user.getUsername() + ":" + System.currentTimeMillis();
        return Base64.getEncoder().encodeToString(data.getBytes(StandardCharsets.UTF_8));
    }
}
