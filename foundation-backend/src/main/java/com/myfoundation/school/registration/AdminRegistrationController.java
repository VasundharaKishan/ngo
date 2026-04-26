package com.myfoundation.school.registration;

import com.myfoundation.school.registration.dto.RegistrationInfoResponse;
import com.myfoundation.school.registration.dto.RegistrationInfoUpdateRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Admin endpoints for reading and updating the foundation's registration status.
 *
 * <p>Protected by {@code hasAuthority('ADMIN')}. The path intentionally lives at
 * {@code /api/admin/registration} (singular) because there is only ever one record.</p>
 */
@RestController
@RequestMapping("/api/admin/registration")
@PreAuthorize("hasAuthority('ADMIN')")
@RequiredArgsConstructor
@Slf4j
public class AdminRegistrationController {

    private final RegistrationInfoService service;

    @GetMapping
    public ResponseEntity<RegistrationInfoResponse> get() {
        log.debug("Admin fetching registration info");
        return ResponseEntity.ok(RegistrationInfoResponse.from(service.getCurrent()));
    }

    @PutMapping
    public ResponseEntity<RegistrationInfoResponse> update(
            @Valid @RequestBody RegistrationInfoUpdateRequest request) {
        log.info("Admin updating registration info: status={}", request.status());
        RegistrationInfo updated = service.update(request);
        return ResponseEntity.ok(RegistrationInfoResponse.from(updated));
    }
}
