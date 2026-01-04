package com.myfoundation.school.stats;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO for public homepage statistics.
 * All values are computed in real-time from the database.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PublicStatsDTO {
    
    /**
     * Total number of lives impacted across all active campaigns.
     * Calculated from SUM(beneficiariesCount) where active = true.
     */
    private Long livesImpacted;
    
    /**
     * Number of currently active campaigns.
     * Calculated from COUNT(*) where active = true.
     */
    private Long activeCampaigns;
    
    /**
     * Total funds raised from successful donations.
     * Calculated from SUM(amount) where status = SUCCESS.
     */
    private Long fundsRaised;
    
    /**
     * Success rate of donations as a percentage (0-100).
     * Calculated from (SUCCESS_COUNT / TOTAL_COUNT) * 100.
     * Returns null if no donations exist.
     */
    private Double successRate;
}
