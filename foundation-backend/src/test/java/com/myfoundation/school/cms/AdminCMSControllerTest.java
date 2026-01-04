package com.myfoundation.school.cms;

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

import static org.hamcrest.Matchers.*;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

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
class AdminCMSControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private AdminUserRepository adminUserRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtService jwtService;

    @Autowired
    private TestimonialRepository testimonialRepository;

    @Autowired
    private HomepageStatRepository homepageStatRepository;

    @Autowired
    private SocialMediaRepository socialMediaRepository;

    @Autowired
    private CarouselImageRepository carouselImageRepository;

    @Autowired
    private CMSContentRepository cmsContentRepository;

    private String adminJwt;

    @BeforeEach
    void setUp() {
        testimonialRepository.deleteAll();
        homepageStatRepository.deleteAll();
        socialMediaRepository.deleteAll();
        carouselImageRepository.deleteAll();
        cmsContentRepository.deleteAll();
        adminUserRepository.deleteAll();

        AdminUser admin = AdminUser.builder()
                .username("admin_cms_test")
                .email("admin@test.com")
                .fullName("Test Admin")
                .password(passwordEncoder.encode("password123"))
                .role(UserRole.ADMIN)
                .active(true)
                .createdAt(java.time.Instant.now())
                .updatedAt(java.time.Instant.now())
                .build();
        adminUserRepository.save(admin);

        adminJwt = jwtService.generateToken(admin);
    }

    // ===== Testimonials Tests (6 endpoints) =====

    @Test
    @WithMockUser(username = "admin_cms_test", roles = {"ADMIN"})
    void getAllTestimonials() throws Exception {
        testimonialRepository.save(Testimonial.builder()
                .authorName("John").authorTitle("Parent").testimonialText("Great!").displayOrder(1).active(true).build());

        mockMvc.perform(get("/api/admin/cms/testimonials").header(HttpHeaders.AUTHORIZATION, "Bearer " + adminJwt))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)));
    }

    @Test
    @WithMockUser(username = "admin_cms_test", roles = {"ADMIN"})
    void getTestimonialById() throws Exception {
        Testimonial t = testimonialRepository.save(Testimonial.builder()
                .authorName("John").authorTitle("Parent").testimonialText("Great!").displayOrder(1).active(true).build());

        mockMvc.perform(get("/api/admin/cms/testimonials/" + t.getId()).header(HttpHeaders.AUTHORIZATION, "Bearer " + adminJwt))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.authorName", is("John")));
    }

    @Test
    @WithMockUser(username = "admin_cms_test", roles = {"ADMIN"})
    void createTestimonial() throws Exception {
        mockMvc.perform(post("/api/admin/cms/testimonials")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + adminJwt)
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"authorName\":\"Jane\",\"authorTitle\":\"Teacher\",\"testimonialText\":\"Amazing!\"}"))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.authorName", is("Jane")));
    }

    @Test
    @WithMockUser(username = "admin_cms_test", roles = {"ADMIN"})
    void updateTestimonial() throws Exception {
        Testimonial t = testimonialRepository.save(Testimonial.builder()
                .authorName("John").authorTitle("Parent").testimonialText("Great!").displayOrder(1).active(true).build());

        mockMvc.perform(put("/api/admin/cms/testimonials/" + t.getId())
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + adminJwt)
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"authorName\":\"Updated\",\"authorTitle\":\"Parent\",\"testimonialText\":\"Better!\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.authorName", is("Updated")));
    }

    @Test
    @WithMockUser(username = "admin_cms_test", roles = {"ADMIN"})
    void deleteTestimonial() throws Exception {
        Testimonial t = testimonialRepository.save(Testimonial.builder()
                .authorName("John").authorTitle("Parent").testimonialText("Great!").displayOrder(1).active(true).build());

        mockMvc.perform(delete("/api/admin/cms/testimonials/" + t.getId())
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + adminJwt).with(csrf()))
                .andExpect(status().isNoContent());
    }

    // ===== Stats Tests (5 endpoints) =====

    @Test
    @WithMockUser(username = "admin_cms_test", roles = {"ADMIN"})
    void getAllStats() throws Exception {
        homepageStatRepository.save(HomepageStat.builder()
                .statLabel("Students").statValue("1000").icon("users").displayOrder(1).active(true).build());

        mockMvc.perform(get("/api/admin/cms/stats").header(HttpHeaders.AUTHORIZATION, "Bearer " + adminJwt))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)));
    }

    @Test
    @WithMockUser(username = "admin_cms_test", roles = {"ADMIN"})
    void getStatById() throws Exception {
        HomepageStat s = homepageStatRepository.save(HomepageStat.builder()
                .statLabel("Students").statValue("1000").icon("users").displayOrder(1).active(true).build());

        mockMvc.perform(get("/api/admin/cms/stats/" + s.getId()).header(HttpHeaders.AUTHORIZATION, "Bearer " + adminJwt))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.statLabel", is("Students")));
    }

    @Test
    @WithMockUser(username = "admin_cms_test", roles = {"ADMIN"})
    void createStat() throws Exception {
        mockMvc.perform(post("/api/admin/cms/stats")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + adminJwt)
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"statLabel\":\"Teachers\",\"statValue\":\"50\",\"icon\":\"teacher\"}"))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.statLabel", is("Teachers")));
    }

    @Test
    @WithMockUser(username = "admin_cms_test", roles = {"ADMIN"})
    void updateStat() throws Exception {
        HomepageStat s = homepageStatRepository.save(HomepageStat.builder()
                .statLabel("Students").statValue("1000").icon("users").displayOrder(1).active(true).build());

        mockMvc.perform(put("/api/admin/cms/stats/" + s.getId())
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + adminJwt)
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"statLabel\":\"Updated\",\"statValue\":\"1500\",\"icon\":\"users\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.statLabel", is("Updated")));
    }

    @Test
    @WithMockUser(username = "admin_cms_test", roles = {"ADMIN"})
    void deleteStat() throws Exception {
        HomepageStat s = homepageStatRepository.save(HomepageStat.builder()
                .statLabel("Students").statValue("1000").icon("users").displayOrder(1).active(true).build());

        mockMvc.perform(delete("/api/admin/cms/stats/" + s.getId())
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + adminJwt).with(csrf()))
                .andExpect(status().isNoContent());
    }

    // ===== Social Media Tests (5 endpoints) =====

    @Test
    @WithMockUser(username = "admin_cms_test", roles = {"ADMIN"})
    void getAllSocialMedia() throws Exception {
        socialMediaRepository.save(SocialMedia.builder()
                .platform("Facebook").url("https://facebook.com/test").icon("facebook").displayOrder(1).active(true).build());

        mockMvc.perform(get("/api/admin/cms/social-media").header(HttpHeaders.AUTHORIZATION, "Bearer " + adminJwt))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)));
    }

    @Test
    @WithMockUser(username = "admin_cms_test", roles = {"ADMIN"})
    void getSocialMediaById() throws Exception {
        SocialMedia sm = socialMediaRepository.save(SocialMedia.builder()
                .platform("Twitter").url("https://twitter.com/test").icon("twitter").displayOrder(1).active(true).build());

        mockMvc.perform(get("/api/admin/cms/social-media/" + sm.getId()).header(HttpHeaders.AUTHORIZATION, "Bearer " + adminJwt))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.platform", is("Twitter")));
    }

    @Test
    @WithMockUser(username = "admin_cms_test", roles = {"ADMIN"})
    void createSocialMedia() throws Exception {
        mockMvc.perform(post("/api/admin/cms/social-media")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + adminJwt)
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"platform\":\"Instagram\",\"url\":\"https://instagram.com/test\",\"icon\":\"instagram\"}"))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.platform", is("Instagram")));
    }

    @Test
    @WithMockUser(username = "admin_cms_test", roles = {"ADMIN"})
    void updateSocialMedia() throws Exception {
        SocialMedia sm = socialMediaRepository.save(SocialMedia.builder()
                .platform("Facebook").url("https://facebook.com/test").icon("facebook").displayOrder(1).active(true).build());

        mockMvc.perform(put("/api/admin/cms/social-media/" + sm.getId())
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + adminJwt)
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"platform\":\"FB Updated\",\"url\":\"https://fb.com/updated\",\"icon\":\"facebook\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.platform", is("FB Updated")));
    }

    @Test
    @WithMockUser(username = "admin_cms_test", roles = {"ADMIN"})
    void deleteSocialMedia() throws Exception {
        SocialMedia sm = socialMediaRepository.save(SocialMedia.builder()
                .platform("Facebook").url("https://facebook.com/test").icon("facebook").displayOrder(1).active(true).build());

        mockMvc.perform(delete("/api/admin/cms/social-media/" + sm.getId())
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + adminJwt).with(csrf()))
                .andExpect(status().isNoContent());
    }

    // ===== Carousel Tests (5 endpoints) =====

    @Test
    @WithMockUser(username = "admin_cms_test", roles = {"ADMIN"})
    void getAllCarouselImages() throws Exception {
        carouselImageRepository.save(CarouselImage.builder()
                .imageUrl("https://example.com/img1.jpg").altText("Image 1").displayOrder(1).active(true).build());

        mockMvc.perform(get("/api/admin/cms/carousel").header(HttpHeaders.AUTHORIZATION, "Bearer " + adminJwt))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)));
    }

    @Test
    @WithMockUser(username = "admin_cms_test", roles = {"ADMIN"})
    void getCarouselImageById() throws Exception {
        CarouselImage img = carouselImageRepository.save(CarouselImage.builder()
                .imageUrl("https://example.com/img1.jpg").altText("Image 1").displayOrder(1).active(true).build());

        mockMvc.perform(get("/api/admin/cms/carousel/" + img.getId()).header(HttpHeaders.AUTHORIZATION, "Bearer " + adminJwt))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.imageUrl", is("https://example.com/img1.jpg")));
    }

    @Test
    @WithMockUser(username = "admin_cms_test", roles = {"ADMIN"})
    void createCarouselImage() throws Exception {
        mockMvc.perform(post("/api/admin/cms/carousel")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + adminJwt)
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"imageUrl\":\"https://example.com/img2.jpg\",\"altText\":\"Image 2\"}"))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.imageUrl", is("https://example.com/img2.jpg")));
    }

    @Test
    @WithMockUser(username = "admin_cms_test", roles = {"ADMIN"})
    void updateCarouselImage() throws Exception {
        CarouselImage img = carouselImageRepository.save(CarouselImage.builder()
                .imageUrl("https://example.com/img1.jpg").altText("Image 1").displayOrder(1).active(true).build());

        mockMvc.perform(put("/api/admin/cms/carousel/" + img.getId())
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + adminJwt)
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"imageUrl\":\"https://example.com/updated.jpg\",\"altText\":\"Updated\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.imageUrl", is("https://example.com/updated.jpg")));
    }

    @Test
    @WithMockUser(username = "admin_cms_test", roles = {"ADMIN"})
    void deleteCarouselImage() throws Exception {
        CarouselImage img = carouselImageRepository.save(CarouselImage.builder()
                .imageUrl("https://example.com/img1.jpg").altText("Image 1").displayOrder(1).active(true).build());

        mockMvc.perform(delete("/api/admin/cms/carousel/" + img.getId())
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + adminJwt).with(csrf()))
                .andExpect(status().isNoContent());
    }

    // ===== CMS Content Tests (6 endpoints) =====

    @Test
    @WithMockUser(username = "admin_cms_test", roles = {"ADMIN"})
    void getAllContent() throws Exception {
        cmsContentRepository.save(CMSContent.builder()
                .section("homepage").contentKey("title").contentType("text").contentValue("Welcome").displayOrder(1).active(true).build());

        mockMvc.perform(get("/api/admin/cms/content").header(HttpHeaders.AUTHORIZATION, "Bearer " + adminJwt))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)));
    }

    @Test
    @WithMockUser(username = "admin_cms_test", roles = {"ADMIN"})
    void getContentBySection() throws Exception {
        cmsContentRepository.save(CMSContent.builder()
                .section("about").contentKey("description").contentType("text").contentValue("About us").displayOrder(1).active(true).build());

        mockMvc.perform(get("/api/admin/cms/content/section/about").header(HttpHeaders.AUTHORIZATION, "Bearer " + adminJwt))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)));
    }

    @Test
    @WithMockUser(username = "admin_cms_test", roles = {"ADMIN"})
    void getContentById() throws Exception {
        CMSContent content = cmsContentRepository.save(CMSContent.builder()
                .section("homepage").contentKey("title").contentType("text").contentValue("Welcome").displayOrder(1).active(true).build());

        mockMvc.perform(get("/api/admin/cms/content/" + content.getId()).header(HttpHeaders.AUTHORIZATION, "Bearer " + adminJwt))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.contentKey", is("title")));
    }

    @Test
    @WithMockUser(username = "admin_cms_test", roles = {"ADMIN"})
    void createContent() throws Exception {
        mockMvc.perform(post("/api/admin/cms/content")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + adminJwt)
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"section\":\"contact\",\"contentKey\":\"email\",\"contentType\":\"text\",\"contentValue\":\"contact@test.com\"}"))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.section", is("contact")));
    }

    @Test
    @WithMockUser(username = "admin_cms_test", roles = {"ADMIN"})
    void updateContent() throws Exception {
        CMSContent content = cmsContentRepository.save(CMSContent.builder()
                .section("homepage").contentKey("title").contentType("text").contentValue("Welcome").displayOrder(1).active(true).build());

        mockMvc.perform(put("/api/admin/cms/content/" + content.getId())
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + adminJwt)
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"section\":\"homepage\",\"contentKey\":\"title\",\"contentType\":\"html\",\"contentValue\":\"Updated Welcome\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.contentValue", is("Updated Welcome")));
    }

    @Test
    @WithMockUser(username = "admin_cms_test", roles = {"ADMIN"})
    void deleteContent() throws Exception {
        CMSContent content = cmsContentRepository.save(CMSContent.builder()
                .section("homepage").contentKey("title").contentType("text").contentValue("Welcome").displayOrder(1).active(true).build());

        mockMvc.perform(delete("/api/admin/cms/content/" + content.getId())
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + adminJwt).with(csrf()))
                .andExpect(status().isNoContent());
    }
}
