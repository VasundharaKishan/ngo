package com.myfoundation.school.home;

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
    private UUID id;
    private boolean enabled;
    private int sortOrder;
    private Map<String, Object> config;
}
