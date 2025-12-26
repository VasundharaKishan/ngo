package com.myfoundation.school.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO for donate popup settings response
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DonatePopupSettingsResponse {
    private String spotlightCampaignId;
    private CampaignSummaryDto spotlightCampaign;
}
