package com.myfoundation.school.transparency;

import com.myfoundation.school.transparency.dto.PublicTransparencyDocumentResponse;
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
 * Public transparency-documents endpoint.
 *
 * <p>Returns enabled rows only. No registration gate at the controller layer — each
 * document carries its own {@code enabled} flag, and the Transparency page itself
 * is meaningful at every registration stage (it openly states what does and does
 * not yet exist). Empty list is returned as {@code 200 OK} with an empty array;
 * the client always shows the registration-status block and the "what's still
 * pending" honesty note even when no documents are published yet. 5-minute cache;
 * documents change rarely.</p>
 */
@RestController
@RequestMapping("/api/public/transparency-documents")
@RequiredArgsConstructor
@Slf4j
public class PublicTransparencyDocumentController {

    private final TransparencyDocumentService service;

    @GetMapping
    public ResponseEntity<List<PublicTransparencyDocumentResponse>> list() {
        List<PublicTransparencyDocumentResponse> body = service.listForPublic().stream()
                .map(PublicTransparencyDocumentResponse::from)
                .toList();
        return ResponseEntity.ok()
                .cacheControl(CacheControl.maxAge(Duration.ofMinutes(5)).cachePublic())
                .body(body);
    }
}
