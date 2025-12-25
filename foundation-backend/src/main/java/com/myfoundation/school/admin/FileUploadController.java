package com.myfoundation.school.admin;

import com.myfoundation.school.storage.R2StorageService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;
import java.util.Set;

@RestController
@RequestMapping("/api/admin/upload")
@RequiredArgsConstructor
@Slf4j
public class FileUploadController {
    
    private static final long MAX_FILE_BYTES = 5 * 1024 * 1024;
    private static final Set<String> ALLOWED_EXTENSIONS = Set.of(".jpg", ".jpeg", ".png", ".gif", ".webp");
    private final R2StorageService storageService;
    
    @PostMapping(value = "/image", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<Map<String, String>> uploadImage(@RequestParam("file") MultipartFile file) {
        try {
            if (file.isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("error", "File is empty"));
            }

            if (file.getSize() > MAX_FILE_BYTES) {
                return ResponseEntity.badRequest().body(Map.of("error", "File too large (max 5MB)"));
            }
            
            // Validate file type
            String contentType = file.getContentType();
            if (contentType == null || !contentType.startsWith("image/")) {
                return ResponseEntity.badRequest().body(Map.of("error", "Only image files are allowed"));
            }

            if (!isKnownImageSignature(file.getBytes())) {
                return ResponseEntity.badRequest().body(Map.of("error", "Invalid image content"));
            }
            
            // Generate unique filename
            String originalFilename = file.getOriginalFilename();
            String extension = originalFilename != null && originalFilename.contains(".") 
                ? originalFilename.substring(originalFilename.lastIndexOf("."))
                : ".jpg";

            extension = extension.toLowerCase();
            if (!ALLOWED_EXTENSIONS.contains(extension)) {
                return ResponseEntity.badRequest().body(Map.of("error", "Unsupported file extension"));
            }

            String filename = UUID.randomUUID().toString() + extension;

            String key = "campaigns/" + filename;
            String fileUrl = storageService.upload(key, file.getBytes(), contentType);

            Map<String, String> response = new HashMap<>();
            response.put("url", fileUrl);
            response.put("filename", filename);
            
            log.info("Image uploaded successfully: {}", fileUrl);
            return ResponseEntity.ok(response);
            
        } catch (IOException e) {
            log.error("Error uploading file", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to upload file: " + e.getMessage()));
        }
    }

    @DeleteMapping("/image/{filename}")
    public ResponseEntity<Map<String, String>> deleteImage(@PathVariable String filename) {
        if (filename == null || filename.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Filename is required"));
        }

        String normalized = filename.trim().toLowerCase();
        if (normalized.contains("..") || normalized.contains("/") || normalized.contains("\\")) {
            return ResponseEntity.badRequest().body(Map.of("error", "Invalid filename"));
        }

        String extension = normalized.contains(".")
                ? normalized.substring(normalized.lastIndexOf("."))
                : "";
        if (!ALLOWED_EXTENSIONS.contains(extension)) {
            return ResponseEntity.badRequest().body(Map.of("error", "Unsupported file extension"));
        }

        String key = "campaigns/" + normalized;
        try {
            storageService.delete(key);
            log.info("Image deleted: {}", key);
            return ResponseEntity.ok(Map.of("status", "deleted", "filename", normalized));
        } catch (Exception e) {
            log.error("Failed to delete image {}", key, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to delete file"));
        }
    }

    private boolean isKnownImageSignature(byte[] bytes) {
        if (bytes == null || bytes.length < 12) {
            return false;
        }
        // PNG
        if (bytes[0] == (byte) 0x89 && bytes[1] == 0x50 && bytes[2] == 0x4E && bytes[3] == 0x47) {
            return true;
        }
        // JPEG
        if (bytes[0] == (byte) 0xFF && bytes[1] == (byte) 0xD8) {
            return true;
        }
        // GIF
        if (bytes[0] == 'G' && bytes[1] == 'I' && bytes[2] == 'F') {
            return true;
        }
        // WEBP "RIFF....WEBP"
        if (bytes[0] == 'R' && bytes[1] == 'I' && bytes[2] == 'F' && bytes[3] == 'F' &&
                bytes[8] == 'W' && bytes[9] == 'E' && bytes[10] == 'B' && bytes[11] == 'P') {
            return true;
        }
        return false;
    }
}
