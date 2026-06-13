package com.myfoundation.school.admin;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class AdminCampaignRequest {
    
    @NotBlank(message = "Title is required")
    @Size(max = 200, message = "Title must be 200 characters or fewer")
    private String title;

    @NotBlank(message = "Short description is required")
    @Size(max = 200, message = "Short description must be 200 characters or fewer")
    private String shortDescription;

    @NotBlank(message = "Full description is required")
    @Size(max = 8000, message = "Full description must be 8000 characters or fewer")
    private String fullDescription;
    
    @NotBlank(message = "Category ID is required")
    private String categoryId;
    
    @NotNull(message = "Target amount is required")
    @Positive(message = "Target amount must be positive")
    private Long targetAmount;
    
    private String imageUrl;
    
    private String location;
    
    @Min(value = 0, message = "Beneficiaries count cannot be negative")
    private Integer beneficiariesCount;
    
    private Boolean featured = false;
    
    private Boolean urgent = false;
    
    private Boolean active = true;

    /**
     * Currency code for the campaign (e.g., INR, USD, EUR, GBP).
     * Defaults to INR (platform primary currency) if not specified.
     */
    @Pattern(regexp = "(?i)^(inr|usd|eur|gbp|aud|cad)$", message = "Unsupported currency code")
    private String currency = "INR";
}
