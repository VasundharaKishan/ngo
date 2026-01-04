package com.myfoundation.school.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "Request to create a Stripe checkout session for a donation")
public class DonationRequest {
    
    @NotNull(message = "Amount is required")
    @Positive(message = "Amount must be positive")
    @Schema(description = "Donation amount in the smallest currency unit (e.g., cents for USD)", 
            example = "5000", required = true)
    private Long amount;
    
    @NotBlank(message = "Currency is required")
    @Size(min = 3, max = 3, message = "Currency must be a 3-letter code")
    @Schema(description = "Currency code (ISO 4217)", example = "USD", required = true)
    private String currency;
    
    @Schema(description = "Donor's full name", example = "John Doe")
    private String donorName;
    
    @Email(message = "Invalid email format")
    @Schema(description = "Donor's email address", example = "john@example.com")
    private String donorEmail;
    
    @NotBlank(message = "Campaign ID is required")
    @Schema(description = "ID of the campaign to donate to", required = true)
    private String campaignId;
}
