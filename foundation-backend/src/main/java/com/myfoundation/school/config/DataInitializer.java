package com.myfoundation.school.config;

import com.myfoundation.school.auth.SecurityQuestion;
import com.myfoundation.school.auth.SecurityQuestionRepository;
import com.myfoundation.school.contact.ContactSettingsService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;

@Component
@ConditionalOnProperty(prefix = "data.init", name = "enabled", havingValue = "true", matchIfMissing = true)
@RequiredArgsConstructor
@Slf4j
public class DataInitializer implements CommandLineRunner {
    
    private final SecurityQuestionRepository securityQuestionRepository;
    private final ContactSettingsService contactSettingsService;
    
    @Override
    public void run(String... args) {
        initializeSecurityQuestions();
        initializeContactSettings();
    }
    
    private void initializeSecurityQuestions() {
        long count = securityQuestionRepository.count();
        
        if (count > 0) {
            log.info("Security questions already initialized (found {} questions)", count);
            return;
        }
        
        log.info("Initializing default security questions...");
        
        String[] questions = {
            "What was the name of your first pet?",
            "What city were you born in?",
            "What is your mother's maiden name?",
            "What was the name of your elementary school?",
            "What is your favorite book?",
            "What was the make of your first car?",
            "What is the name of your favorite teacher?",
            "What street did you grow up on?",
            "What is your favorite food?",
            "What is the name of the town where you were born?"
        };
        
        for (int i = 0; i < questions.length; i++) {
            SecurityQuestion question = new SecurityQuestion();
            question.setQuestion(questions[i]);
            question.setActive(true);
            question.setDisplayOrder(i + 1);
            securityQuestionRepository.save(question);
        }
        
        log.info("Initialized {} security questions", questions.length);
    }
    
    private void initializeContactSettings() {
        log.info("Initializing default contact settings...");
        contactSettingsService.initializeDefaultSettings();
        log.info("Contact settings initialized successfully");
    }
}
