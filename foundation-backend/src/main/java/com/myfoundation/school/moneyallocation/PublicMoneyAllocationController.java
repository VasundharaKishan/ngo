package com.myfoundation.school.moneyallocation;

import com.myfoundation.school.moneyallocation.dto.PublicMoneyAllocationResponse;
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
 * Public money-allocation endpoint.
 *
 * <p>Returns {@code 204 No Content} whenever the foundation is not in APPROVED
 * registration status — the block is a financial disclosure and must never be
 * visible pre-registration. Otherwise returns the enabled rows with a 5-minute
 * cache (these change rarely and the cost of stale UI for a few minutes after an
 * edit is low).</p>
 */
@RestController
@RequestMapping("/api/public/money-allocations")
@RequiredArgsConstructor
@Slf4j
public class PublicMoneyAllocationController {

    private final MoneyAllocationService service;

    @GetMapping
    public ResponseEntity<List<PublicMoneyAllocationResponse>> list() {
        if (!service.isDisclosed()) {
            return ResponseEntity.noContent()
                    .cacheControl(CacheControl.maxAge(Duration.ofSeconds(60)).cachePublic())
                    .build();
        }
        List<PublicMoneyAllocationResponse> body = service.listForPublic().stream()
                .map(PublicMoneyAllocationResponse::from)
                .toList();
        return ResponseEntity.ok()
                .cacheControl(CacheControl.maxAge(Duration.ofMinutes(5)).cachePublic())
                .body(body);
    }
}
