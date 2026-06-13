package com.myfoundation.school.admin;

import com.myfoundation.school.storage.R2StorageService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import javax.imageio.ImageIO;
import java.awt.image.BufferedImage;
import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
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
            // Strip EXIF metadata (GPS coords, camera model, device serial) by
            // re-encoding the image through Java's ImageIO pixel pipeline.
            // WEBP and GIF pass through unchanged (rarely carry GPS EXIF).
            byte[] imageBytes = stripExif(file.getBytes(), contentType);
            String fileUrl = storageService.upload(key, imageBytes, contentType);

            Map<String, String> response = new HashMap<>();
            response.put("url", fileUrl);
            response.put("filename", filename);
            
            log.info("Image uploaded successfully: {}", fileUrl);
            return ResponseEntity.ok(response);
            
        } catch (IOException e) {
            log.error("Error uploading file to storage", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to upload file. Please try again."));
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

    /**
     * Strips EXIF / metadata from JPEG and PNG images by decoding to raw pixels
     * and re-encoding.  This removes GPS coordinates, camera model, device serial
     * numbers, and any other EXIF/XMP/IPTC tags that may expose PII.
     *
     * <p>WEBP and GIF files are returned unchanged — those formats are handled
     * natively by the browser and rarely carry sensitive GPS EXIF anyway.</p>
     *
     * @param original     raw uploaded bytes (already magic-byte validated)
     * @param contentType  MIME type of the file
     * @return EXIF-stripped bytes for JPEG/PNG, original bytes otherwise
     */
    private byte[] stripExif(byte[] original, String contentType) {
        String lower = contentType.toLowerCase();
        if (!lower.contains("jpeg") && !lower.contains("jpg") && !lower.contains("png")) {
            return original; // WEBP / GIF — skip re-encode
        }
        try {
            BufferedImage img = ImageIO.read(new ByteArrayInputStream(original));
            if (img == null) {
                log.warn("ImageIO could not decode image for EXIF stripping — storing original bytes");
                return original;
            }
            ByteArrayOutputStream baos = new ByteArrayOutputStream(original.length);
            String format = lower.contains("png") ? "png" : "jpeg";
            ImageIO.write(img, format, baos);
            byte[] stripped = baos.toByteArray();
            log.debug("EXIF strip: {} bytes → {} bytes ({})", original.length, stripped.length, format);
            return stripped;
        } catch (IOException e) {
            log.warn("EXIF stripping failed — storing original bytes", e);
            return original;
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
