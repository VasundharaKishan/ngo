package com.myfoundation.school.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * Paginated response for public campaign list endpoint.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CampaignPageResponse {
    private List<CampaignResponse> items;
    private int page;
    private int size;
    private long totalItems;
    private int totalPages;
}
