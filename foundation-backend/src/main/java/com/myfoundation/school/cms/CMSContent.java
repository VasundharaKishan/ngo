package com.myfoundation.school.cms;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Entity
@Table(name = "cms_content")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CMSContent {
    
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;
    
    @Column(nullable = false, length = 100)
    private String section;
    
    @Column(nullable = false, length = 100)
    private String contentKey;
    
    @Column(nullable = false, length = 50)
    private String contentType;
    
    @Column(nullable = false, columnDefinition = "TEXT")
    private String contentValue;
    
    @Column
    private Integer displayOrder = 0;
    
    @Column(nullable = false)
    @Builder.Default
    private Boolean active = true;
    
    @Column(nullable = false, updatable = false)
    private Instant createdAt;
    
    @Column(nullable = false)
    private Instant updatedAt;
    
    @PrePersist
    protected void onCreate() {
        createdAt = Instant.now();
        updatedAt = Instant.now();
    }
    
    @PreUpdate
    protected void onUpdate() {
        updatedAt = Instant.now();
    }
}
