package com.myfoundation.school.footer;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO representing social media links configuration.
 * Used within FooterConfigResponse.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SocialMediaLinks {
    private String facebook;
    private String twitter;
    private String instagram;
    private String youtube;
    private String linkedin;
}
