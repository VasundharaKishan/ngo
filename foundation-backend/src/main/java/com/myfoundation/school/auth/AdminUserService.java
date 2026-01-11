package com.myfoundation.school.auth;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class AdminUserService {
    
    private final AdminUserRepository adminUserRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthService authService;
    private final PasswordSetupTokenRepository tokenRepository;
    
    public List<AdminUser> getAllUsers() {
        return adminUserRepository.findAll();
    }
    
    @Transactional
    public AdminUser createUser(CreateUserRequest request) {
        return authService.createUser(request);
    }
    
    @Transactional
    public AdminUser updateUserStatus(String id, boolean active) {
        AdminUser user = adminUserRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found"));
        
        // Prevent disabling the super admin
        if (user.getUsername().equalsIgnoreCase("admin") && !active) {
            throw new RuntimeException("Cannot deactivate the super admin user");
        }
        
        user.setActive(active);
        user.setUpdatedAt(Instant.now());
        return adminUserRepository.save(user);
    }
    
    @Transactional
    public void changeUserPassword(String id, String newPassword) {
        AdminUser user = adminUserRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found"));
        
        user.setPassword(passwordEncoder.encode(newPassword));
        user.setUpdatedAt(Instant.now());
        adminUserRepository.save(user);
        
        log.info("Password changed for user: {}", user.getUsername());
    }
    
    @Transactional
    public void deleteUser(String id, String actingUsername) {
        AdminUser target = adminUserRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found"));

        AdminUser actor = adminUserRepository.findByUsernameIgnoreCase(actingUsername)
                .orElseThrow(() -> new RuntimeException("Acting user not found"));

        boolean actorIsSuperAdmin = actor.getUsername().equalsIgnoreCase("admin");

        if (target.getUsername().equalsIgnoreCase("admin")) {
            throw new RuntimeException("Cannot delete the super admin user");
        }
        if (actor.getId().equals(target.getId())) {
            throw new RuntimeException("You cannot delete your own account");
        }
        if (target.getRole() == UserRole.ADMIN && !actorIsSuperAdmin) {
            throw new RuntimeException("Only the super admin can delete other admins");
        }

        // Delete associated password setup tokens first to avoid foreign key constraint violation
        tokenRepository.deleteByUserId(target.getId());
        log.info("Deleted password setup tokens for user: {}", target.getUsername());

        adminUserRepository.delete(target);
        log.info("Deleted user: {} by {}", target.getUsername(), actor.getUsername());
    }
}
