package com.myfoundation.school.transparency;

import com.myfoundation.school.transparency.dto.TransparencyDocumentReorderRequest;
import com.myfoundation.school.transparency.dto.TransparencyDocumentResponse;
import com.myfoundation.school.transparency.dto.TransparencyDocumentUpsertRequest;
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
 * Admin CRUD for transparency documents. No registration gate — admins can stage
 * draft entries with placeholder URLs and flip them on later.
 */
@RestController
@RequestMapping("/api/admin/transparency-documents")
@PreAuthorize("hasAuthority('ADMIN')")
@RequiredArgsConstructor
@Slf4j
public class AdminTransparencyDocumentController {

    private final TransparencyDocumentService service;

    @GetMapping
    public ResponseEntity<List<TransparencyDocumentResponse>> list() {
        List<TransparencyDocumentResponse> rows = service.listAll().stream()
                .map(TransparencyDocumentResponse::from)
                .toList();
        return ResponseEntity.ok(rows);
    }

    @PostMapping
    public ResponseEntity<TransparencyDocumentResponse> create(
            @Valid @RequestBody TransparencyDocumentUpsertRequest request) {
        log.info("Admin creating transparency document: title={}", request.title());
        return ResponseEntity.ok(TransparencyDocumentResponse.from(service.create(request)));
    }

    @PutMapping("/{id}")
    public ResponseEntity<TransparencyDocumentResponse> update(
            @PathVariable Long id,
            @Valid @RequestBody TransparencyDocumentUpsertRequest request) {
        log.info("Admin updating transparency document: id={}", id);
        return ResponseEntity.ok(TransparencyDocumentResponse.from(service.update(id, request)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        log.info("Admin deleting transparency document: id={}", id);
        service.delete(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/reorder")
    public ResponseEntity<List<TransparencyDocumentResponse>> reorder(
            @Valid @RequestBody TransparencyDocumentReorderRequest request) {
        log.info("Admin reordering transparency documents: ids={}", request.orderedIds());
        List<TransparencyDocumentResponse> body = service.reorder(request).stream()
                .map(TransparencyDocumentResponse::from)
                .toList();
        return ResponseEntity.ok(body);
    }
}
