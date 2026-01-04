package com.myfoundation.school.hero;

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

import java.util.UUID;

import static org.hamcrest.Matchers.hasSize;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
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
class AdminHeroSlideControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private AdminUserRepository adminUserRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtService jwtService;

    @Autowired
    private HeroSlideRepository heroSlideRepository;

    private String adminJwt;

    @BeforeEach
    void setUp() {
        heroSlideRepository.deleteAll();
        adminUserRepository.deleteAll();

        AdminUser admin = AdminUser.builder()
                .username("admin_hero")
                .email("admin@hero.com")
                .fullName("Hero Admin")
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
    @WithMockUser(username = "admin_hero", roles = {"ADMIN"})
    void getAllSlides() throws Exception {
        HeroSlide slide = new HeroSlide();
        slide.setImageUrl("https://example.com/hero.jpg");
        slide.setAltText("Hero Image");
        slide.setSortOrder(1);
        slide.setEnabled(true);
        heroSlideRepository.save(slide);

        mockMvc.perform(get("/api/admin/hero-slides")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + adminJwt))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)));
    }

    @Test
    @WithMockUser(username = "admin_hero", roles = {"ADMIN"})
    void getSlideById() throws Exception {
        HeroSlide slide = new HeroSlide();
        slide.setImageUrl("https://example.com/hero.jpg");
        slide.setAltText("Hero Image");
        slide.setSortOrder(1);
        slide.setEnabled(true);
        HeroSlide saved = heroSlideRepository.save(slide);

        mockMvc.perform(get("/api/admin/hero-slides/" + saved.getId())
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + adminJwt))
                .andExpect(status().isOk());
    }

    @Test
    @WithMockUser(username = "admin_hero", roles = {"ADMIN"})
    void createSlide() throws Exception {
        String request = """
                {
                    "imageUrl": "https://example.com/new-hero.jpg",
                    "altText": "New Hero",
                    "sortOrder": 2,
                    "enabled": true
                }
                """;

        mockMvc.perform(post("/api/admin/hero-slides")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + adminJwt)
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(request))
                .andExpect(status().isCreated());
    }

    @Test
    @WithMockUser(username = "admin_hero", roles = {"ADMIN"})
    void updateSlide() throws Exception {
        HeroSlide slide = new HeroSlide();
        slide.setImageUrl("https://example.com/hero.jpg");
        slide.setAltText("Hero Image");
        slide.setSortOrder(1);
        slide.setEnabled(true);
        HeroSlide saved = heroSlideRepository.save(slide);

        String request = """
                {
                    "imageUrl": "https://example.com/updated.jpg",
                    "altText": "Updated Hero",
                    "sortOrder": 1,
                    "enabled": false
                }
                """;

        mockMvc.perform(put("/api/admin/hero-slides/" + saved.getId())
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + adminJwt)
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(request))
                .andExpect(status().isOk());
    }

    @Test
    @WithMockUser(username = "admin_hero", roles = {"ADMIN"})
    void deleteSlide() throws Exception {
        HeroSlide slide = new HeroSlide();
        slide.setImageUrl("https://example.com/hero.jpg");
        slide.setAltText("Hero Image");
        slide.setSortOrder(1);
        slide.setEnabled(true);
        HeroSlide saved = heroSlideRepository.save(slide);

        mockMvc.perform(delete("/api/admin/hero-slides/" + saved.getId())
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + adminJwt)
                        .with(csrf()))
                .andExpect(status().isNoContent());
    }

    @Test
    @WithMockUser(username = "admin_hero", roles = {"ADMIN"})
    void reorderSlides() throws Exception {
        // Test with empty array - should succeed
        String request = "[]";

        mockMvc.perform(put("/api/admin/hero-slides/reorder")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + adminJwt)
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(request))
                .andExpect(status().isOk());
    }
}
