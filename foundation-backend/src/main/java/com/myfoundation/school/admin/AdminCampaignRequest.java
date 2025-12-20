package com.myfoundation.school.admin;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.Data;

@Data
public class AdminCampaignRequest {
    
    @NotBlank(message = "Title is required")
    private String title;
    
    @NotBlank(message = "Short description is required")
    private String shortDescription;
    
    @NotBlank(message = "Full description is required")
    private String fullDescription;
    
    @NotBlank(message = "Category ID is required")
    private String categoryId;
    
    @NotNull(message = "Target amount is required")
    @Positive(message = "Target amount must be positive")
    private Long targetAmount;
    
    /**
     * @deprecated This field is no longer used. Current amount is calculated from successful donations.
     */
    @Deprecated
    private Long currentAmount;
    
    private String imageUrl;
    
    private String location;
    
    private Integer beneficiariesCount;
    
    private Boolean featured = false;
    
    private Boolean urgent = false;
    
    private Boolean active = true;
}
