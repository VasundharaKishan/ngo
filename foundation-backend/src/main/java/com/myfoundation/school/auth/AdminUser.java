package com.myfoundation.school.auth;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.List;

@Entity
@Table(name = "admin_users")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AdminUser {
    
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;
    
    @Column(nullable = false, unique = true)
    private String username;
    
    @Column(nullable = false, unique = true)
    private String email;
    
    @Column(nullable = false)
    private String password;
    
    @Column(nullable = false)
    private String fullName;
    
    @Column(nullable = false)
    @Enumerated(EnumType.STRING)
    private UserRole role;
    
    @Column(nullable = false)
    @Builder.Default
    private Boolean active = true;
    
    @Column
    private Instant lastLoginAt;
    
    @Column(nullable = false, updatable = false)
    private Instant createdAt;
    
    @Column(nullable = false)
    private Instant updatedAt;
    
    @JsonIgnore
    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<UserSecurityAnswer> securityAnswers;
    
    @PrePersist
    protected void onCreate() {
        createdAt = Instant.now();
        updatedAt = Instant.now();
    }
    
    @PreUpdate
    protected void onUpdate() {
        updatedAt = Instant.now();
    }

    public boolean isActive() {
        return Boolean.TRUE.equals(active);
    }
}
