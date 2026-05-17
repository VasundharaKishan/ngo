package com.myfoundation.school.contact;

import com.myfoundation.school.FoundationApplication;
import com.myfoundation.school.TestMailConfig;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import static org.hamcrest.Matchers.*;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * Integration tests for the public contact-form endpoints.
 *
 * <p>Turnstile is disabled in the test profile (no secret key configured),
 * so CAPTCHA verification is automatically bypassed.</p>
 */
@SpringBootTest(classes = {FoundationApplication.class, TestMailConfig.class})
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Import(TestMailConfig.class)
@Transactional
@TestPropertySource(properties = {
        "spring.sql.init.mode=never",
        "spring.jpa.hibernate.ddl-auto=create-drop",
        "app.frontend.url=http://localhost:5173",
        "app.jwt.secret=0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef",
        "app.jwt.expiration-minutes=60"
})
class PublicContactControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ContactSubmissionRepository repository;

    @BeforeEach
    void cleanUp() {
        repository.deleteAll();
    }

    // ===================== POST /api/public/contact =====================

    @Test
    void submit_validRequest_returns200() throws Exception {
        mockMvc.perform(post("/api/public/contact")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "name": "Priya Sharma",
                                  "email": "priya@example.com",
                                  "subject": "Volunteering",
                                  "message": "I want to volunteer for the education programme in our district.",
                                  "turnstileToken": "test-token"
                                }
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.message", containsString("Thank you")));
    }

    @Test
    void submit_persists_in_database() throws Exception {
        mockMvc.perform(post("/api/public/contact")
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                        {
                          "name": "Priya Sharma",
                          "email": "priya@example.com",
                          "subject": "Volunteering",
                          "message": "I want to volunteer for the education programme in our district.",
                          "turnstileToken": "test-token"
                        }
                        """));

        var rows = repository.findAllByOrderByCreatedAtDesc();
        org.junit.jupiter.api.Assertions.assertEquals(1, rows.size());
        org.junit.jupiter.api.Assertions.assertEquals("NEW", rows.get(0).getStatus());
        org.junit.jupiter.api.Assertions.assertEquals("priya@example.com", rows.get(0).getEmail());
    }

    @Test
    void submit_missingName_returns400() throws Exception {
        mockMvc.perform(post("/api/public/contact")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "name": "",
                                  "email": "priya@example.com",
                                  "subject": "Test",
                                  "message": "A message long enough to meet the twenty character minimum requirement.",
                                  "turnstileToken": "test-token"
                                }
                                """))
                .andExpect(status().isBadRequest());
    }

    @Test
    void submit_invalidEmail_returns400() throws Exception {
        mockMvc.perform(post("/api/public/contact")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "name": "Ravi",
                                  "email": "not-an-email",
                                  "subject": "Test",
                                  "message": "A message long enough to meet the twenty character minimum requirement.",
                                  "turnstileToken": "test-token"
                                }
                                """))
                .andExpect(status().isBadRequest());
    }

    @Test
    void submit_messageTooShort_returns400() throws Exception {
        mockMvc.perform(post("/api/public/contact")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "name": "Ravi",
                                  "email": "ravi@example.com",
                                  "subject": "Test",
                                  "message": "Too short",
                                  "turnstileToken": "test-token"
                                }
                                """))
                .andExpect(status().isBadRequest());
    }

    @Test
    void submit_missingTurnstileToken_returns400() throws Exception {
        mockMvc.perform(post("/api/public/contact")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "name": "Ravi",
                                  "email": "ravi@example.com",
                                  "subject": "Test",
                                  "message": "A message long enough to meet the twenty character minimum requirement.",
                                  "turnstileToken": ""
                                }
                                """))
                .andExpect(status().isBadRequest());
    }

    @Test
    void submit_floodProtection_sixthSubmissionRejected() throws Exception {
        String body = """
                {
                  "name": "Flood Tester",
                  "email": "flood@example.com",
                  "subject": "Testing flood",
                  "message": "A message long enough to meet the twenty character minimum requirement.",
                  "turnstileToken": "test-token"
                }
                """;

        // First 5 should succeed
        for (int i = 0; i < 5; i++) {
            mockMvc.perform(post("/api/public/contact")
                            .with(csrf())
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(body))
                    .andExpect(status().isOk());
        }

        // 6th from same IP should be rate-limited
        mockMvc.perform(post("/api/public/contact")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().is(429))
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.message", containsString("Too many")));
    }

    // ===================== GET /api/public/contact/captcha-config =====================

    @Test
    void captchaConfig_returns200WithFields() throws Exception {
        mockMvc.perform(get("/api/public/contact/captcha-config"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.enabled").isBoolean())
                .andExpect(jsonPath("$.siteKey").isString());
    }

    @Test
    void captchaConfig_disabledInTestProfile() throws Exception {
        // No Turnstile secret configured in test profile → disabled
        mockMvc.perform(get("/api/public/contact/captcha-config"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.enabled").value(false));
    }
}
