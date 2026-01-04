package com.myfoundation.school.admin;

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
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;

import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@Transactional
@ActiveProfiles("test")
class AdminDonationControllerTest {

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
        admin.setUsername("admin_donations");
        admin.setEmail("admin_donations@test.com");
        admin.setFullName("Donations Admin");
        admin.setRole(UserRole.ADMIN);
        admin.setActive(true);
        admin.setCreatedAt(Instant.now());
        admin.setUpdatedAt(Instant.now());
        adminUserRepository.save(admin);

        adminJwt = jwtService.generateToken(admin);
    }

    // Donation endpoints (1)
    @Test
    @WithMockUser(username = "admin_donations", roles = {"ADMIN"})
    void getAllDonations() throws Exception {
        mockMvc.perform(get("/api/admin/donations")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + adminJwt))
                .andExpect(status().isOk());
    }

    @Test
    @WithMockUser(username = "admin_donations", roles = {"ADMIN"})
    void getAllDonationsPaginated() throws Exception {
        mockMvc.perform(get("/api/admin/donations")
                        .param("page", "0")
                        .param("size", "10")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + adminJwt))
                .andExpect(status().isOk());
    }

    // Campaign CRUD endpoints (5)
    @Test
    @WithMockUser(username = "admin_donations", roles = {"ADMIN"})
    void getAllCampaigns() throws Exception {
        mockMvc.perform(get("/api/admin/campaigns")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + adminJwt))
                .andExpect(status().isOk());
    }

    @Test
    @WithMockUser(username = "admin_donations", roles = {"ADMIN"})
    void getCampaignById_NotFound() throws Exception {
        mockMvc.perform(get("/api/admin/campaigns/nonexistent")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + adminJwt))
                .andExpect(status().isNotFound());
    }

    @Test
    @WithMockUser(username = "admin_donations", roles = {"ADMIN"})
    void createCampaign_MissingCategory() throws Exception {
        String request = """
                {
                    "title": "Test Campaign",
                    "slug": "test-campaign",
                    "shortDescription": "Test desc",
                    "fullDescription": "Full desc",
                    "targetAmount": 1000,
                    "currency": "USD",
                    "categoryId": "cat123",
                    "active": true,
                    "featured": false,
                    "urgent": false
                }
                """;

        mockMvc.perform(post("/api/admin/campaigns")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + adminJwt)
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(request))
                .andExpect(status().isBadRequest());
    }

    @Test
    @WithMockUser(username = "admin_donations", roles = {"ADMIN"})
    void updateCampaign_NotFound() throws Exception {
        String request = """
                {
                    "title": "Updated Campaign",
                    "slug": "updated-campaign",
                    "shortDescription": "Updated desc",
                    "fullDescription": "Full desc",
                    "targetAmount": 2000,
                    "currency": "USD",
                    "categoryId": "cat123",
                    "active": true
                }
                """;

        mockMvc.perform(put("/api/admin/campaigns/someid")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + adminJwt)
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(request))
                .andExpect(status().isBadRequest());
    }

    @Test
    @WithMockUser(username = "admin_donations", roles = {"ADMIN"})
    void deleteCampaign_BadRequest() throws Exception {
        mockMvc.perform(delete("/api/admin/campaigns/someid")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + adminJwt)
                        .with(csrf()))
                .andExpect(status().isBadRequest());
    }

    // Category CRUD endpoints (5)
    @Test
    @WithMockUser(username = "admin_donations", roles = {"ADMIN"})
    void getAllCategories() throws Exception {
        mockMvc.perform(get("/api/admin/categories")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + adminJwt))
                .andExpect(status().isOk());
    }

    @Test
    @WithMockUser(username = "admin_donations", roles = {"ADMIN"})
    void getCategoryById_NotFound() throws Exception {
        mockMvc.perform(get("/api/admin/categories/nonexistent")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + adminJwt))
                .andExpect(status().isNotFound());
    }

    @Test
    @WithMockUser(username = "admin_donations", roles = {"ADMIN"})
    void createCategory() throws Exception {
        String request = """
                {
                    "name": "Test Category",
                    "slug": "test-category",
                    "description": "Test desc",
                    "icon": "test-icon",
                    "color": "#000000",
                    "active": true,
                    "displayOrder": 1
                }
                """;

        mockMvc.perform(post("/api/admin/categories")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + adminJwt)
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(request))
                .andExpect(status().isCreated());
    }

    @Test
    @WithMockUser(username = "admin_donations", roles = {"ADMIN"})
    void updateCategory_BadRequest() throws Exception {
        String request = """
                {
                    "name": "Updated Category",
                    "slug": "updated-category",
                    "description": "Updated desc",
                    "icon": "updated-icon",
                    "color": "#FFFFFF",
                    "active": true,
                    "displayOrder": 1
                }
                """;

        mockMvc.perform(put("/api/admin/categories/someid")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + adminJwt)
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(request))
                .andExpect(status().isBadRequest());
    }

    @Test
    @WithMockUser(username = "admin_donations", roles = {"ADMIN"})
    void deleteCategory_BadRequest() throws Exception {
        mockMvc.perform(delete("/api/admin/categories/someid")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + adminJwt)
                        .with(csrf()))
                .andExpect(status().isBadRequest());
    }

    // Site Config endpoints (3)
    @Test
    @WithMockUser(username = "admin_donations", roles = {"ADMIN"})
    void getAllConfigs() throws Exception {
        mockMvc.perform(get("/api/admin/config")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + adminJwt))
                .andExpect(status().isOk());
    }

    @Test
    @WithMockUser(username = "admin_donations", roles = {"ADMIN"})
    void updateConfig() throws Exception {
        String request = """
                {
                    "configKey": "test_key",
                    "configValue": "test_value",
                    "description": "Test config"
                }
                """;

        mockMvc.perform(post("/api/admin/config")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + adminJwt)
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(request))
                .andExpect(status().isOk());
    }

    @Test
    @WithMockUser(username = "admin_donations", roles = {"ADMIN"})
    void initializeConfigs_BadRequest() throws Exception {
        mockMvc.perform(post("/api/admin/config/initialize")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + adminJwt)
                        .with(csrf()))
                .andExpect(status().isBadRequest());
    }
}
