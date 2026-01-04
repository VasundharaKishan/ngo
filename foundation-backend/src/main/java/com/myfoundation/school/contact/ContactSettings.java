package com.myfoundation.school.contact;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Entity
@Table(name = "contact_settings")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ContactSettings {
    
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;
    
    @Column(nullable = true)
    private String email;
    
    @Column(columnDefinition = "TEXT")
    private String locationsJson;
    
    @Column(nullable = true, columnDefinition = "BOOLEAN DEFAULT true")
    @Builder.Default
    private Boolean showInFooter = true;
    
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
