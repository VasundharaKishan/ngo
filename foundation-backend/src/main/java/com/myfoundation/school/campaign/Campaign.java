package com.myfoundation.school.campaign;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Entity
@Table(name = "campaigns")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Campaign {
    
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;
    
    @Column(nullable = false)
    private String title;
    
    @Column(nullable = false, unique = true)
    private String slug;
    
    @Column(length = 255)
    private String shortDescription;
    
    @Column(columnDefinition = "TEXT")
    private String description;
    
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "category_id")
    private Category category;
    
    @Column(nullable = false)
    private Long targetAmount;
    
    /**
     * @deprecated This field is kept for backward compatibility but is no longer used.
     * The current amount is now dynamically calculated from successful donations.
     * Use CampaignResponse.currentAmount instead, which is calculated at runtime.
     */
    @Deprecated
    @Column
    private Long currentAmount;
    
    @Column(nullable = false, length = 3)
    private String currency;
    
    @Column
    private String imageUrl;
    
    @Column
    private String location;
    
    @Column
    private Integer beneficiariesCount;
    
    @Column(nullable = false)
    @Builder.Default
    private Boolean active = true;
    
    @Column
    private Boolean featured;
    
    @Column
    private Boolean urgent;
    
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
