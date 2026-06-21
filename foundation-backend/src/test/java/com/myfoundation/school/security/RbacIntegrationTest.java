package com.myfoundation.school.security;

import com.myfoundation.school.FoundationApplication;
import com.myfoundation.school.TestMailConfig;
import com.myfoundation.school.auth.AdminUser;
import com.myfoundation.school.auth.AdminUserRepository;
import com.myfoundation.school.auth.UserRole;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.HttpHeaders;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest(classes = {FoundationApplication.class, TestMailConfig.class})
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Import(TestMailConfig.class)
@TestPropertySource(properties = {
        "spring.sql.init.mode=never",
        "spring.jpa.hibernate.ddl-auto=create-drop",
        "app.frontend.url=http://localhost:5173",
        "app.jwt.secret=0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef",
        "app.jwt.expiration-minutes=60",
        "stripe.secret-key=sk_test_placeholder",
        "stripe.webhook-secret=whsec_test_secret"
})
class RbacIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private AdminUserRepository adminUserRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtService jwtService;

    private String adminToken;
    private String operatorToken;

    @BeforeEach
    void setup() {
        adminUserRepository.deleteAll();

        AdminUser admin = AdminUser.builder()
                .username("rbac-admin")
                .email("admin@rbac.test")
                .password(passwordEncoder.encode("Admin1!"))
                .fullName("RBAC Admin")
                .role(UserRole.ADMIN)
                .active(true)
                .build();
        adminUserRepository.save(admin);
        adminToken = jwtService.generateToken(admin);

        AdminUser operator = AdminUser.builder()
                .username("rbac-operator")
                .email("operator@rbac.test")
                .password(passwordEncoder.encode("Oper1!"))
                .fullName("RBAC Operator")
                .role(UserRole.OPERATOR)
                .active(true)
                .build();
        adminUserRepository.save(operator);
        operatorToken = jwtService.generateToken(operator);
    }

    // ── ADMIN-only endpoints ──

    @Test
    void adminUsersEndpoint_adminAllowed() throws Exception {
        mockMvc.perform(get("/api/admin/users")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + adminToken))
                .andExpect(status().isOk());
    }

    @Test
    void adminUsersEndpoint_operatorDenied() throws Exception {
        mockMvc.perform(get("/api/admin/users")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + operatorToken))
                .andExpect(status().isForbidden());
    }

    @Test
    void adminConfigEndpoint_adminAllowed() throws Exception {
        mockMvc.perform(get("/api/admin/config")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + adminToken))
                .andExpect(status().isOk());
    }

    @Test
    void adminConfigEndpoint_operatorDenied() throws Exception {
        mockMvc.perform(get("/api/admin/config")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + operatorToken))
                .andExpect(status().isForbidden());
    }

    // ── Shared admin endpoints (ADMIN or OPERATOR) ──

    @Test
    void adminCampaignsEndpoint_adminAllowed() throws Exception {
        mockMvc.perform(get("/api/admin/campaigns")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + adminToken))
                .andExpect(status().isOk());
    }

    @Test
    void adminCampaignsEndpoint_operatorAllowed() throws Exception {
        mockMvc.perform(get("/api/admin/campaigns")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + operatorToken))
                .andExpect(status().isOk());
    }

    // ── Unauthenticated access ──

    @Test
    void adminEndpoint_unauthenticated_denied() throws Exception {
        mockMvc.perform(get("/api/admin/users").with(csrf()))
                .andExpect(result -> {
                    int s = result.getResponse().getStatus();
                    org.junit.jupiter.api.Assertions.assertTrue(
                            s == 401 || s == 403,
                            "Expected 401/403, got " + s);
                });
    }

    // ── Public endpoints always accessible ──

    @Test
    void publicEndpoint_noAuth_allowed() throws Exception {
        mockMvc.perform(get("/api/public/config"))
                .andExpect(status().isOk());
    }
}
