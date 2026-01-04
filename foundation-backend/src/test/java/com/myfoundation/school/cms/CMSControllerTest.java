package com.myfoundation.school.cms;

import com.myfoundation.school.FoundationApplication;
import com.myfoundation.school.TestMailConfig;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest(classes = {FoundationApplication.class, TestMailConfig.class})
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Import(TestMailConfig.class)
@Transactional
@TestPropertySource(properties = {
        "spring.sql.init.mode=never",
        "spring.jpa.hibernate.ddl-auto=create-drop"
})
class CMSControllerTest {

    @Autowired
    private MockMvc mockMvc;

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

    @BeforeEach
    void setUp() {
        testimonialRepository.deleteAll();
        homepageStatRepository.deleteAll();
        socialMediaRepository.deleteAll();
        carouselImageRepository.deleteAll();
        cmsContentRepository.deleteAll();
    }

    @Test
    void getTestimonials() throws Exception {
        testimonialRepository.save(Testimonial.builder()
                .authorName("John Doe").authorTitle("Parent").testimonialText("Great!").displayOrder(1).active(true).build());

        mockMvc.perform(get("/api/cms/testimonials"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].authorName", is("John Doe")));
    }

    @Test
    void getStats() throws Exception {
        homepageStatRepository.save(HomepageStat.builder()
                .statLabel("Students").statValue("1000").icon("users").displayOrder(1).active(true).build());

        mockMvc.perform(get("/api/cms/stats"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].statLabel", is("Students")));
    }

    @Test
    void getSocialMedia() throws Exception {
        socialMediaRepository.save(SocialMedia.builder()
                .platform("Facebook").url("https://facebook.com").icon("facebook").displayOrder(1).active(true).build());

        mockMvc.perform(get("/api/cms/social-media"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].platform", is("Facebook")));
    }

    @Test
    void getCarouselImages() throws Exception {
        carouselImageRepository.save(CarouselImage.builder()
                .imageUrl("https://example.com/img.jpg").altText("Image").displayOrder(1).active(true).build());

        mockMvc.perform(get("/api/cms/carousel"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].imageUrl", is("https://example.com/img.jpg")));
    }

    @Test
    void getContentBySection() throws Exception {
        cmsContentRepository.save(CMSContent.builder()
                .section("homepage").contentKey("title").contentType("text").contentValue("Welcome").displayOrder(1).active(true).build());

        mockMvc.perform(get("/api/cms/content/homepage"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.title", is("Welcome")));
    }
}
