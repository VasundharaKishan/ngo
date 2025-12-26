package com.myfoundation.school.admin;

import com.myfoundation.school.auth.AdminUser;
import com.myfoundation.school.auth.AdminUserService;
import com.myfoundation.school.auth.CreateUserRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin/users")
@RequiredArgsConstructor
@Slf4j
public class AdminUserController {
    
    private final AdminUserService adminUserService;
    
    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<AdminUser>> getAllUsers(Authentication authentication) {
        String currentUsername = authentication.getName();
        log.info("Admin {} fetching all users", currentUsername);
        List<AdminUser> users = adminUserService.getAllUsers();
        // Remove passwords from response
        users.forEach(user -> user.setPassword(null));
        return ResponseEntity.ok(users);
    }
    
    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> createUser(@Valid @RequestBody CreateUserRequest request, Authentication authentication) {
        try {
            String currentUsername = authentication.getName();
            log.info("Admin {} creating new user: {}", currentUsername, request.getUsername());
            AdminUser user = adminUserService.createUser(request);
            user.setPassword(null);
            return ResponseEntity.status(HttpStatus.CREATED).body(user);
        } catch (RuntimeException e) {
            log.error("User creation failed: {}", e.getMessage());
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
    
    @PatchMapping("/{id}/status")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> toggleUserStatus(@PathVariable String id, @RequestBody Map<String, Boolean> request, Authentication authentication) {
        try {
            String currentUsername = authentication.getName();
            log.info("Admin {} toggling status for user: {}", currentUsername, id);
            Boolean active = request.get("active");
            if (active == null) {
                return ResponseEntity.badRequest().body(Map.of("error", "active field is required"));
            }
            AdminUser user = adminUserService.updateUserStatus(id, active);
            user.setPassword(null);
            return ResponseEntity.ok(user);
        } catch (RuntimeException e) {
            log.error("Status update failed: {}", e.getMessage());
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
    
    @PatchMapping("/{id}/password")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> changeUserPassword(@PathVariable String id, @RequestBody Map<String, String> request, Authentication authentication) {
        try {
            String currentUsername = authentication.getName();
            log.info("Admin {} changing password for user: {}", currentUsername, id);
            String newPassword = request.get("newPassword");
            if (newPassword == null || newPassword.length() < 8) {
                return ResponseEntity.badRequest().body(Map.of("error", "Password must be at least 8 characters"));
            }
            adminUserService.changeUserPassword(id, newPassword);
            return ResponseEntity.ok(Map.of("message", "Password changed successfully"));
        } catch (RuntimeException e) {
            log.error("Password change failed: {}", e.getMessage());
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
    
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> deleteUser(@PathVariable String id, Authentication authentication) {
        try {
            String currentUsername = authentication.getName();
            log.info("Admin {} deleting user: {}", currentUsername, id);
            adminUserService.deleteUser(id, currentUsername);
            return ResponseEntity.noContent().build();
        } catch (RuntimeException e) {
            log.error("User deletion failed: {}", e.getMessage());
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}
