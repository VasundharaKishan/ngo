package com.myfoundation.school.auth;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.web.servlet.MockMvc;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.security.MessageDigest;
import java.util.Base64;

import static org.hamcrest.Matchers.isEmptyOrNullString;
import static org.hamcrest.Matchers.is;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.verify;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest(classes = com.myfoundation.school.FoundationApplication.class)
@AutoConfigureMockMvc
@ActiveProfiles("test")
@TestPropertySource(properties = "app.auth.otp-enabled=true")
class OtpLoginFlowTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private AdminUserRepository adminUserRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private OtpTokenRepository otpTokenRepository;

    @MockBean
    private EmailService emailService;

    @BeforeEach
    void setup() {
        otpTokenRepository.deleteAll();
        adminUserRepository.deleteAll();

        AdminUser user = AdminUser.builder()
                .username("admin")
                .email("admin@test.org")
                .password(passwordEncoder.encode("Passw0rd!"))
                .fullName("Default Admin")
                .role(UserRole.ADMIN)
                .active(true)
                .build();
        adminUserRepository.save(user);
    }

    @Test
    void loginIssuesOtpAndVerificationReturnsToken() throws Exception {
        doNothing().when(emailService).sendOtpEmail(eq("admin@test.org"), eq("admin"), anyString());

        LoginRequest loginRequest = new LoginRequest();
        loginRequest.setUsername("admin");
        loginRequest.setPassword("Passw0rd!");

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(loginRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.otpRequired", is(true)))
                .andExpect(jsonPath("$.token", isEmptyOrNullString()));

        ArgumentCaptor<String> codeCaptor = ArgumentCaptor.forClass(String.class);
        verify(emailService).sendOtpEmail(eq("admin@test.org"), eq("admin"), codeCaptor.capture());
        String code = codeCaptor.getValue();

        OtpVerifyRequest verifyRequest = new OtpVerifyRequest();
        verifyRequest.setUsername("admin");
        verifyRequest.setCode(code);

        mockMvc.perform(post("/api/auth/otp/verify")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(verifyRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").isNotEmpty())
                .andExpect(jsonPath("$.otpRequired", is(false)));
    }

    @Test
    void expiredOtpIsRejected() throws Exception {
        doNothing().when(emailService).sendOtpEmail(eq("admin@test.org"), eq("admin"), anyString());

        AdminUser user = adminUserRepository.findByUsername("admin").orElseThrow();
        OtpToken token = OtpToken.builder()
                .user(user)
                .codeHash(hashOtpTestValue("123456"))
                .expiresAt(Instant.now().minus(1, ChronoUnit.MINUTES))
                .build();
        otpTokenRepository.save(token);

        OtpVerifyRequest verifyRequest = new OtpVerifyRequest();
        verifyRequest.setUsername("admin");
        verifyRequest.setCode("123456");

        mockMvc.perform(post("/api/auth/otp/verify")
                        .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(verifyRequest)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void invalidCodeFailsAndLocksAfterMaxAttempts() throws Exception {
        doNothing().when(emailService).sendOtpEmail(eq("admin@test.org"), eq("admin"), anyString());

        LoginRequest loginRequest = new LoginRequest();
        loginRequest.setUsername("admin");
        loginRequest.setPassword("Passw0rd!");

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(loginRequest)))
                .andExpect(status().isOk());

        OtpVerifyRequest verifyRequest = new OtpVerifyRequest();
        verifyRequest.setUsername("admin");
        verifyRequest.setCode("000000");

        mockMvc.perform(post("/api/auth/otp/verify")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(verifyRequest)))
                .andExpect(status().isBadRequest());

        mockMvc.perform(post("/api/auth/otp/verify")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(verifyRequest)))
                .andExpect(status().isBadRequest());
    }

    private String hashOtpTestValue(String value) throws Exception {
        MessageDigest digest = MessageDigest.getInstance("SHA-256");
        byte[] hash = digest.digest(value.getBytes());
        return Base64.getEncoder().encodeToString(hash);
    }
}
