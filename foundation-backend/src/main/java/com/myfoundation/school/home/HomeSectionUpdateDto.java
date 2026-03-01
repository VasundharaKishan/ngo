package com.myfoundation.school.home;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Map;
import java.util.UUID;

/**
 * DTO for updating HomeSection
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class HomeSectionUpdateDto {
    @NotNull(message = "Section ID is required")
    private UUID id;
    private boolean enabled;
    @Min(value = 0, message = "Sort order must be non-negative")
    private int sortOrder;
    private Map<String, Object> config;
}
