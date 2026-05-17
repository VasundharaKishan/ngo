package com.myfoundation.school.announcementbar;

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
 * Single-row entity for the site-wide announcement bar rendered above the public header.
 *
 * <p>Follows the same singleton pattern as {@link com.myfoundation.school.heropanel.HeroPanel}:
 * fixed primary key {@code 1L} enforced at the database layer with a {@code CHECK (id = 1)}
 * constraint. One announcement at a time is simpler to ship than a list; if we later need
 * scheduled rotations we can promote to a list table without breaking the public contract.</p>
 */
@Entity
@Table(name = "announcement_bar")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AnnouncementBar {

    /** Fixed primary key. Always {@code 1L}. */
    public static final long SINGLETON_ID = 1L;

    @Id
    @Column(name = "id", nullable = false)
    private Long id;

    @Column(name = "enabled", nullable = false)
    private boolean enabled;

    @Column(name = "icon_emoji", length = 16)
    private String iconEmoji;

    @Column(name = "message", nullable = false, length = 500)
    private String message;

    @Column(name = "link_url", length = 500)
    private String linkUrl;

    @Column(name = "link_label", length = 64)
    private String linkLabel;

    @Enumerated(EnumType.STRING)
    @Column(name = "style", nullable = false, length = 16)
    private AnnouncementStyle style;

    @Column(name = "dismissible", nullable = false)
    private boolean dismissible;

    /** Inclusive lower bound; null = no lower bound. */
    @Column(name = "starts_at")
    private Instant startsAt;

    /** Inclusive upper bound; null = no upper bound. */
    @Column(name = "ends_at")
    private Instant endsAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    @Column(name = "updated_by", length = 120)
    private String updatedBy;

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = Instant.now();
    }

    /**
     * True when the bar should be shown to public visitors <em>right now</em> — enabled
     * plus within the optional time window.
     */
    public boolean isWithinWindow(Instant now) {
        if (!enabled) return false;
        if (startsAt != null && now.isBefore(startsAt)) return false;
        if (endsAt != null && now.isAfter(endsAt)) return false;
        return true;
    }

    /** True when admin has authored both a link label and URL. */
    public boolean hasLink() {
        return linkLabel != null && !linkLabel.isBlank()
                && linkUrl != null && !linkUrl.isBlank();
    }
}
