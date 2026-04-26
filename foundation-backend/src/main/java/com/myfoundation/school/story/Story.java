package com.myfoundation.school.story;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

/**
 * One impact story — a short narrative quote from a beneficiary or caregiver, with
 * attribution and an optional supporting image.
 *
 * <p>See {@code V29__create_stories_table.sql} for the rationale on registration gating
 * and on storing program affiliation as a free-text tag rather than a campaign FK.</p>
 */
@Entity
@Table(name = "stories")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Story {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "title", nullable = false, length = 160)
    private String title;

    /** Multi-paragraph allowed; backend trims but does not collapse line breaks. */
    @Column(name = "quote", nullable = false, columnDefinition = "TEXT")
    private String quote;

    /** Speaker / attribution line, e.g. "Priya, age 11 — Class 6 student". */
    @Column(name = "attribution", nullable = false, length = 160)
    private String attribution;

    @Column(name = "image_url", length = 1000)
    private String imageUrl;

    /** Free-text program tag for grouping (e.g. "Education", "Healthcare"). */
    @Column(name = "program_tag", length = 80)
    private String programTag;

    @Column(name = "location", length = 120)
    private String location;

    @Column(name = "enabled", nullable = false)
    private boolean enabled;

    @Column(name = "sort_order", nullable = false)
    private int sortOrder;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    @Column(name = "updated_by", length = 120)
    private String updatedBy;

    @PreUpdate
    protected void onUpdate() {
        updatedAt = Instant.now();
    }
}
