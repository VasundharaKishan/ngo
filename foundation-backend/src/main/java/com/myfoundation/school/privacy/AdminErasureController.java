package com.myfoundation.school.privacy;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

/**
 * Admin endpoints for managing GDPR data erasure requests.
 */
@RestController
@RequestMapping("/api/admin/erasure-requests")
@RequiredArgsConstructor
@Slf4j
public class AdminErasureController {

    private final ErasureService erasureService;

    @GetMapping
    public ResponseEntity<?> getErasureRequests(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "25") int size) {
        log.info("GET /api/admin/erasure-requests - page: {}, size: {}", page, size);

        int pageNumber = Math.max(0, page);
        int pageSize = (size > 0 && size <= 100) ? size : 25;
        Pageable pageable = PageRequest.of(pageNumber, pageSize, Sort.by(Sort.Direction.DESC, "createdAt"));

        Page<ErasureRequest> result = erasureService.getErasureRequests(pageable);

        Map<String, Object> response = new HashMap<>();
        response.put("items", result.getContent());
        response.put("page", result.getNumber());
        response.put("size", result.getSize());
        response.put("totalItems", result.getTotalElements());
        response.put("totalPages", result.getTotalPages());
        return ResponseEntity.ok(response);
    }

    @PostMapping("/{id}/process")
    public ResponseEntity<?> processErasureRequest(@PathVariable String id) {
        log.info("POST /api/admin/erasure-requests/{}/process - Processing erasure request", id);

        String adminUsername = SecurityContextHolder.getContext()
                .getAuthentication().getName();

        try {
            ErasureRequest processed = erasureService.processErasureRequest(id, adminUsername);
            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "message", "Erasure request processed successfully",
                    "status", processed.getStatus().name()
            ));
        } catch (IllegalStateException e) {
            return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "message", e.getMessage()
            ));
        }
    }
}
