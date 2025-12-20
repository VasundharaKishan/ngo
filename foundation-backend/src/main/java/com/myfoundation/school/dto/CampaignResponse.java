package com.myfoundation.school.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CampaignResponse {
    
    private String id;
    private String title;
    private String slug;
    private String shortDescription;
    private String description;
    private Long targetAmount;
    
    /**
     * The current amount raised for this campaign.
     * This value is dynamically calculated from the sum of all successful donations.
     * It is NOT stored in the database but computed at runtime.
     */
    private Long currentAmount;
    private String currency;
    private Boolean active;
    private String categoryId;
    private String categoryName;
    private String categoryIcon;
    private String categoryColor;
    private String imageUrl;
    private String location;
    private Integer beneficiariesCount;
    private Boolean featured;
    private Boolean urgent;
}
