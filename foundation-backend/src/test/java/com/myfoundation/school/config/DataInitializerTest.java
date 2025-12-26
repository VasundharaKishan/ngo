package com.myfoundation.school.config;

import com.myfoundation.school.auth.SecurityQuestion;
import com.myfoundation.school.auth.SecurityQuestionRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.TestPropertySource;
import org.springframework.transaction.annotation.Transactional;
import com.myfoundation.school.TestMailConfig;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest(classes = {com.myfoundation.school.FoundationApplication.class, TestMailConfig.class})
@ActiveProfiles("test")
@TestPropertySource(properties = "data.init.enabled=true")
@Transactional
class DataInitializerTest {

    @Autowired
    private SecurityQuestionRepository securityQuestionRepository;

    @Autowired
    private DataInitializer dataInitializer;

    @BeforeEach
    void setUp() {
        securityQuestionRepository.deleteAll();
    }

    @Test
    void testSecurityQuestionsInitialization() throws Exception {
        // Run initializer
        dataInitializer.run();

        // Verify 10 questions were created
        List<SecurityQuestion> questions = securityQuestionRepository.findAll();
        assertThat(questions).hasSize(10);

        // Verify all are active
        assertThat(questions).allMatch(SecurityQuestion::isActive);

        // Verify display order
        assertThat(questions).extracting(SecurityQuestion::getDisplayOrder)
                .containsExactlyInAnyOrder(1, 2, 3, 4, 5, 6, 7, 8, 9, 10);

        // Verify some expected questions
        List<String> questionTexts = questions.stream()
                .map(SecurityQuestion::getQuestion)
                .toList();
        
        assertThat(questionTexts).contains(
                "What was the name of your first pet?",
                "What city were you born in?",
                "What is your mother's maiden name?",
                "What was the name of your elementary school?",
                "What is your favorite book?"
        );
    }

    @Test
    void testSecurityQuestionsInitialization_DoesNotDuplicate() throws Exception {
        // Run initializer first time
        dataInitializer.run();
        
        List<SecurityQuestion> firstRun = securityQuestionRepository.findAll();
        assertThat(firstRun).hasSize(10);

        // Run initializer second time
        dataInitializer.run();
        
        // Should still be 10 (no duplicates)
        List<SecurityQuestion> secondRun = securityQuestionRepository.findAll();
        assertThat(secondRun).hasSize(10);
    }

    @Test
    void testSecurityQuestionsAreUnique() throws Exception {
        dataInitializer.run();

        List<SecurityQuestion> questions = securityQuestionRepository.findAll();
        
        // Extract all question texts
        List<String> questionTexts = questions.stream()
                .map(SecurityQuestion::getQuestion)
                .toList();
        
        // Verify no duplicates
        long distinctCount = questionTexts.stream().distinct().count();
        assertThat(distinctCount).isEqualTo(10);
    }

    @Test
    void testSecurityQuestionsOrderedCorrectly() throws Exception {
        dataInitializer.run();

        List<SecurityQuestion> questions = securityQuestionRepository
                .findByActiveOrderByDisplayOrder(true);
        
        // Verify they are in order
        for (int i = 0; i < questions.size(); i++) {
            assertThat(questions.get(i).getDisplayOrder()).isEqualTo(i + 1);
        }
    }
}
