package com.myfoundation.school.admin;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.Data;

import java.util.UUID;

@Data
public class AdminCampaignRequest {
    
    @NotBlank(message = "Title is required")
    private String title;
    
    @NotBlank(message = "Short description is required")
    private String shortDescription;
    
    @NotBlank(message = "Full description is required")
    private String fullDescription;
    
    @NotNull(message = "Category ID is required")
    private UUID categoryId;
    
    @NotNull(message = "Target amount is required")
    @Positive(message = "Target amount must be positive")
    private Long targetAmount;
    
    private Long currentAmount;
    
    private String imageUrl;
    
    private String location;
    
    private Integer beneficiariesCount;
    
    private Boolean featured = false;
    
    private Boolean urgent = false;
    
    private Boolean active = true;
}
