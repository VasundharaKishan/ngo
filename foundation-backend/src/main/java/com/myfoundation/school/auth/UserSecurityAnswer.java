package com.myfoundation.school.auth;

import jakarta.persistence.*;
import lombok.Data;
import java.time.Instant;

@Entity
@Table(name = "user_security_answers")
@Data
public class UserSecurityAnswer {
    
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;
    
    @ManyToOne
    @JoinColumn(name = "user_id", nullable = false)
    private AdminUser user;
    
    @ManyToOne
    @JoinColumn(name = "question_id", nullable = false)
    private SecurityQuestion question;
    
    @Column(nullable = false)
    private String answer; // SHA-256 hashed answer
    
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;
    
    @Column(name = "updated_at", nullable = false)
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
