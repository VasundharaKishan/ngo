package com.myfoundation.school.home;

import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

@Entity
@Table(name = "home_sections")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class HomeSection {
    
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;
    
    @Column(name = "type", nullable = false, length = 50)
    private String type;
    
    @Column(name = "enabled", nullable = false)
    private boolean enabled;
    
    @Column(name = "sort_order", nullable = false)
    private int sortOrder;
    
    @Column(name = "config_json", columnDefinition = "TEXT")
    private String configJson;
    
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;
    
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;
    
    @PrePersist
    protected void onCreate() {
        createdAt = Instant.now();
        updatedAt = Instant.now();
    }
    
    @PreUpdate
    protected void onUpdate() {
        updatedAt = Instant.now();
    }
    
    /**
     * Parse config_json to Map using Jackson
     */
    @Transient
    public Map<String, Object> getConfigMap() {
        if (configJson == null || configJson.trim().isEmpty()) {
            return new HashMap<>();
        }
        
        try {
            ObjectMapper mapper = new ObjectMapper();
            return mapper.readValue(configJson, 
                    mapper.getTypeFactory().constructMapType(Map.class, String.class, Object.class));
        } catch (Exception e) {
            throw new RuntimeException("Failed to parse config JSON", e);
        }
    }
    
    /**
     * Set config from Map, serializing to JSON using Jackson
     */
    @Transient
    public void setConfigMap(Map<String, Object> config) {
        if (config == null || config.isEmpty()) {
            this.configJson = null;
            return;
        }
        
        try {
            ObjectMapper mapper = new ObjectMapper();
            this.configJson = mapper.writeValueAsString(config);
        } catch (Exception e) {
            throw new RuntimeException("Failed to serialize config to JSON", e);
        }
    }
}
