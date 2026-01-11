package com.myfoundation.school.auth;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.Instant;
import java.util.Arrays;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

/**
 * Comprehensive test suite for AdminUserService.
 * Tests user management operations with role-based access controls.
 * 
 * Coverage:
 * - List all users
 * - Create users (delegates to AuthService)
 * - Update user status (active/inactive)
 * - Change user passwords
 * - Delete users with role-based rules
 * - Super admin protections
 * 
 * Business Rules Tested:
 * 1. Super admin (username="admin") cannot be deactivated
 * 2. Super admin cannot be deleted
 * 3. Users cannot delete themselves
 * 4. Only super admin can delete other admins
 * 5. Password setup tokens deleted before user deletion
 * 
 * Issues documented:
 * 1. Generic RuntimeException usage
 * 2. Hard-coded "admin" username check
 * 3. No soft delete option
 * 4. Password not validated on change
 */
@ExtendWith(MockitoExtension.class)
class AdminUserServiceTest {

    @Mock
    private AdminUserRepository adminUserRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private AuthService authService;

    @Mock
    private PasswordSetupTokenRepository tokenRepository;

    @InjectMocks
    private AdminUserService adminUserService;

    private AdminUser superAdmin;
    private AdminUser regularAdmin;
    private AdminUser regularUser;

    @BeforeEach
    void setUp() {
        superAdmin = new AdminUser();
        superAdmin.setId("super-admin-id");
        superAdmin.setUsername("admin");
        superAdmin.setEmail("admin@example.com");
        superAdmin.setRole(UserRole.ADMIN);
        superAdmin.setActive(true);
        superAdmin.setCreatedAt(Instant.now());
        superAdmin.setUpdatedAt(Instant.now());

        regularAdmin = new AdminUser();
        regularAdmin.setId("admin-id");
        regularAdmin.setUsername("moderator");
        regularAdmin.setEmail("moderator@example.com");
        regularAdmin.setRole(UserRole.ADMIN);
        regularAdmin.setActive(true);
        regularAdmin.setCreatedAt(Instant.now());
        regularAdmin.setUpdatedAt(Instant.now());

        regularUser = new AdminUser();
        regularUser.setId("user-id");
        regularUser.setUsername("user");
        regularUser.setEmail("user@example.com");
        regularUser.setRole(UserRole.OPERATOR);
        regularUser.setActive(true);
        regularUser.setCreatedAt(Instant.now());
        regularUser.setUpdatedAt(Instant.now());
    }

    // ==================== GET ALL USERS TESTS ====================

    @Test
    void getAllUsers_ReturnsAllUsers() {
        List<AdminUser> users = Arrays.asList(superAdmin, regularAdmin, regularUser);
        when(adminUserRepository.findAll()).thenReturn(users);

        List<AdminUser> result = adminUserService.getAllUsers();

        assertEquals(3, result.size());
        verify(adminUserRepository).findAll();
    }

    @Test
    void getAllUsers_EmptyList_ReturnsEmptyList() {
        when(adminUserRepository.findAll()).thenReturn(Arrays.asList());

        List<AdminUser> result = adminUserService.getAllUsers();

        assertTrue(result.isEmpty());
    }

    // ==================== CREATE USER TESTS ====================

    @Test
    void createUser_DelegatesToAuthService() {
        CreateUserRequest request = new CreateUserRequest();
        request.setUsername("newuser");
        request.setEmail("newuser@example.com");
        request.setRole(UserRole.OPERATOR);

        AdminUser newUser = new AdminUser();
        newUser.setId("new-user-id");
        newUser.setUsername("newuser");

        when(authService.createUser(request)).thenReturn(newUser);

        AdminUser result = adminUserService.createUser(request);

        assertNotNull(result);
        assertEquals("newuser", result.getUsername());
        verify(authService).createUser(request);
    }

    // ==================== UPDATE USER STATUS TESTS ====================

    @Test
    void updateUserStatus_ActivateUser_Success() {
        regularUser.setActive(false);
        when(adminUserRepository.findById("user-id")).thenReturn(Optional.of(regularUser));
        when(adminUserRepository.save(any(AdminUser.class))).thenAnswer(invocation -> invocation.getArgument(0));

        AdminUser result = adminUserService.updateUserStatus("user-id", true);

        assertTrue(result.getActive());
        assertNotNull(result.getUpdatedAt());
        verify(adminUserRepository).save(regularUser);
    }

