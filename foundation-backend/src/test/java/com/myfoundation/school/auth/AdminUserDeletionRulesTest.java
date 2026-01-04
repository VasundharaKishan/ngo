package com.myfoundation.school.auth;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;
import com.myfoundation.school.TestMailConfig;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

@SpringBootTest(classes = {com.myfoundation.school.FoundationApplication.class, TestMailConfig.class})
@ActiveProfiles("test")
@Transactional
class AdminUserDeletionRulesTest {

    @Autowired
    private AdminUserRepository adminUserRepository;

    @Autowired
    private AuthService authService;

    @Autowired
    private PasswordEncoder passwordEncoder;

    private AdminUser superAdmin;
    private AdminUser anotherAdmin;
    private AdminUser thirdAdmin;
    private AdminUser operator;

    @BeforeEach
    void setup() {
        // Clear all existing admin users
        adminUserRepository.deleteAll();
        adminUserRepository.flush();

        // Note: The default admin MUST be named "admin" as per the service logic
        superAdmin = adminUserRepository.save(AdminUser.builder()
                .username("admin")  // Must be "admin" for service checks
                .email("admin@test.org")
                .password(passwordEncoder.encode("Passw0rd!"))
                .fullName("Default Admin")
                .role(UserRole.ADMIN)
                .active(true)
                .build());

        anotherAdmin = adminUserRepository.save(AdminUser.builder()
                .username("teamadmin")
                .email("teamadmin@test.org")
                .password(passwordEncoder.encode("Passw0rd!"))
                .fullName("Team Admin")
                .role(UserRole.ADMIN)
                .active(true)
                .build());

        thirdAdmin = adminUserRepository.save(AdminUser.builder()
                .username("teamadmin2")
                .email("teamadmin2@test.org")
                .password(passwordEncoder.encode("Passw0rd!"))
                .fullName("Team Admin Two")
                .role(UserRole.ADMIN)
                .active(true)
                .build());

        operator = adminUserRepository.save(AdminUser.builder()
                .username("operator1")
                .email("op@test.org")
                .password(passwordEncoder.encode("Passw0rd!"))
                .fullName("Operator One")
                .role(UserRole.OPERATOR)
                .active(true)
                .build());
    }

    @Test
    void defaultAdminCannotBeDeleted() {
        // Trying to delete the default admin should fail
        assertThatThrownBy(() -> authService.deleteUser(superAdmin.getId(), "teamadmin"))
                .hasMessageContaining("Cannot delete the default admin");
    }

    @Test
    void nonSuperAdminCannotDeleteAdmins() {
        assertThatThrownBy(() -> authService.deleteUser(thirdAdmin.getId(), "teamadmin"))
                .hasMessageContaining("Only the default admin can delete other admins");
    }

    @Test
    void superAdminCanDeleteOtherAdmins() {
        authService.deleteUser(anotherAdmin.getId(), "admin");
        assertThat(adminUserRepository.existsById(anotherAdmin.getId())).isFalse();
    }

    @Test
    void superAdminCanDeleteOperators() {
        authService.deleteUser(operator.getId(), "admin");
        assertThat(adminUserRepository.existsById(operator.getId())).isFalse();
    }

    @Test
    void userCannotDeleteSelf() {
        assertThatThrownBy(() -> authService.deleteUser(operator.getId(), "operator1"))
                .hasMessageContaining("cannot delete your own");
    }
}
