package com.myfoundation.school.config;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class SiteConfigRequest {
    
    @NotBlank(message = "Config key is required")
    private String configKey;
    
    @NotBlank(message = "Config value is required")
    private String configValue;
    
    private String description;
}