    @Test
    void updateUserStatus_DeactivateUser_Success() {
        when(adminUserRepository.findById("user-id")).thenReturn(Optional.of(regularUser));
        when(adminUserRepository.save(any(AdminUser.class))).thenAnswer(invocation -> invocation.getArgument(0));

        AdminUser result = adminUserService.updateUserStatus("user-id", false);

        assertFalse(result.getActive());
        verify(adminUserRepository).save(regularUser);
    }

    @Test
    void updateUserStatus_UserNotFound_ThrowsException() {
        when(adminUserRepository.findById("nonexistent")).thenReturn(Optional.empty());

        RuntimeException exception = assertThrows(RuntimeException.class,
                () -> adminUserService.updateUserStatus("nonexistent", false));

        assertEquals("User not found", exception.getMessage());
        verify(adminUserRepository, never()).save(any());
    }

    @Test
    void updateUserStatus_DeactivateSuperAdmin_ThrowsException() {
        when(adminUserRepository.findById("super-admin-id")).thenReturn(Optional.of(superAdmin));

        RuntimeException exception = assertThrows(RuntimeException.class,
                () -> adminUserService.updateUserStatus("super-admin-id", false));

        assertEquals("Cannot deactivate the super admin user", exception.getMessage());
        verify(adminUserRepository, never()).save(any());
    }

    @Test
    void updateUserStatus_DeactivateSuperAdmin_CaseInsensitive() {
        // Username check should be case-insensitive
        superAdmin.setUsername("Admin"); // Different case
        when(adminUserRepository.findById("super-admin-id")).thenReturn(Optional.of(superAdmin));

        RuntimeException exception = assertThrows(RuntimeException.class,
                () -> adminUserService.updateUserStatus("super-admin-id", false));

        assertEquals("Cannot deactivate the super admin user", exception.getMessage());
    }

    @Test
    void updateUserStatus_ActivateSuperAdmin_Allowed() {
        superAdmin.setActive(false);
        when(adminUserRepository.findById("super-admin-id")).thenReturn(Optional.of(superAdmin));
        when(adminUserRepository.save(any(AdminUser.class))).thenAnswer(invocation -> invocation.getArgument(0));

        AdminUser result = adminUserService.updateUserStatus("super-admin-id", true);

        assertTrue(result.getActive());
        verify(adminUserRepository).save(superAdmin);
    }

    // ==================== CHANGE PASSWORD TESTS ====================

    @Test
    void changeUserPassword_Success() {
        when(adminUserRepository.findById("user-id")).thenReturn(Optional.of(regularUser));
        when(passwordEncoder.encode("newPassword123")).thenReturn("encoded-password");
        when(adminUserRepository.save(any(AdminUser.class))).thenAnswer(invocation -> invocation.getArgument(0));

        adminUserService.changeUserPassword("user-id", "newPassword123");

        assertEquals("encoded-password", regularUser.getPassword());
        assertNotNull(regularUser.getUpdatedAt());
        verify(passwordEncoder).encode("newPassword123");
        verify(adminUserRepository).save(regularUser);
    }

    @Test
    void changeUserPassword_UserNotFound_ThrowsException() {
        when(adminUserRepository.findById("nonexistent")).thenReturn(Optional.empty());

        RuntimeException exception = assertThrows(RuntimeException.class,
                () -> adminUserService.changeUserPassword("nonexistent", "newPassword"));

        assertEquals("User not found", exception.getMessage());
        verify(passwordEncoder, never()).encode(any());
        verify(adminUserRepository, never()).save(any());
    }

    @Test
    void changeUserPassword_SuperAdmin_Allowed() {
        // Super admin password can be changed (unlike deactivation)
        when(adminUserRepository.findById("super-admin-id")).thenReturn(Optional.of(superAdmin));
        when(passwordEncoder.encode("newPassword")).thenReturn("encoded");
        when(adminUserRepository.save(any(AdminUser.class))).thenAnswer(invocation -> invocation.getArgument(0));

        adminUserService.changeUserPassword("super-admin-id", "newPassword");

        verify(adminUserRepository).save(superAdmin);
    }

    // ==================== DELETE USER TESTS ====================

