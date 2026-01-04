package com.myfoundation.school.footer;

import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Request DTO for updating footer configuration.
 * Contains all customizable footer settings.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FooterConfigRequest {

    @Size(max = 500, message = "Tagline must not exceed 500 characters")
    private String tagline;

    private SocialMediaLinks socialMedia;

    private Boolean showQuickLinks;

    private Boolean showGetInvolved;

    @Size(max = 500, message = "Copyright text must not exceed 500 characters")
    private String copyrightText;

    @Size(max = 1000, message = "Disclaimer text must not exceed 1000 characters")
    private String disclaimerText;
}
