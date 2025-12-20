package com.myfoundation.school.admin;

import com.myfoundation.school.campaign.Category;
import lombok.Data;

import java.time.Instant;

/**
 * Response DTO for admin campaign operations.
 * Includes all campaign fields with currentAmount calculated from successful donations.
 */
@Data
public class AdminCampaignResponse {
    
    private String id;
    private String title;
    private String slug;
    private String shortDescription;
    private String fullDescription;
    private Long targetAmount;
    
    /**
     * The current amount raised for this campaign.
     * This value is dynamically calculated from the sum of all successful donations.
     */
    private Long currentAmount;
    
    private String currency;
    private String imageUrl;
    private String location;
    private Integer beneficiariesCount;
    private Boolean active;
    private Boolean featured;
    private Boolean urgent;
    private Instant createdAt;
    private Instant updatedAt;
    private Category category;
}
