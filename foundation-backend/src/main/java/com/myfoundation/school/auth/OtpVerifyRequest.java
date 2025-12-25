package com.myfoundation.school.auth;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class OtpVerifyRequest {
    @NotBlank
    private String username;

    @NotBlank
    private String code;
}
