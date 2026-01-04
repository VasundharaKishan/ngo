package com.myfoundation.school.campaign;

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
class CategoryControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private CategoryRepository categoryRepository;

    @BeforeEach
    void setUp() {
        categoryRepository.deleteAll();
    }

    @Test
    void getAllCategories() throws Exception {
        Category cat = Category.builder()
                .name("Education")
                .slug("education")
                .icon("📚")
                .color("#FF5733")
                .active(true)
                .displayOrder(1)
                .build();
        categoryRepository.save(cat);

        mockMvc.perform(get("/api/categories"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].name", is("Education")));
    }

    @Test
    void getCategoryBySlug() throws Exception {
        Category cat = Category.builder()
                .name("Health")
                .slug("health")
                .icon("⚕️")
                .color("#28A745")
                .active(true)
                .displayOrder(1)
                .build();
        categoryRepository.save(cat);

        mockMvc.perform(get("/api/categories/health"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name", is("Health")));
    }
}
