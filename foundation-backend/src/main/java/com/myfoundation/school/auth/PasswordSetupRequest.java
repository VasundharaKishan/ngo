package com.myfoundation.school.auth;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;
import java.util.List;

@Data
public class PasswordSetupRequest {
    
    @NotBlank(message = "Password is required")
    @Size(min = 6, message = "Password must be at least 6 characters")
    private String password;
    
    @Valid
    @Size(min = 2, message = "At least 2 security questions must be answered")
    private List<SecurityAnswerRequest> securityAnswers;
}
