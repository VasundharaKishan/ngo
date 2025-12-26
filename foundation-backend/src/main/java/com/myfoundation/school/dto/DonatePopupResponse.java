package com.myfoundation.school.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO for donate popup campaign response
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DonatePopupResponse {
    private CampaignPopupDto campaign;
    private String mode; // "SPOTLIGHT" or "FALLBACK"
    private String fallbackReason; // null, "NO_SPOTLIGHT_SET", "NO_ACTIVE_CAMPAIGNS"
}
