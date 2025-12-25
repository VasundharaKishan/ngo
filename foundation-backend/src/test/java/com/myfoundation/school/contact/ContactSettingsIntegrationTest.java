package com.myfoundation.school.contact;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import java.util.Arrays;
import java.util.List;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * Integration tests for Contact Settings API endpoints.
 * Tests both public and admin endpoints with proper authentication.
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class ContactSettingsIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    /**
     * Test that public contact endpoint is accessible without authentication
     */
    @Test
    void testPublicContactEndpoint_NoAuth_Success() throws Exception {
        mockMvc.perform(get("/api/config/public/contact"))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.email").exists())
                .andExpect(jsonPath("$.locations").isArray());
    }

    /**
     * Test that admin endpoint requires authentication
     */
    @Test
    void testAdminContactEndpoint_NoAuth_Unauthorized() throws Exception {
        mockMvc.perform(get("/api/admin/config/contact"))
                .andExpect(status().isUnauthorized());
    }

    /**
     * Test admin GET endpoint with proper authentication
     */
    @Test
    @WithMockUser(username = "admin", authorities = {"ADMIN"})
    void testAdminGetContact_WithAuth_Success() throws Exception {
        mockMvc.perform(get("/api/admin/config/contact"))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.email").exists())
                .andExpect(jsonPath("$.locations").isArray());
    }

    /**
     * Test admin PUT endpoint updates contact information
     */
    @Test
    @WithMockUser(username = "admin", authorities = {"ADMIN"})
    void testAdminUpdateContact_WithAuth_Success() throws Exception {
        // Create request with valid data
        ContactLocation ireland = new ContactLocation();
        ireland.setLabel("Ireland");
        ireland.setLines(Arrays.asList("4 Sorrel Green", "Blessington"));
        ireland.setPostalLabel("Eircode");
        ireland.setPostalCode("W91PR6F");
        ireland.setMobile("+353 899540707");

        ContactInfoRequest request = new ContactInfoRequest();
        request.setEmail("test@example.com");
        request.setLocations(List.of(ireland));

        mockMvc.perform(put("/api/admin/config/contact")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.email").value("test@example.com"))
                .andExpect(jsonPath("$.locations[0].label").value("Ireland"))
                .andExpect(jsonPath("$.locations[0].mobile").value("+353 899540707"));
    }

    /**
     * Test validation - empty email should fail
     */
    @Test
    @WithMockUser(username = "admin", authorities = {"ADMIN"})
    void testAdminUpdateContact_EmptyEmail_BadRequest() throws Exception {
        ContactLocation location = new ContactLocation();
        location.setLabel("Test");
        location.setLines(Arrays.asList("Test Address"));
        location.setPostalLabel("ZIP");
        location.setPostalCode("12345");
        location.setMobile("+1234567890");

        ContactInfoRequest request = new ContactInfoRequest();
        request.setEmail("");  // Empty email
        request.setLocations(List.of(location));

        mockMvc.perform(put("/api/admin/config/contact")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }

    /**
     * Test validation - invalid email format should fail
     */
    @Test
    @WithMockUser(username = "admin", authorities = {"ADMIN"})
    void testAdminUpdateContact_InvalidEmail_BadRequest() throws Exception {
        ContactLocation location = new ContactLocation();
        location.setLabel("Test");
        location.setLines(Arrays.asList("Test Address"));
        location.setPostalLabel("ZIP");
        location.setPostalCode("12345");
        location.setMobile("+1234567890");

        ContactInfoRequest request = new ContactInfoRequest();
        request.setEmail("not-an-email");  // Invalid email
        request.setLocations(List.of(location));

        mockMvc.perform(put("/api/admin/config/contact")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }

    /**
     * Test validation - empty locations should fail
     */
    @Test
    @WithMockUser(username = "admin", authorities = {"ADMIN"})
    void testAdminUpdateContact_EmptyLocations_BadRequest() throws Exception {
        ContactInfoRequest request = new ContactInfoRequest();
        request.setEmail("test@example.com");
        request.setLocations(List.of());  // Empty locations

        mockMvc.perform(put("/api/admin/config/contact")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }
}
