package com.myfoundation.school.registration;

import com.myfoundation.school.registration.dto.PublicRegistrationResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.CacheControl;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.Duration;

/**
 * Public endpoint exposing the minimum information needed to render conditional content
 * on the public site (footer disclosure, 80G claims, FCRA gating).
 *
 * <p>Short client-side cache (30s) — registration status changes are rare and the public
 * disclosure does not need to update instantly.</p>
 */
@RestController
@RequestMapping("/api/public/registration")
@RequiredArgsConstructor
@Slf4j
public class PublicRegistrationController {

    private final RegistrationInfoService service;

    @GetMapping
    public ResponseEntity<PublicRegistrationResponse> get() {
        PublicRegistrationResponse body = PublicRegistrationResponse.from(service.getCurrent());
        return ResponseEntity.ok()
                .cacheControl(CacheControl.maxAge(Duration.ofSeconds(30)).cachePublic())
                .body(body);
    }
}
