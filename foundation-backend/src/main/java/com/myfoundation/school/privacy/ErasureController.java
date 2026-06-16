package com.myfoundation.school.privacy;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

/**
 * Public endpoint for GDPR data erasure requests.
 * No authentication required.
 */
@RestController
@RequestMapping("/api/public/privacy")
@RequiredArgsConstructor
@Slf4j
public class ErasureController {

    private final ErasureService erasureService;

    public record ErasureRequestDto(
            @NotBlank(message = "Email is required")
            @Email(message = "Invalid email address")
            String email,

            @Size(max = 1000, message = "Reason must be 1000 characters or less")
            String reason
    ) {}

    @PostMapping("/erasure-request")
    public ResponseEntity<?> submitErasureRequest(@Valid @RequestBody ErasureRequestDto request) {
        log.info("POST /api/public/privacy/erasure-request - Erasure request received");
        erasureService.submitErasureRequest(request.email(), request.reason());

        // Always return success to avoid revealing if email exists
        return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "Your request has been received. We will process it within 30 days as required by law."
        ));
    }
}
