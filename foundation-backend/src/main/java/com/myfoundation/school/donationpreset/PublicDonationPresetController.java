package com.myfoundation.school.donationpreset;

import com.myfoundation.school.donationpreset.dto.PublicDonationPresetsResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.CacheControl;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.Duration;

/**
 * Public donation-presets endpoint. Returns the enabled presets plus which amount to
 * preselect on the donation form.
 *
 * <p>60s {@code Cache-Control: public, max-age=60} — admin edits propagate within a
 * minute, which is acceptable for preset amounts that rarely change.</p>
 */
@RestController
@RequestMapping("/api/public/donation-presets")
@RequiredArgsConstructor
@Slf4j
public class PublicDonationPresetController {

    private final DonationPresetService service;

    @GetMapping
    public ResponseEntity<PublicDonationPresetsResponse> get() {
        PublicDonationPresetsResponse body = PublicDonationPresetsResponse.from(service.listForPublic());
        return ResponseEntity.ok()
                .cacheControl(CacheControl.maxAge(Duration.ofSeconds(60)).cachePublic())
                .body(body);
    }
}
