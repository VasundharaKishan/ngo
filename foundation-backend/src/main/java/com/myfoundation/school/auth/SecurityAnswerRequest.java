package com.myfoundation.school.auth;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class SecurityAnswerRequest {
    
    @NotBlank(message = "Question ID is required")
    private String questionId;
    
    @NotBlank(message = "Answer is required")
    private String answer;
}
