package com.myfoundation.school.heropanel;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

/**
 * Single-row entity for the editorial hero block at the top of the public home page.
 * Distinct from {@code HeroSlide} (carousel) — this is one headline + CTA panel, not a set.
 */
@Entity
@Table(name = "hero_panel")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class HeroPanel {

    /** Fixed primary key. Always {@code 1L}. */
    public static final long SINGLETON_ID = 1L;

    @Id
    @Column(name = "id", nullable = false)
    private Long id;

    @Column(name = "eyebrow", length = 120)
    private String eyebrow;

    @Column(name = "headline", nullable = false, length = 240)
    private String headline;

    @Column(name = "subtitle", length = 500)
    private String subtitle;

    @Column(name = "primary_cta_label", length = 64)
    private String primaryCtaLabel;

    @Column(name = "primary_cta_href", length = 500)
    private String primaryCtaHref;

    @Column(name = "background_image_url", length = 1000)
    private String backgroundImageUrl;

    @Enumerated(EnumType.STRING)
    @Column(name = "background_focus", nullable = false, length = 16)
    private BackgroundFocus backgroundFocus;

    @Column(name = "enabled", nullable = false)
    private boolean enabled;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    @Column(name = "updated_by", length = 255)
    private String updatedBy;

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = Instant.now();
    }

    /** True when the admin has authored a primary CTA with both label and href. */
    public boolean hasPrimaryCta() {
        return primaryCtaLabel != null && !primaryCtaLabel.isBlank()
                && primaryCtaHref != null && !primaryCtaHref.isBlank();
    }
}
