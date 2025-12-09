package com.myfoundation.school.admin;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class AdminCategoryRequest {
    
    @NotBlank(message = "Name is required")
    private String name;
    
    @NotBlank(message = "Slug is required")
    private String slug;
    
    private String description;
    
    @NotBlank(message = "Icon is required")
    private String icon;
    
    @NotBlank(message = "Color is required")
    private String color;
    
    @NotNull(message = "Display order is required")
    private Integer displayOrder;
    
    private Boolean active = true;
}
