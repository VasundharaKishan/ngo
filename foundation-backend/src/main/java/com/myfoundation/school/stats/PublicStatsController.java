package com.myfoundation.school.stats;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Public API controller for homepage statistics.
 * Provides real-time KPI data computed from the database.
 */
@RestController
@RequestMapping("/api/public")
@RequiredArgsConstructor
@Slf4j
public class PublicStatsController {
    
    private final StatsService statsService;
    
    /**
     * Get public homepage statistics.
     * 
     * Returns real-time calculated KPIs:
     * - Lives Impacted: SUM(beneficiariesCount) from active campaigns
     * - Active Campaigns: COUNT of active campaigns
     * - Funds Raised: SUM of successful donation amounts
     * - Success Rate: percentage of successful donations
     * 
     * @return PublicStatsDTO with current statistics
     */
    @GetMapping("/stats")
    public ResponseEntity<PublicStatsDTO> getPublicStats() {
        log.info("GET /api/public/stats - Fetching public statistics");
        PublicStatsDTO stats = statsService.getPublicStats();
        return ResponseEntity.ok(stats);
    }
}
