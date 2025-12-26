package com.myfoundation.school.admin;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.myfoundation.school.auth.*;
import com.myfoundation.school.security.JwtService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;

import static org.hamcrest.Matchers.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
class AdminUserControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private AdminUserRepository adminUserRepository;

    @Autowired
    private SecurityQuestionRepository securityQuestionRepository;

    @MockBean
    private EmailService emailService;

    @Autowired
    private JwtService jwtService;

    private AdminUser adminUser;
    private String adminToken;

    @BeforeEach
    void setUp() {
        // Clean up existing data
        adminUserRepository.deleteAll();
        securityQuestionRepository.deleteAll();

        // Create admin user
        adminUser = AdminUser.builder()
                .username("testadmin")
                .email("testadmin@example.com")
                .password("$2a$10$xyz") // BCrypt encoded
                .fullName("Test Admin")
                .role(UserRole.ADMIN)
                .active(true)
                .createdAt(Instant.now())
                .updatedAt(Instant.now())
                .build();
        adminUserRepository.save(adminUser);

        // Generate JWT token for admin
        adminToken = jwtService.generateToken(adminUser);

        // Initialize security questions
        for (int i = 1; i <= 10; i++) {
            SecurityQuestion sq = new SecurityQuestion();
            sq.setQuestion("Test question " + i + "?");
            sq.setActive(true);
            sq.setDisplayOrder(i);
            securityQuestionRepository.save(sq);
        }
    }

    @Test
    @WithMockUser(username = "testadmin", roles = {"ADMIN"})
    void testGetAllUsers_Success() throws Exception {
        mockMvc.perform(get("/api/admin/users")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(greaterThanOrEqualTo(1))))
                .andExpect(jsonPath("$[0].username", is("testadmin")))
                .andExpect(jsonPath("$[0].password").doesNotExist()); // Password should be removed
    }

    @Test
    void testGetAllUsers_Unauthorized() throws Exception {
        mockMvc.perform(get("/api/admin/users"))
                .andExpect(status().isForbidden());
    }

    @Test
    @WithMockUser(username = "operator", roles = {"OPERATOR"})
    void testGetAllUsers_ForbiddenForOperator() throws Exception {
        mockMvc.perform(get("/api/admin/users"))
                .andExpect(status().isForbidden());
    }

    @Test
    @WithMockUser(username = "testadmin", roles = {"ADMIN"})
    void testCreateUser_Success() throws Exception {
        CreateUserRequest request = new CreateUserRequest();
        request.setUsername("newuser");
        request.setEmail("newuser@example.com");
        request.setFullName("New User");
        request.setRole(UserRole.OPERATOR);

        // Mock email service
        doNothing().when(emailService).sendPasswordSetupEmail(
                eq("newuser@example.com"),
                eq("newuser"),
                anyString()
        );

        mockMvc.perform(post("/api/admin/users")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.username", is("newuser")))
                .andExpect(jsonPath("$.email", is("newuser@example.com")))
                .andExpect(jsonPath("$.role", is("OPERATOR")))
                .andExpect(jsonPath("$.active", is(false))) // Not active until setup completed
                .andExpect(jsonPath("$.password").doesNotExist());

        // Verify email was sent
        verify(emailService, times(1)).sendPasswordSetupEmail(
                eq("newuser@example.com"),
                eq("newuser"),
                anyString()
        );
    }

    @Test
    @WithMockUser(username = "testadmin", roles = {"ADMIN"})
    void testCreateUser_DuplicateEmail() throws Exception {
        CreateUserRequest request = new CreateUserRequest();
        request.setUsername("newuser2");
        request.setEmail("testadmin@example.com"); // Same as existing admin
        request.setFullName("New User");
        request.setRole(UserRole.OPERATOR);

        mockMvc.perform(post("/api/admin/users")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error", containsString("Email already exists")));

        // Verify email was NOT sent
        verify(emailService, never()).sendPasswordSetupEmail(anyString(), anyString(), anyString());
    }

    @Test
    @WithMockUser(username = "testadmin", roles = {"ADMIN"})
    void testCreateUser_DuplicateUsername() throws Exception {
        CreateUserRequest request = new CreateUserRequest();
        request.setUsername("testadmin"); // Same as existing admin
        request.setEmail("newemail@example.com");
        request.setFullName("New User");
        request.setRole(UserRole.OPERATOR);

        mockMvc.perform(post("/api/admin/users")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error", containsString("Username already exists")));
    }

    @Test
    @WithMockUser(username = "testadmin", roles = {"ADMIN"})
    void testCreateUser_InvalidEmail() throws Exception {
        CreateUserRequest request = new CreateUserRequest();
        request.setUsername("newuser3");
        request.setEmail("invalid-email"); // Invalid email format
        request.setFullName("New User");
        request.setRole(UserRole.OPERATOR);

        mockMvc.perform(post("/api/admin/users")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }

    @Test
    @WithMockUser(username = "testadmin", roles = {"ADMIN"})
    void testToggleUserStatus_Success() throws Exception {
        // Create operator user
        AdminUser operator = AdminUser.builder()
                .username("operator1")
                .email("operator1@example.com")
                .password("$2a$10$xyz")
                .fullName("Operator One")
                .role(UserRole.OPERATOR)
                .active(true)
                .createdAt(Instant.now())
                .updatedAt(Instant.now())
                .build();
        operator = adminUserRepository.save(operator);

        mockMvc.perform(patch("/api/admin/users/" + operator.getId() + "/status")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"active\": false}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.active", is(false)));
    }

    @Test
    @WithMockUser(username = "testadmin", roles = {"ADMIN"})
    void testChangeUserPassword_Success() throws Exception {
        // Create operator user
        AdminUser operator = AdminUser.builder()
                .username("operator2")
                .email("operator2@example.com")
                .password("$2a$10$oldpassword")
                .fullName("Operator Two")
                .role(UserRole.OPERATOR)
                .active(true)
                .createdAt(Instant.now())
                .updatedAt(Instant.now())
                .build();
        operator = adminUserRepository.save(operator);

        mockMvc.perform(patch("/api/admin/users/" + operator.getId() + "/password")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"newPassword\": \"newpassword123\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message", containsString("Password changed successfully")));
    }

    @Test
    @WithMockUser(username = "testadmin", roles = {"ADMIN"})
    void testDeleteUser_Success() throws Exception {
        // Create operator user
        AdminUser operator = AdminUser.builder()
                .username("operator3")
                .email("operator3@example.com")
                .password("$2a$10$xyz")
                .fullName("Operator Three")
                .role(UserRole.OPERATOR)
                .active(true)
                .createdAt(Instant.now())
                .updatedAt(Instant.now())
                .build();
        operator = adminUserRepository.save(operator);

        mockMvc.perform(delete("/api/admin/users/" + operator.getId())
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isNoContent());
    }

    @Test
    @WithMockUser(username = "testadmin", roles = {"ADMIN"})
    void testDeleteUser_CannotDeleteAdmin() throws Exception {
        mockMvc.perform(delete("/api/admin/users/" + adminUser.getId())
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error", containsString("cannot delete your own")));
    }
}
