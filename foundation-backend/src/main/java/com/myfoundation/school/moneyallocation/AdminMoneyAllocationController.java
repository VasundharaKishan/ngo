package com.myfoundation.school.moneyallocation;

import com.myfoundation.school.moneyallocation.dto.MoneyAllocationReorderRequest;
import com.myfoundation.school.moneyallocation.dto.MoneyAllocationResponse;
import com.myfoundation.school.moneyallocation.dto.MoneyAllocationUpsertRequest;
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

/**
 * Admin CRUD for money allocations. Admin reads are intentionally NOT gated by
 * registration status — operators need to stage content before approval.
 */
@RestController
@RequestMapping("/api/admin/money-allocations")
@PreAuthorize("hasAuthority('ADMIN')")
@RequiredArgsConstructor
@Slf4j
public class AdminMoneyAllocationController {

    private final MoneyAllocationService service;

    @GetMapping
    public ResponseEntity<AdminListResponse> list() {
        List<MoneyAllocationResponse> rows = service.listAll().stream()
                .map(MoneyAllocationResponse::from)
                .toList();
        int sum = rows.stream()
                .filter(MoneyAllocationResponse::enabled)
                .mapToInt(MoneyAllocationResponse::percentage)
                .sum();
        return ResponseEntity.ok(new AdminListResponse(rows, sum, service.isDisclosed()));
    }

    @PostMapping
    public ResponseEntity<MoneyAllocationResponse> create(@Valid @RequestBody MoneyAllocationUpsertRequest request) {
        log.info("Admin creating money allocation: label={}", request.label());
        return ResponseEntity.ok(MoneyAllocationResponse.from(service.create(request)));
    }

    @PutMapping("/{id}")
    public ResponseEntity<MoneyAllocationResponse> update(@PathVariable Long id,
                                                          @Valid @RequestBody MoneyAllocationUpsertRequest request) {
        log.info("Admin updating money allocation: id={}", id);
        return ResponseEntity.ok(MoneyAllocationResponse.from(service.update(id, request)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        log.info("Admin deleting money allocation: id={}", id);
        service.delete(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/reorder")
    public ResponseEntity<List<MoneyAllocationResponse>> reorder(@Valid @RequestBody MoneyAllocationReorderRequest request) {
        log.info("Admin reordering money allocations: ids={}", request.orderedIds());
        List<MoneyAllocationResponse> body = service.reorder(request).stream()
                .map(MoneyAllocationResponse::from)
                .toList();
        return ResponseEntity.ok(body);
    }

    /**
     * Admin list envelope — bundles the rows with derived helpers the UI needs
     * (enabled sum, whether the block is currently visible publicly). Saves a
     * round trip for those cross-cutting signals.
     */
    public record AdminListResponse(
            List<MoneyAllocationResponse> rows,
            int enabledPercentageSum,
            boolean publiclyVisible
    ) {}
}
