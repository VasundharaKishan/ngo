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
import org.springframework.test.annotation.DirtiesContext;

import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.cookie;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;

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
        mockMvc.perform(get("/api/admin/campaigns").with(csrf()))
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

    @Test
    void csrfEndpointRequiresAuthentication() throws Exception {
        // Unauthenticated request should fail
        mockMvc.perform(get("/api/auth/csrf"))
                .andExpect(result -> {
                    int status = result.getResponse().getStatus();
                    assertTrue(status == 401 || status == 403,
                            "Expected 401/403 when unauthenticated, got " + status);
                });
    }

    @Test
    void csrfEndpointReturnsSuccessWithValidToken() throws Exception {
        // Create authenticated request
        AdminUser admin = adminUserRepository.findByUsername("secure-admin").orElseThrow();
        String token = jwtService.generateToken(admin);

        // Authenticated request should succeed
        mockMvc.perform(get("/api/auth/csrf")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + token))
                .andExpect(status().isOk());
    }

    @Test
    void csrfEndpointSetsCsrfCookie() throws Exception {
        // Create authenticated request
        AdminUser admin = adminUserRepository.findByUsername("secure-admin").orElseThrow();
        String token = jwtService.generateToken(admin);

        // CSRF endpoint should set XSRF-TOKEN cookie
        var result = mockMvc.perform(get("/api/auth/csrf")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + token))
                .andExpect(status().isOk())
                .andReturn();
        
        // Debug: Print response cookies
        var response = result.getResponse();
        System.out.println("Response cookies: " + response.getCookies().length);
        for (var cookie : response.getCookies()) {
            System.out.println("Cookie: " + cookie.getName() + " = " + cookie.getValue());
        }
        
        // Assert cookie exists
        assertTrue(response.getCookie("XSRF-TOKEN") != null, 
            "Expected XSRF-TOKEN cookie to be set");
    }

    @Test
    void adminMutationEndpointsRequireCsrfToken() throws Exception {
        // Create authenticated request
        AdminUser admin = adminUserRepository.findByUsername("secure-admin").orElseThrow();
        String token = jwtService.generateToken(admin);

        // PUT request without CSRF token should fail (403 Forbidden)
        mockMvc.perform(put("/api/admin/campaigns/test-id")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().isForbidden());

        // DELETE request without CSRF token should fail (403 Forbidden)
        mockMvc.perform(delete("/api/admin/campaigns/test-id")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + token))
                .andExpect(status().isForbidden());
    }

    @Test
    void adminMutationEndpointsSucceedWithCsrfToken() throws Exception {
        // Create authenticated request
        AdminUser admin = adminUserRepository.findByUsername("secure-admin").orElseThrow();
        String token = jwtService.generateToken(admin);

        // PUT request with CSRF token should succeed (may return 404 if resource doesn't exist, but not 403)
        mockMvc.perform(put("/api/admin/campaigns/test-id")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}")
                        .with(csrf()))
                .andExpect(result -> {
                    int status = result.getResponse().getStatus();
                    assertTrue(status != 403,
                            "Expected success or 404, not 403 Forbidden when CSRF token present, got " + status);
                });
    }

    @Test
    void publicEndpointsDoNotRequireCsrf() throws Exception {
        // Public endpoints should work without CSRF
        mockMvc.perform(get("/api/campaigns"))
                .andExpect(status().isOk());

        mockMvc.perform(get("/api/cms/testimonials"))
                .andExpect(status().isOk());
    }

    @Test
    void loginEndpointDoesNotRequireCsrf() throws Exception {
        // Login endpoint should work without CSRF (it's explicitly excluded)
        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"username\":\"secure-admin\",\"password\":\"Str0ngP@ss!\"}"))
                .andExpect(result -> {
                    int status = result.getResponse().getStatus();
                    assertTrue(status == 200 || status == 401,
                            "Expected 200 or 401, not CSRF error, got " + status);
                });
    }
}
