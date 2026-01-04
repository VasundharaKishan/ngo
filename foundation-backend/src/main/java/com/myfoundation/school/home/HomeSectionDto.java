package com.myfoundation.school.home;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.Map;
import java.util.UUID;

/**
 * DTO for HomeSection entity
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class HomeSectionDto {
    private UUID id;
    private String type;
    private boolean enabled;
    private int sortOrder;
    private Map<String, Object> config;
    private Instant createdAt;
    private Instant updatedAt;
}
