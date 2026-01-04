package com.myfoundation.school.footer;

import com.myfoundation.school.FoundationApplication;
import com.myfoundation.school.TestMailConfig;
import com.myfoundation.school.auth.AdminUser;
import com.myfoundation.school.auth.AdminUserRepository;
import com.myfoundation.school.auth.UserRole;
import com.myfoundation.school.security.JwtService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest(classes = {FoundationApplication.class, TestMailConfig.class})
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Import(TestMailConfig.class)
@Transactional
@TestPropertySource(properties = {
        "spring.sql.init.mode=never",
        "spring.jpa.hibernate.ddl-auto=create-drop",
        "app.jwt.secret=0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef",
        "app.jwt.expiration-minutes=60"
})
class FooterConfigControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private AdminUserRepository adminUserRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtService jwtService;

    private String adminJwt;

    @BeforeEach
    void setUp() {
        adminUserRepository.deleteAll();

        AdminUser admin = AdminUser.builder()
                .username("admin_footer")
                .email("admin@footer.com")
                .fullName("Footer Admin")
                .password(passwordEncoder.encode("password123"))
                .role(UserRole.ADMIN)
                .active(true)
                .createdAt(java.time.Instant.now())
                .updatedAt(java.time.Instant.now())
                .build();
        adminUserRepository.save(admin);

        adminJwt = jwtService.generateToken(admin);
    }

    @Test
    void getPublicFooterConfig() throws Exception {
        mockMvc.perform(get("/api/config/public/footer"))
                .andExpect(status().isOk());
    }

    @Test
    @WithMockUser(username = "admin_footer", roles = {"ADMIN"})
    void getAdminFooterConfig() throws Exception {
        mockMvc.perform(get("/api/admin/config/footer")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + adminJwt))
                .andExpect(status().isOk());
    }

    @Test
    @WithMockUser(username = "admin_footer", roles = {"ADMIN"})
    void updateFooterConfig() throws Exception {
        String request = """
                {
                    "copyrightText": "© 2026 Test Foundation",
                    "email": "contact@test.org",
                    "phone": "+1-555-1234"
                }
                """;

        mockMvc.perform(put("/api/admin/config/footer")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + adminJwt)
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(request))
                .andExpect(status().isOk());
    }
}
