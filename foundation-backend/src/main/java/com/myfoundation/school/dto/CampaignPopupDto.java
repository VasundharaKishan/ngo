package com.myfoundation.school.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO for campaign in donate popup
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CampaignPopupDto {
    private String id;
    private String title;
    private String shortDescription;
    private String imageUrl;
    private Long targetAmount;
    private Long currentAmount;
    private String currency;
    private Integer progressPercent;
    private String badgeText; // "Active Now" or "Featured Campaign"
    private String activeNote; // Optional message like "We are actively working on this!"
    private String categoryName;
    private String categoryIcon;
}