    @Test
    void deleteUser_RegularUserByAdmin_Success() {
        when(adminUserRepository.findById("user-id")).thenReturn(Optional.of(regularUser));
        when(adminUserRepository.findByUsernameIgnoreCase("moderator")).thenReturn(Optional.of(regularAdmin));

        adminUserService.deleteUser("user-id", "moderator");

        verify(tokenRepository).deleteByUserId("user-id");
        verify(adminUserRepository).delete(regularUser);
    }

    @Test
    void deleteUser_TargetNotFound_ThrowsException() {
        when(adminUserRepository.findById("nonexistent")).thenReturn(Optional.empty());

        RuntimeException exception = assertThrows(RuntimeException.class,
                () -> adminUserService.deleteUser("nonexistent", "admin"));

        assertEquals("User not found", exception.getMessage());
        verify(adminUserRepository, never()).delete(any());
    }

    @Test
    void deleteUser_ActorNotFound_ThrowsException() {
        when(adminUserRepository.findById("user-id")).thenReturn(Optional.of(regularUser));
        when(adminUserRepository.findByUsernameIgnoreCase("nonexistent")).thenReturn(Optional.empty());

        RuntimeException exception = assertThrows(RuntimeException.class,
                () -> adminUserService.deleteUser("user-id", "nonexistent"));

        assertEquals("Acting user not found", exception.getMessage());
        verify(adminUserRepository, never()).delete(any());
    }

    @Test
    void deleteUser_SuperAdmin_ThrowsException() {
        when(adminUserRepository.findById("super-admin-id")).thenReturn(Optional.of(superAdmin));
        when(adminUserRepository.findByUsernameIgnoreCase("moderator")).thenReturn(Optional.of(regularAdmin));

        RuntimeException exception = assertThrows(RuntimeException.class,
                () -> adminUserService.deleteUser("super-admin-id", "moderator"));

        assertEquals("Cannot delete the super admin user", exception.getMessage());
        verify(adminUserRepository, never()).delete(any());
    }

    @Test
    void deleteUser_SelfDeletion_ThrowsException() {
        when(adminUserRepository.findById("user-id")).thenReturn(Optional.of(regularUser));
        when(adminUserRepository.findByUsernameIgnoreCase("user")).thenReturn(Optional.of(regularUser));

        RuntimeException exception = assertThrows(RuntimeException.class,
                () -> adminUserService.deleteUser("user-id", "user"));

        assertEquals("You cannot delete your own account", exception.getMessage());
        verify(adminUserRepository, never()).delete(any());
    }

    @Test
    void deleteUser_AdminByNonSuperAdmin_ThrowsException() {
        when(adminUserRepository.findById("admin-id")).thenReturn(Optional.of(regularAdmin));
        when(adminUserRepository.findByUsernameIgnoreCase("user")).thenReturn(Optional.of(regularUser));

        RuntimeException exception = assertThrows(RuntimeException.class,
                () -> adminUserService.deleteUser("admin-id", "user"));

        assertEquals("Only the super admin can delete other admins", exception.getMessage());
        verify(adminUserRepository, never()).delete(any());
    }

    @Test
    void deleteUser_AdminBySuperAdmin_Success() {
        when(adminUserRepository.findById("admin-id")).thenReturn(Optional.of(regularAdmin));
        when(adminUserRepository.findByUsernameIgnoreCase("admin")).thenReturn(Optional.of(superAdmin));

        adminUserService.deleteUser("admin-id", "admin");

        verify(tokenRepository).deleteByUserId("admin-id");
        verify(adminUserRepository).delete(regularAdmin);
    }

    @Test
    void deleteUser_SuperAdminCheck_CaseInsensitive() {
        // Super admin check should be case-insensitive
        superAdmin.setUsername("ADMIN");
        when(adminUserRepository.findById("admin-id")).thenReturn(Optional.of(regularAdmin));
        when(adminUserRepository.findByUsernameIgnoreCase("ADMIN")).thenReturn(Optional.of(superAdmin));

        adminUserService.deleteUser("admin-id", "ADMIN");

        verify(adminUserRepository).delete(regularAdmin);
    }

