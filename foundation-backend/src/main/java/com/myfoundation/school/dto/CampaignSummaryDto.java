package com.myfoundation.school.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

/**
 * DTO for campaign summary in admin settings
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CampaignSummaryDto {
    private String id;
    private String title;
    private Boolean active;
    private Boolean featured;
    private String categoryName;
    private Instant updatedAt;
}
