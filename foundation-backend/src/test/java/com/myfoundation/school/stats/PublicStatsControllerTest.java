package com.myfoundation.school.stats;

import com.myfoundation.school.security.RateLimiterService;
import com.myfoundation.school.security.JwtService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class PublicStatsControllerTest {
    
    @Autowired
    private MockMvc mockMvc;
    
    @MockBean
    private StatsService statsService;
    
    @MockBean
    private RateLimiterService rateLimiterService;
    
    @Test
    void getPublicStats_shouldReturnStatsSuccessfully() throws Exception {
        // Arrange
        PublicStatsDTO mockStats = PublicStatsDTO.builder()
                .livesImpacted(5000L)
                .activeCampaigns(20L)
                .fundsRaised(2500000L)
                .successRate(95.5)
                .build();
        
        when(statsService.getPublicStats()).thenReturn(mockStats);
        when(rateLimiterService.isAllowed(anyString(), anyInt(), anyLong())).thenReturn(true);
        
        // Act & Assert
        mockMvc.perform(get("/api/public/stats")
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.livesImpacted").value(5000))
                .andExpect(jsonPath("$.activeCampaigns").value(20))
                .andExpect(jsonPath("$.fundsRaised").value(2500000))
                .andExpect(jsonPath("$.successRate").value(95.5));
    }
    
    @Test
    void getPublicStats_withNullSuccessRate_shouldReturnNull() throws Exception {
        // Arrange
        PublicStatsDTO mockStats = PublicStatsDTO.builder()
                .livesImpacted(0L)
                .activeCampaigns(0L)
                .fundsRaised(0L)
                .successRate(null)
                .build();
        
        when(statsService.getPublicStats()).thenReturn(mockStats);
        when(rateLimiterService.isAllowed(anyString(), anyInt(), anyLong())).thenReturn(true);
        
        // Act & Assert
        mockMvc.perform(get("/api/public/stats")
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.livesImpacted").value(0))
                .andExpect(jsonPath("$.activeCampaigns").value(0))
                .andExpect(jsonPath("$.fundsRaised").value(0))
                .andExpect(jsonPath("$.successRate").isEmpty());
    }
}
