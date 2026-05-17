package com.myfoundation.school.donationpreset;

import com.myfoundation.school.donationpreset.dto.DonationPresetReorderRequest;
import com.myfoundation.school.donationpreset.dto.DonationPresetResponse;
import com.myfoundation.school.donationpreset.dto.DonationPresetUpsertRequest;
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
@RequestMapping("/api/admin/donation-presets")
@PreAuthorize("hasAuthority('ADMIN')")
@RequiredArgsConstructor
@Slf4j
public class AdminDonationPresetController {

    private final DonationPresetService service;

    @GetMapping
    public ResponseEntity<List<DonationPresetResponse>> list() {
        List<DonationPresetResponse> body = service.listAll().stream()
                .map(DonationPresetResponse::from)
                .toList();
        return ResponseEntity.ok(body);
    }

    @PostMapping
    public ResponseEntity<DonationPresetResponse> create(@Valid @RequestBody DonationPresetUpsertRequest request) {
        log.info("Admin creating donation preset: amount={} paise", request.amountMinorUnits());
        return ResponseEntity.ok(DonationPresetResponse.from(service.create(request)));
    }

    @PutMapping("/{id}")
    public ResponseEntity<DonationPresetResponse> update(@PathVariable Long id,
                                                         @Valid @RequestBody DonationPresetUpsertRequest request) {
        log.info("Admin updating donation preset: id={}", id);
        return ResponseEntity.ok(DonationPresetResponse.from(service.update(id, request)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        log.info("Admin deleting donation preset: id={}", id);
        service.delete(id);
        return ResponseEntity.noContent().build();
    }

    /** Promote this preset to default. Clears any previous default in the same transaction. */
    @PostMapping("/{id}/default")
    public ResponseEntity<DonationPresetResponse> setDefault(@PathVariable Long id) {
        log.info("Admin setting donation preset default: id={}", id);
        return ResponseEntity.ok(DonationPresetResponse.from(service.setDefault(id)));
    }

    /** Clear the default flag from all presets — form falls back to first-enabled. */
    @DeleteMapping("/default")
    public ResponseEntity<Void> clearDefault() {
        log.info("Admin clearing donation preset default");
        service.clearDefault();
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/reorder")
    public ResponseEntity<List<DonationPresetResponse>> reorder(@Valid @RequestBody DonationPresetReorderRequest request) {
        log.info("Admin reordering donation presets: ids={}", request.orderedIds());
        List<DonationPresetResponse> body = service.reorder(request).stream()
                .map(DonationPresetResponse::from)
                .toList();
        return ResponseEntity.ok(body);
    }
}
