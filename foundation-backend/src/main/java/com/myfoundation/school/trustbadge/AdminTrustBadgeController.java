package com.myfoundation.school.trustbadge;

import com.myfoundation.school.trustbadge.dto.TrustBadgeReorderRequest;
import com.myfoundation.school.trustbadge.dto.TrustBadgeResponse;
import com.myfoundation.school.trustbadge.dto.TrustBadgeUpsertRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/admin/trust-badges")
@PreAuthorize("hasAuthority('ADMIN')")
@RequiredArgsConstructor
@Slf4j
public class AdminTrustBadgeController {

    private final TrustBadgeService service;

    @GetMapping
    public ResponseEntity<List<TrustBadgeResponse>> list() {
        List<TrustBadgeResponse> body = service.listAll().stream()
                .map(TrustBadgeResponse::from)
                .toList();
        return ResponseEntity.ok(body);
    }

    @PostMapping
    public ResponseEntity<TrustBadgeResponse> create(@Valid @RequestBody TrustBadgeUpsertRequest request) {
        log.info("Admin creating trust badge: slot={}", request.slotKey());
        return ResponseEntity.ok(TrustBadgeResponse.from(service.create(request)));
    }

    @PutMapping("/{id}")
    public ResponseEntity<TrustBadgeResponse> update(@PathVariable Long id,
                                                     @Valid @RequestBody TrustBadgeUpsertRequest request) {
        log.info("Admin updating trust badge: id={}", id);
        return ResponseEntity.ok(TrustBadgeResponse.from(service.update(id, request)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        log.info("Admin deleting trust badge: id={}", id);
        service.delete(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/reorder")
    public ResponseEntity<List<TrustBadgeResponse>> reorder(@Valid @RequestBody TrustBadgeReorderRequest request) {
        log.info("Admin reordering trust badges: ids={}", request.orderedIds());
        List<TrustBadgeResponse> body = service.reorder(request).stream()
                .map(TrustBadgeResponse::from)
                .toList();
        return ResponseEntity.ok(body);
    }
}
