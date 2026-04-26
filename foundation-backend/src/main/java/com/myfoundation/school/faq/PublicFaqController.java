package com.myfoundation.school.faq;

import com.myfoundation.school.faq.dto.PublicFaqResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.CacheControl;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.Duration;
import java.util.List;

/**
 * Public FAQ endpoint.
 *
 * <p>Returns enabled FAQs only (no registration gate). Empty list is returned as
 * {@code 200 OK} with an empty array — there is no semantic difference between
 * "no FAQs configured" and "all FAQs disabled" for the client, and the FAQ page
 * shows a friendly placeholder either way. 5-minute cache; FAQs change rarely.</p>
 */
@RestController
@RequestMapping("/api/public/faqs")
@RequiredArgsConstructor
@Slf4j
public class PublicFaqController {

    private final FaqService service;

    @GetMapping
    public ResponseEntity<List<PublicFaqResponse>> list() {
        List<PublicFaqResponse> body = service.listForPublic().stream()
                .map(PublicFaqResponse::from)
                .toList();
        return ResponseEntity.ok()
                .cacheControl(CacheControl.maxAge(Duration.ofMinutes(5)).cachePublic())
                .body(body);
    }
}
