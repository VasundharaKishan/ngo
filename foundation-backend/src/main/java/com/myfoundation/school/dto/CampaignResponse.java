package com.myfoundation.school.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "Campaign details including donation progress and category information")
public class CampaignResponse {
    
    @Schema(description = "Unique campaign identifier")
    private String id;
    
    @Schema(description = "Campaign title", example = "Build a School Library")
    private String title;
    
    @Schema(description = "URL-friendly slug", example = "build-school-library")
    private String slug;
    
    @Schema(description = "Brief campaign summary")
    private String shortDescription;
    
    @Schema(description = "Detailed campaign description with full context")
    private String description;
    
    @Schema(description = "Fundraising goal amount in smallest currency unit", example = "100000")
    private Long targetAmount;
    
    /**
     * The current amount raised for this campaign.
     * This value is dynamically calculated from the sum of all successful donations.
     * It is NOT stored in the database but computed at runtime.
     */
    @Schema(description = "Current amount raised (dynamically calculated)", example = "45000")
    private Long currentAmount;
    
    @Schema(description = "Currency code", example = "USD")
    private String currency;
    
    @Schema(description = "Whether campaign is accepting donations")
    private Boolean active;
    
    @Schema(description = "Category identifier")
    private String categoryId;
    
    @Schema(description = "Category display name", example = "Education")
    private String categoryName;
    
    @Schema(description = "Category icon identifier", example = "book")
    private String categoryIcon;
    
    @Schema(description = "Category color hex code", example = "#3B82F6")
    private String categoryColor;
    
    @Schema(description = "Campaign image URL")
    private String imageUrl;
    
    @Schema(description = "Campaign location", example = "Nairobi, Kenya")
    private String location;
    
    @Schema(description = "Number of beneficiaries", example = "500")
    private Integer beneficiariesCount;
    
    @Schema(description = "Whether campaign is featured on homepage")
    private Boolean featured;
    
    @Schema(description = "Whether campaign is marked as urgent")
    private Boolean urgent;
}
