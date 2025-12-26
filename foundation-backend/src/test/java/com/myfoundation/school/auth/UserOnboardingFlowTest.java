package com.myfoundation.school.auth;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;
import com.myfoundation.school.TestMailConfig;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.*;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest(classes = {com.myfoundation.school.FoundationApplication.class, TestMailConfig.class})
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
class UserOnboardingFlowTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private AdminUserRepository adminUserRepository;

    @Autowired
    private PasswordSetupTokenRepository tokenRepository;

    @Autowired
    private SecurityQuestionRepository securityQuestionRepository;

    @Autowired
    private UserSecurityAnswerRepository securityAnswerRepository;

    @Autowired
    private AuthService authService;

    @MockBean
    private EmailService emailService;

    private SecurityQuestion question1;
    private SecurityQuestion question2;

    @BeforeEach
    void setUp() {
        // Clean up
        securityAnswerRepository.deleteAll();
        tokenRepository.deleteAll();
        adminUserRepository.deleteAll();
        securityQuestionRepository.deleteAll();

        // Create security questions
        question1 = new SecurityQuestion();
        question1.setQuestion("What was your first pet's name?");
        question1.setActive(true);
        question1.setDisplayOrder(1);
        question1 = securityQuestionRepository.save(question1);

        question2 = new SecurityQuestion();
        question2.setQuestion("What city were you born in?");
        question2.setActive(true);
        question2.setDisplayOrder(2);
        question2 = securityQuestionRepository.save(question2);
    }

    @Test
    void testCompleteUserOnboardingFlow() throws Exception {
        // Step 1: Create user (normally done by admin via AdminUserController)
        CreateUserRequest createRequest = new CreateUserRequest();
        createRequest.setUsername("testuser");
        createRequest.setEmail("testuser@example.com");
        createRequest.setFullName("Test User");
        createRequest.setRole(UserRole.OPERATOR);

        // Mock email sending
        doNothing().when(emailService).sendPasswordSetupEmail(anyString(), anyString(), anyString());

        // Create user
        AdminUser createdUser = authService.createUser(createRequest);
        
        // Verify user was created
        assertThat(createdUser).isNotNull();
        assertThat(createdUser.getUsername()).isEqualTo("testuser");
        assertThat(createdUser.getEmail()).isEqualTo("testuser@example.com");
        assertThat(createdUser.isActive()).isFalse(); // Not active yet
        
        // Verify email was sent
        verify(emailService, times(1)).sendPasswordSetupEmail(
                eq("testuser@example.com"),
                eq("testuser"),
                anyString()
        );

        // Step 2: Get the password setup token
        List<PasswordSetupToken> tokens = tokenRepository.findAll();
        assertThat(tokens).hasSize(1);
        PasswordSetupToken token = tokens.get(0);
        assertThat(token.getUser().getId()).isEqualTo(createdUser.getId());
        assertThat(token.isUsed()).isFalse();

        // Step 3: Validate token
        mockMvc.perform(get("/api/auth/validate-token/" + token.getToken()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.valid", is(true)))
                .andExpect(jsonPath("$.username", is("testuser")))
                .andExpect(jsonPath("$.email", is("testuser@example.com")));

        // Step 4: Get security questions
        mockMvc.perform(get("/api/auth/security-questions"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(2)))
                .andExpect(jsonPath("$[0].question", is("What was your first pet's name?")));

        // Step 5: Setup password and security answers
        PasswordSetupRequest setupRequest = new PasswordSetupRequest();
        setupRequest.setPassword("SecurePassword123!");
        
        SecurityAnswerRequest answer1 = new SecurityAnswerRequest();
        answer1.setQuestionId(question1.getId());
        answer1.setAnswer("Fluffy");
        
        SecurityAnswerRequest answer2 = new SecurityAnswerRequest();
        answer2.setQuestionId(question2.getId());
        answer2.setAnswer("New York");
        
        setupRequest.setSecurityAnswers(List.of(answer1, answer2));

        mockMvc.perform(post("/api/auth/setup-password/" + token.getToken())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(setupRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message", containsString("Password setup complete")));

        // Step 6: Verify user is now active
        AdminUser updatedUser = adminUserRepository.findById(createdUser.getId()).orElseThrow();
        assertThat(updatedUser.isActive()).isTrue();
        assertThat(updatedUser.getPassword()).isNotEmpty();
        assertThat(updatedUser.getPassword()).doesNotContain("SecurePassword123!"); // Should be hashed

        // Step 7: Verify token is marked as used
        PasswordSetupToken usedToken = tokenRepository.findById(token.getId()).orElseThrow();
        assertThat(usedToken.isUsed()).isTrue();

        // Step 8: Verify security answers were saved
        List<UserSecurityAnswer> answers = securityAnswerRepository.findByUserId(createdUser.getId());
        assertThat(answers).hasSize(2);

        // Step 9: Verify user can login
        LoginRequest loginRequest = new LoginRequest();
        loginRequest.setUsername("testuser");
        loginRequest.setPassword("SecurePassword123!");

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(loginRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").exists())
                .andExpect(jsonPath("$.username", is("testuser")))
                .andExpect(jsonPath("$.role", is("OPERATOR")));
    }

    @Test
    void testSetupPassword_ExpiredToken() throws Exception {
        // Create user
        CreateUserRequest createRequest = new CreateUserRequest();
        createRequest.setUsername("expireduser");
        createRequest.setEmail("expired@example.com");
        createRequest.setFullName("Expired User");
        createRequest.setRole(UserRole.OPERATOR);

        doNothing().when(emailService).sendPasswordSetupEmail(anyString(), anyString(), anyString());
        
        AdminUser user = authService.createUser(createRequest);

        // Get token and manually expire it
        PasswordSetupToken token = tokenRepository.findAll().get(0);
        token.setExpiresAt(Instant.now().minus(1, ChronoUnit.HOURS));
        tokenRepository.save(token);

        // Try to setup password with expired token
        PasswordSetupRequest setupRequest = new PasswordSetupRequest();
        setupRequest.setPassword("SecurePassword123!");
        
        SecurityAnswerRequest answer1 = new SecurityAnswerRequest();
        answer1.setQuestionId(question1.getId());
        answer1.setAnswer("Fluffy");

        SecurityAnswerRequest answer2 = new SecurityAnswerRequest();
        answer2.setQuestionId(question2.getId());
        answer2.setAnswer("New York");
        
        setupRequest.setSecurityAnswers(List.of(answer1, answer2));

        mockMvc.perform(post("/api/auth/setup-password/" + token.getToken())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(setupRequest)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error", containsString("Invalid or expired token")));
    }

    @Test
    void testSetupPassword_TokenAlreadyUsed() throws Exception {
        // Create user
        CreateUserRequest createRequest = new CreateUserRequest();
        createRequest.setUsername("usedtokenuser");
        createRequest.setEmail("usedtoken@example.com");
        createRequest.setFullName("Used Token User");
        createRequest.setRole(UserRole.OPERATOR);

        doNothing().when(emailService).sendPasswordSetupEmail(anyString(), anyString(), anyString());
        
        AdminUser user = authService.createUser(createRequest);

        // Get token and mark as used
        PasswordSetupToken token = tokenRepository.findAll().get(0);
        token.setUsed(true);
        tokenRepository.save(token);

        // Try to setup password with used token
        PasswordSetupRequest setupRequest = new PasswordSetupRequest();
        setupRequest.setPassword("SecurePassword123!");
        
        SecurityAnswerRequest answer1 = new SecurityAnswerRequest();
        answer1.setQuestionId(question1.getId());
        answer1.setAnswer("Fluffy");

        SecurityAnswerRequest answer2 = new SecurityAnswerRequest();
        answer2.setQuestionId(question2.getId());
        answer2.setAnswer("New York");
        
        setupRequest.setSecurityAnswers(List.of(answer1, answer2));

        mockMvc.perform(post("/api/auth/setup-password/" + token.getToken())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(setupRequest)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error", containsString("Invalid or expired token")));
    }

    @Test
    void testSetupPassword_InsufficientSecurityQuestions() throws Exception {
        // Create user
        CreateUserRequest createRequest = new CreateUserRequest();
        createRequest.setUsername("insufficientuser");
        createRequest.setEmail("insufficient@example.com");
        createRequest.setFullName("Insufficient User");
        createRequest.setRole(UserRole.OPERATOR);

        doNothing().when(emailService).sendPasswordSetupEmail(anyString(), anyString(), anyString());
        
        AdminUser user = authService.createUser(createRequest);
        PasswordSetupToken token = tokenRepository.findAll().get(0);

        // Try to setup with only 1 security question (need at least 2)
        PasswordSetupRequest setupRequest = new PasswordSetupRequest();
        setupRequest.setPassword("SecurePassword123!");
        
        SecurityAnswerRequest answer1 = new SecurityAnswerRequest();
        answer1.setQuestionId(question1.getId());
        answer1.setAnswer("Fluffy");
        
        setupRequest.setSecurityAnswers(List.of(answer1)); // Only 1 answer

        mockMvc.perform(post("/api/auth/setup-password/" + token.getToken())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(setupRequest)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void testGetSecurityQuestions_ReturnsOnlyActiveQuestions() throws Exception {
        // Create inactive question
        SecurityQuestion inactiveQuestion = new SecurityQuestion();
        inactiveQuestion.setQuestion("This should not appear");
        inactiveQuestion.setActive(false);
        inactiveQuestion.setDisplayOrder(3);
        securityQuestionRepository.save(inactiveQuestion);

        mockMvc.perform(get("/api/auth/security-questions"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(2))) // Only 2 active questions
                .andExpect(jsonPath("$[*].question", not(hasItem("This should not appear"))));
    }
}
