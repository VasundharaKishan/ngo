package com.myfoundation.school.auth;

import com.myfoundation.school.auth.AdminUser;
import com.myfoundation.school.auth.AdminUserRepository;
import com.myfoundation.school.auth.UserRole;
import com.myfoundation.school.security.JwtService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;

import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@Transactional
class PasswordSetupControllerTest {

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
        admin.setUsername("admin_password");
        admin.setEmail("admin_password@test.com");
        admin.setFullName("Password Admin");
        admin.setRole(UserRole.ADMIN);
        admin.setActive(true);
        admin.setCreatedAt(Instant.now());
        admin.setUpdatedAt(Instant.now());
        adminUserRepository.save(admin);

        adminJwt = jwtService.generateToken(admin);
    }

    @Test
    void getSecurityQuestions() throws Exception {
        mockMvc.perform(get("/api/auth/security-questions"))
                .andExpect(status().isOk());
    }

    @Test
    void validateToken_Invalid() throws Exception {
        mockMvc.perform(get("/api/auth/validate-token/invalid-token"))
                .andExpect(status().isBadRequest());
    }

    @Test
    void setupPassword_InvalidToken() throws Exception {
        String request = """
                {
                    "password": "newpassword123",
                    "securityAnswers": []
                }
                """;

        mockMvc.perform(post("/api/auth/setup-password/invalid-token")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(request))
                .andExpect(status().isBadRequest());
    }

    @Test
    @WithMockUser(username = "admin_password", roles = {"ADMIN"})
    void createSecurityQuestion() throws Exception {
        String request = """
                {
                    "question": "What is your favorite color?",
                    "active": true,
                    "displayOrder": 1
                }
                """;

        mockMvc.perform(post("/api/auth/admin/security-questions")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + adminJwt)
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(request))
                .andExpect(status().isOk());
    }

    @Test
    @WithMockUser(username = "admin_password", roles = {"ADMIN"})
    void updateSecurityQuestion_NotFound() throws Exception {
        String request = """
                {
                    "question": "Updated question?",
                    "active": true,
                    "displayOrder": 1
                }
                """;

        mockMvc.perform(put("/api/auth/admin/security-questions/nonexistent")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + adminJwt)
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(request))
                .andExpect(status().isBadRequest());
    }

    @Test
    @WithMockUser(username = "admin_password", roles = {"ADMIN"})
    void deleteSecurityQuestion() throws Exception {
        mockMvc.perform(delete("/api/auth/admin/security-questions/someid")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + adminJwt)
                        .with(csrf()))
                .andExpect(status().isNoContent());
    }

    @Test
    @WithMockUser(username = "admin_password", roles = {"ADMIN"})
    void getAllSecurityQuestions() throws Exception {
        mockMvc.perform(get("/api/auth/admin/security-questions")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + adminJwt))
                .andExpect(status().isOk());
    }
}
