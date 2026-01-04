package com.myfoundation.school.footer;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Entity representing footer configuration settings.
 * Stores all customizable footer content including tagline, social media links,
 * section visibility, and legal information.
 */
@Entity
@Table(name = "footer_settings")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FooterSettings {

    @Id
    @GeneratedValue
    private UUID id;

    @Column(name = "tagline", length = 500)
    private String tagline;

    @Column(name = "facebook_url", length = 500)
    private String facebookUrl;

    @Column(name = "twitter_url", length = 500)
    private String twitterUrl;

    @Column(name = "instagram_url", length = 500)
    private String instagramUrl;

    @Column(name = "youtube_url", length = 500)
    private String youtubeUrl;

    @Column(name = "linkedin_url", length = 500)
    private String linkedinUrl;

    @Column(name = "show_quick_links", nullable = false)
    @Builder.Default
    private Boolean showQuickLinks = true;

    @Column(name = "show_get_involved", nullable = false)
    @Builder.Default
    private Boolean showGetInvolved = true;

    @Column(name = "copyright_text", length = 500)
    private String copyrightText;

    @Column(name = "disclaimer_text", length = 1000)
    private String disclaimerText;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;
}
