package com.myfoundation.school.hero;

import jakarta.persistence.*;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "hero_slides")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class HeroSlide {
    
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;
    
    @NotBlank(message = "Image URL is required")
    @Column(name = "image_url", nullable = false, length = 500)
    private String imageUrl;

    @NotBlank(message = "Alt text is required")
    @Size(min = 3, max = 255, message = "Alt text must be between 3 and 255 characters")
    @Column(name = "alt_text", nullable = false, length = 255)
    private String altText;
    
    @Enumerated(EnumType.STRING)
    @Column(name = "focus", nullable = false, length = 20)
    private Focus focus;
    
    @Column(name = "enabled", nullable = false)
    private boolean enabled;
    
    @Min(value = 0, message = "Sort order must be non-negative")
    @Column(name = "sort_order", nullable = false)
    private int sortOrder;

    @Size(max = 255, message = "Title must be 255 characters or fewer")
    @Column(name = "title", length = 255)
    private String title;

    @Size(max = 500, message = "Subtitle must be 500 characters or fewer")
    @Column(name = "subtitle", length = 500)
    private String subtitle;

    @Column(name = "deleted", nullable = false)
    private boolean deleted = false;
    
    @Column(name = "deleted_at")
    private Instant deletedAt;
    
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;
    
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;
    
    @PrePersist
    protected void onCreate() {
        createdAt = Instant.now();
        updatedAt = Instant.now();
        if (focus == null) {
            focus = Focus.CENTER;
        }
    }
    
    @PreUpdate
    protected void onUpdate() {
        updatedAt = Instant.now();
    }
    
    /**
     * Focus position enum for image display
     */
    public enum Focus {
        CENTER,
        LEFT,
        RIGHT,
        TOP,
        BOTTOM
    }
}
