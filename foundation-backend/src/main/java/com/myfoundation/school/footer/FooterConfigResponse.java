package com.myfoundation.school.footer;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Response DTO for footer configuration.
 * Returns all footer settings to the client.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FooterConfigResponse {
    private String tagline;
    private SocialMediaLinks socialMedia;
    private Boolean showQuickLinks;
    private Boolean showGetInvolved;
    private String copyrightText;
    private String disclaimerText;
}
