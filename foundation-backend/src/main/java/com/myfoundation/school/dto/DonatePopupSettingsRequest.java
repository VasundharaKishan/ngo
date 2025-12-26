package com.myfoundation.school.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO for updating donate popup settings
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class DonatePopupSettingsRequest {
    private String campaignId; // nullable - null means clear spotlight
}
