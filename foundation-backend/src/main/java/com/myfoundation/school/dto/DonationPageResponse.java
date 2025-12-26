package com.myfoundation.school.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DonationPageResponse {
    private List<DonationResponse> items;
    private int page;
    private int size;
    private long totalItems;
    private int totalPages;
}
