package com.myfoundation.school.security;

import com.myfoundation.school.FoundationApplication;
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
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import com.myfoundation.school.TestMailConfig;

import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
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
class SecurityIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private AdminUserRepository adminUserRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtService jwtService;

    @BeforeEach
    void setup() {
        adminUserRepository.deleteAll();
        AdminUser admin = AdminUser.builder()
                .username("secure-admin")
                .email("admin@example.com")
                .password(passwordEncoder.encode("Str0ngP@ss!"))
                .fullName("Security Admin")
                .role(UserRole.ADMIN)
                .active(true)
                .build();
        adminUserRepository.save(admin);
    }

    @Test
    void adminEndpointsRequireAuthentication() throws Exception {
        mockMvc.perform(get("/api/admin/campaigns"))
                .andExpect(result -> {
                    int status = result.getResponse().getStatus();
                    assertTrue(status == 401 || status == 403,
                            "Expected 401/403 when unauthenticated, got " + status);
                });
    }

    @Test
    void adminEndpointsAcceptValidJwt() throws Exception {
        AdminUser admin = adminUserRepository.findByUsername("secure-admin").orElseThrow();
        String token = jwtService.generateToken(admin);

        mockMvc.perform(get("/api/admin/campaigns")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + token))
                .andExpect(status().isOk());
    }

    @Test
    void stripeWebhookRejectsInvalidSignature() throws Exception {
        mockMvc.perform(post("/api/donations/stripe/webhook")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}")
                        .header("Stripe-Signature", "bad-signature"))
                .andExpect(status().isBadRequest());
    }
}
