package com.myfoundation.school.auth;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
@Slf4j
public class PasswordSetupController {
    
    private final AuthService authService;
    private final SecurityQuestionRepository securityQuestionRepository;
    
    @GetMapping("/security-questions")
    public ResponseEntity<List<SecurityQuestion>> getSecurityQuestions() {
        List<SecurityQuestion> questions = authService.getActiveSecurityQuestions();
        return ResponseEntity.ok(questions);
    }
    
    @GetMapping("/validate-token/{token}")
    public ResponseEntity<Map<String, Object>> validateToken(@PathVariable String token) {
        try {
            AdminUser user = authService.validateToken(token);
            Map<String, Object> response = new HashMap<>();
            response.put("valid", true);
            response.put("username", user.getUsername());
            response.put("email", user.getEmail());
            response.put("fullName", user.getFullName());
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            Map<String, Object> response = new HashMap<>();
            response.put("valid", false);
            response.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(response);
        }
    }
    
    @PostMapping("/setup-password/{token}")
    public ResponseEntity<Map<String, String>> setupPassword(
            @PathVariable String token,
            @Valid @RequestBody PasswordSetupRequest request) {
        try {
            authService.completePasswordSetup(token, request.getPassword(), request.getSecurityAnswers());
            
            Map<String, String> response = new HashMap<>();
            response.put("message", "Password setup completed successfully");
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            log.error("Password setup failed", e);
            Map<String, String> response = new HashMap<>();
            response.put("error", e.getMessage());
            return ResponseEntity.badRequest().body(response);
        }
    }
    
    @PostMapping("/admin/security-questions")
    public ResponseEntity<SecurityQuestion> createSecurityQuestion(
            @RequestBody SecurityQuestion question) {
        try {
            if (securityQuestionRepository.existsByQuestion(question.getQuestion())) {
                Map<String, String> error = new HashMap<>();
                error.put("error", "Security question already exists");
                return ResponseEntity.badRequest().body(null);
            }
            
            SecurityQuestion saved = securityQuestionRepository.save(question);
            return ResponseEntity.ok(saved);
        } catch (Exception e) {
            log.error("Failed to create security question", e);
            return ResponseEntity.badRequest().build();
        }
    }
    
    @PutMapping("/admin/security-questions/{id}")
    public ResponseEntity<SecurityQuestion> updateSecurityQuestion(
            @PathVariable String id,
            @RequestBody SecurityQuestion question) {
        try {
            SecurityQuestion existing = securityQuestionRepository.findById(id)
                    .orElseThrow(() -> new RuntimeException("Question not found"));
            
            existing.setQuestion(question.getQuestion());
            existing.setActive(question.isActive());
            existing.setDisplayOrder(question.getDisplayOrder());
            
            SecurityQuestion updated = securityQuestionRepository.save(existing);
            return ResponseEntity.ok(updated);
        } catch (Exception e) {
            log.error("Failed to update security question", e);
            return ResponseEntity.badRequest().build();
        }
    }
    
    @DeleteMapping("/admin/security-questions/{id}")
    public ResponseEntity<Void> deleteSecurityQuestion(@PathVariable String id) {
        try {
            securityQuestionRepository.deleteById(id);
            return ResponseEntity.noContent().build();
        } catch (Exception e) {
            log.error("Failed to delete security question", e);
            return ResponseEntity.badRequest().build();
        }
    }
    
    @GetMapping("/admin/security-questions")
    public ResponseEntity<List<SecurityQuestion>> getAllSecurityQuestions() {
        List<SecurityQuestion> questions = securityQuestionRepository.findAll();
        return ResponseEntity.ok(questions);
    }
}
