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
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;

import static org.hamcrest.Matchers.*;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * Integration tests for the admin contact-submissions endpoints.
 *
 * <p>Covers listing (all / by status), markRead, archive, and addNote.
 * Also verifies that unauthenticated requests are rejected.</p>
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
class AdminContactSubmissionControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ContactSubmissionRepository repository;

    @Autowired
    private AdminUserRepository adminUserRepository;

    @Autowired
    private JwtService jwtService;

    private String adminJwt;

    @BeforeEach
    void setUp() {
        repository.deleteAll();
        adminUserRepository.deleteAll();

        AdminUser admin = new AdminUser();
        admin.setUsername("admin_inbox");
        admin.setEmail("admin_inbox@test.com");
        admin.setFullName("Inbox Admin");
        admin.setRole(UserRole.ADMIN);
        admin.setActive(true);
        admin.setPassword("$2a$10$placeholder.hashed.password.for.tests.only");
        admin.setCreatedAt(Instant.now());
        admin.setUpdatedAt(Instant.now());
        adminUserRepository.save(admin);

        adminJwt = jwtService.generateToken(admin);
    }

    private ContactSubmission seedSubmission(String name, String email, String status) {
        ContactSubmission row = ContactSubmission.builder()
                .name(name)
                .email(email)
                .subject("Test subject from " + name)
                .message("A sufficiently long test message for " + name)
                .clientIp("127.0.0.1")
                .status(status)
                .createdAt(Instant.now())
                .build();
        return repository.save(row);
    }

    // ===================== GET /api/admin/contact-submissions =====================

    @Test
    @WithMockUser(username = "admin_inbox", authorities = {"ADMIN"})
    void listAll_returnsAllSubmissions() throws Exception {
        seedSubmission("Aarav", "aarav@test.com", "NEW");
        seedSubmission("Bhavya", "bhavya@test.com", "READ");

        mockMvc.perform(get("/api/admin/contact-submissions")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + adminJwt))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(2)));
    }

    @Test
    @WithMockUser(username = "admin_inbox", authorities = {"ADMIN"})
    void listByStatus_filtersCorrectly() throws Exception {
        seedSubmission("Aarav", "aarav@test.com", "NEW");
        seedSubmission("Bhavya", "bhavya@test.com", "READ");
        seedSubmission("Charu", "charu@test.com", "NEW");

        mockMvc.perform(get("/api/admin/contact-submissions?status=NEW")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + adminJwt))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(2)))
                .andExpect(jsonPath("$[0].status").value("NEW"))
                .andExpect(jsonPath("$[1].status").value("NEW"));
    }

    @Test
    @WithMockUser(username = "admin_inbox", authorities = {"ADMIN"})
    void listByStatus_caseInsensitive() throws Exception {
        seedSubmission("Aarav", "aarav@test.com", "ARCHIVED");

        mockMvc.perform(get("/api/admin/contact-submissions?status=archived")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + adminJwt))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)));
    }

    @Test
    @WithMockUser(username = "admin_inbox", authorities = {"ADMIN"})
    void listAll_emptyReturnsEmptyArray() throws Exception {
        mockMvc.perform(get("/api/admin/contact-submissions")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + adminJwt))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(0)));
    }

    // ===================== POST /{id}/read =====================

    @Test
    @WithMockUser(username = "admin_inbox", authorities = {"ADMIN"})
    void markRead_updatesStatusAndTimestamp() throws Exception {
        ContactSubmission row = seedSubmission("Aarav", "aarav@test.com", "NEW");

        mockMvc.perform(post("/api/admin/contact-submissions/" + row.getId() + "/read")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + adminJwt)
                        .with(csrf()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("READ"))
                .andExpect(jsonPath("$.readAt").isNotEmpty())
                .andExpect(jsonPath("$.readBy").value("admin_inbox"));
    }

    @Test
    @WithMockUser(username = "admin_inbox", authorities = {"ADMIN"})
    void markRead_notFound_returns404() throws Exception {
        mockMvc.perform(post("/api/admin/contact-submissions/999/read")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + adminJwt)
                        .with(csrf()))
                .andExpect(status().isNotFound());
    }

    // ===================== POST /{id}/archive =====================

    @Test
    @WithMockUser(username = "admin_inbox", authorities = {"ADMIN"})
    void archive_updatesStatus() throws Exception {
        ContactSubmission row = seedSubmission("Bhavya", "bhavya@test.com", "READ");

        mockMvc.perform(post("/api/admin/contact-submissions/" + row.getId() + "/archive")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + adminJwt)
                        .with(csrf()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("ARCHIVED"));
    }

    // ===================== POST /{id}/note =====================

    @Test
    @WithMockUser(username = "admin_inbox", authorities = {"ADMIN"})
    void addNote_savesNote() throws Exception {
        ContactSubmission row = seedSubmission("Charu", "charu@test.com", "NEW");

        mockMvc.perform(post("/api/admin/contact-submissions/" + row.getId() + "/note")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + adminJwt)
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                { "note": "Will follow up on Monday" }
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.adminNote").value("Will follow up on Monday"));
    }

    @Test
    @WithMockUser(username = "admin_inbox", authorities = {"ADMIN"})
    void addNote_nullClears() throws Exception {
        ContactSubmission row = seedSubmission("Charu", "charu@test.com", "NEW");
        row.setAdminNote("Old note");
        repository.save(row);

        mockMvc.perform(post("/api/admin/contact-submissions/" + row.getId() + "/note")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + adminJwt)
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                { "note": null }
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.adminNote").doesNotExist());
    }

    @Test
    @WithMockUser(username = "admin_inbox", authorities = {"ADMIN"})
    void addNote_tooLong_returns400() throws Exception {
        ContactSubmission row = seedSubmission("Charu", "charu@test.com", "NEW");
        String longNote = "x".repeat(4001);

        mockMvc.perform(post("/api/admin/contact-submissions/" + row.getId() + "/note")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + adminJwt)
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"note\":\"" + longNote + "\"}"))
                .andExpect(status().isBadRequest());
    }

    // ===================== security =====================

    @Test
    void unauthenticated_list_returns401or403() throws Exception {
        mockMvc.perform(get("/api/admin/contact-submissions"))
                .andExpect(status().is(oneOf(401, 403)));
    }

    @Test
    void unauthenticated_markRead_returns401or403() throws Exception {
        mockMvc.perform(post("/api/admin/contact-submissions/1/read").with(csrf()))
                .andExpect(status().is(oneOf(401, 403)));
    }

    /** Helper: Hamcrest matcher for "one of these status codes". */
    @SuppressWarnings("unchecked")
    private static org.hamcrest.Matcher<Integer> oneOf(int... values) {
        org.hamcrest.Matcher<Integer>[] matchers = java.util.Arrays.stream(values)
                .mapToObj(v -> org.hamcrest.Matchers.equalTo(v))
                .toArray(org.hamcrest.Matcher[]::new);
        return anyOf(matchers);
    }
}
