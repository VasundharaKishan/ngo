package com.myfoundation.school.settings;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Entity
@Table(name = "site_settings")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SiteSetting {
    
    @Id
    @Column(name = "setting_key", nullable = false, unique = true)
    private String key;
    
    @Column(name = "setting_value", nullable = false, columnDefinition = "TEXT")
    private String value;
    
    @Enumerated(EnumType.STRING)
    @Column(name = "setting_type", nullable = false)
    private SettingType type;
    
    @Column(name = "is_public", nullable = false)
    private boolean isPublic = false;
    
    @Column(name = "description", columnDefinition = "TEXT")
    private String description;
    
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;
    
    @Column(name = "updated_by")
    private String updatedBy;
    
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;
    
    @PrePersist
    protected void onCreate() {
        createdAt = Instant.now();
        updatedAt = Instant.now();
    }
    
    @PreUpdate
    protected void onUpdate() {
        updatedAt = Instant.now();
    }
    
    public enum SettingType {
        STRING,
        INTEGER,
        BOOLEAN,
        JSON
    }
}