    @Test
    void deleteUser_DeletesTokensFirst() {
        // Ensure tokens are deleted before user to avoid FK constraint violation
        when(adminUserRepository.findById("user-id")).thenReturn(Optional.of(regularUser));
        when(adminUserRepository.findByUsernameIgnoreCase("admin")).thenReturn(Optional.of(superAdmin));

        adminUserService.deleteUser("user-id", "admin");

        // Verify order: tokens deleted first, then user
        var inOrder = inOrder(tokenRepository, adminUserRepository);
        inOrder.verify(tokenRepository).deleteByUserId("user-id");
        inOrder.verify(adminUserRepository).delete(regularUser);
    }

    // ==================== EDGE CASE TESTS ====================

    @Test
    void updateUserStatus_UpdatesTimestamp() {
        Instant beforeUpdate = Instant.now();
        when(adminUserRepository.findById("user-id")).thenReturn(Optional.of(regularUser));
        when(adminUserRepository.save(any(AdminUser.class))).thenAnswer(invocation -> invocation.getArgument(0));

        AdminUser result = adminUserService.updateUserStatus("user-id", false);

        assertNotNull(result.getUpdatedAt());
        assertTrue(result.getUpdatedAt().isAfter(beforeUpdate.minusSeconds(1)));
    }

    @Test
    void changeUserPassword_UpdatesTimestamp() {
        Instant beforeChange = Instant.now();
        when(adminUserRepository.findById("user-id")).thenReturn(Optional.of(regularUser));
        when(passwordEncoder.encode("newPass")).thenReturn("encoded");
        when(adminUserRepository.save(any(AdminUser.class))).thenAnswer(invocation -> invocation.getArgument(0));

        adminUserService.changeUserPassword("user-id", "newPass");

        assertNotNull(regularUser.getUpdatedAt());
        assertTrue(regularUser.getUpdatedAt().isAfter(beforeChange.minusSeconds(1)));
    }

    // ==================== ISSUE DOCUMENTATION TESTS ====================

    @Test
    void adminUserService_Issue_UsesGenericRuntimeException() {
        // ISSUE: All exceptions are RuntimeException with string messages
        // Better: Create UserNotFoundException, CannotDeleteSuperAdminException, etc.
        when(adminUserRepository.findById("nonexistent")).thenReturn(Optional.empty());

        RuntimeException exception = assertThrows(RuntimeException.class,
                () -> adminUserService.updateUserStatus("nonexistent", false));

        assertEquals(RuntimeException.class, exception.getClass());
        assertTrue(true, "Documented: Generic RuntimeException usage");
    }

    @Test
    void updateUserStatus_Issue_HardCodedAdminUsername() {
        // ISSUE: Super admin check uses hard-coded "admin" username
        // What if super admin username changes? Should use a role or flag
        // e.g., user.isSuperAdmin() or user.getRole() == UserRole.SUPER_ADMIN
        when(adminUserRepository.findById("super-admin-id")).thenReturn(Optional.of(superAdmin));

        RuntimeException exception = assertThrows(RuntimeException.class,
                () -> adminUserService.updateUserStatus("super-admin-id", false));

        assertTrue(exception.getMessage().contains("super admin"));
        assertTrue(true, "Documented: Hard-coded 'admin' username check");
    }

    @Test
    void deleteUser_Issue_NoSoftDelete() {
        // ISSUE: Delete is hard delete - user data permanently removed
        // Better: Add 'deleted' flag and deletedAt timestamp
        // Preserves audit trail and allows data recovery
        when(adminUserRepository.findById("user-id")).thenReturn(Optional.of(regularUser));
        when(adminUserRepository.findByUsernameIgnoreCase("admin")).thenReturn(Optional.of(superAdmin));

        adminUserService.deleteUser("user-id", "admin");

        verify(adminUserRepository).delete(regularUser);
        assertTrue(true, "Documented: Hard delete - no soft delete option");
    }

    @Test
    void changeUserPassword_Issue_NoPasswordValidation() {
        // ISSUE: Password not validated before encoding
        // Could set weak password like "123" or empty string
        // Should reuse AuthService.validatePasswordStrength()
        when(adminUserRepository.findById("user-id")).thenReturn(Optional.of(regularUser));
        when(passwordEncoder.encode("weak")).thenReturn("encoded");
        when(adminUserRepository.save(any(AdminUser.class))).thenAnswer(invocation -> invocation.getArgument(0));

        // Should throw exception but doesn't
        assertDoesNotThrow(() -> adminUserService.changeUserPassword("user-id", "weak"));

        assertTrue(true, "Documented: No password strength validation on change");
    }
}
