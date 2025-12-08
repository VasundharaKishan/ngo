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
    private String currency;
    private Boolean active;
}
