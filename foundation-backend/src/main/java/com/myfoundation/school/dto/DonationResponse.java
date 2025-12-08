package com.myfoundation.school.dto;

import com.myfoundation.school.donation.DonationStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DonationResponse {
    
    private String id;
    private String donorName;
    private String donorEmail;
    private Long amount;
    private String currency;
    private DonationStatus status;
    private String campaignId;
    private String campaignTitle;
    private Instant createdAt;
}
