package com.myfoundation.school.hero;

import jakarta.persistence.*;
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
    
    @Column(name = "image_url", nullable = false, length = 500)
    private String imageUrl;
    
    @Column(name = "alt_text", nullable = false, length = 255)
    private String altText;
    
    @Enumerated(EnumType.STRING)
    @Column(name = "focus", nullable = false, length = 20)
    private Focus focus;
    
    @Column(name = "enabled", nullable = false)
    private boolean enabled;
    
    @Column(name = "sort_order", nullable = false)
    private int sortOrder;
    
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
