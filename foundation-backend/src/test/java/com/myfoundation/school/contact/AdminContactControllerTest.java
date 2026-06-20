package com.myfoundation.school.contact;

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
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.TestPropertySource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;

import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest(classes = {FoundationApplication.class, TestMailConfig.class})
@ActiveProfiles("test")
@AutoConfigureMockMvc
@Import(TestMailConfig.class)
@Transactional
@TestPropertySource(properties = {
        "spring.sql.init.mode=never",
        "spring.jpa.hibernate.ddl-auto=create-drop",
        "app.frontend.url=http://localhost:5173",
        "app.jwt.secret=0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef",
        "app.jwt.expiration-minutes=60"
})
class AdminContactControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private AdminUserRepository adminUserRepository;

    @Autowired
    private JwtService jwtService;

    private String adminJwt;

    @BeforeEach
    void setUp() {
        adminUserRepository.deleteAll();
        
        AdminUser admin = new AdminUser();
        admin.setUsername("admin_contact");
        admin.setEmail("admin_contact@test.com");
        admin.setFullName("Contact Admin");
        admin.setRole(UserRole.ADMIN);
        admin.setActive(true);
        admin.setPassword("$2a$10$placeholder.hashed.password.for.tests.only");
        admin.setCreatedAt(Instant.now());
        admin.setUpdatedAt(Instant.now());
        adminUserRepository.save(admin);

        adminJwt = jwtService.generateToken(admin);
    }

    @Test
    @WithMockUser(username = "admin_contact", roles = {"ADMIN"})
    void getContactInfo() throws Exception {
        mockMvc.perform(get("/api/admin/config/contact")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + adminJwt))
                .andExpect(status().isOk());
    }

    @Test
    @WithMockUser(username = "admin_contact", roles = {"ADMIN"})
    void updateContactInfo() throws Exception {
        String request = """
                {
                    "email": "contact@test.com",
                    "locations": []
                }
                """;

        mockMvc.perform(put("/api/admin/config/contact")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + adminJwt)
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(request))
                .andExpect(status().isOk());
    }

    @Test
    @WithMockUser(username = "admin_contact", roles = {"ADMIN"})
    void getDonatePopupSettings() throws Exception {
        mockMvc.perform(get("/api/admin/config/donate-popup")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + adminJwt))
                .andExpect(status().isOk());
    }

    @Test
    @WithMockUser(username = "admin_contact", roles = {"ADMIN"})
    void updateDonatePopupSettings_ClearSpotlight() throws Exception {
        String request = """
                {
                    "campaignId": null
                }
                """;

        mockMvc.perform(put("/api/admin/config/donate-popup")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + adminJwt)
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(request))
                .andExpect(status().isOk());
    }
}
