package com.myfoundation.school.faq;

import com.myfoundation.school.faq.dto.FaqReorderRequest;
import com.myfoundation.school.faq.dto.FaqResponse;
import com.myfoundation.school.faq.dto.FaqUpsertRequest;
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
 * Admin CRUD for FAQs. There is no registration gate on the admin side — operators can
 * always author and reorder FAQs, regardless of registration status.
 */
@RestController
@RequestMapping("/api/admin/faqs")
@PreAuthorize("hasAuthority('ADMIN')")
@RequiredArgsConstructor
@Slf4j
public class AdminFaqController {

    private final FaqService service;

    @GetMapping
    public ResponseEntity<List<FaqResponse>> list() {
        List<FaqResponse> rows = service.listAll().stream()
                .map(FaqResponse::from)
                .toList();
        return ResponseEntity.ok(rows);
    }

    @PostMapping
    public ResponseEntity<FaqResponse> create(@Valid @RequestBody FaqUpsertRequest request) {
        log.info("Admin creating FAQ: question={}", request.question());
        return ResponseEntity.ok(FaqResponse.from(service.create(request)));
    }

    @PutMapping("/{id}")
    public ResponseEntity<FaqResponse> update(@PathVariable Long id,
                                              @Valid @RequestBody FaqUpsertRequest request) {
        log.info("Admin updating FAQ: id={}", id);
        return ResponseEntity.ok(FaqResponse.from(service.update(id, request)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        log.info("Admin deleting FAQ: id={}", id);
        service.delete(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/reorder")
    public ResponseEntity<List<FaqResponse>> reorder(@Valid @RequestBody FaqReorderRequest request) {
        log.info("Admin reordering FAQs: ids={}", request.orderedIds());
        List<FaqResponse> body = service.reorder(request).stream()
                .map(FaqResponse::from)
                .toList();
        return ResponseEntity.ok(body);
    }
}
