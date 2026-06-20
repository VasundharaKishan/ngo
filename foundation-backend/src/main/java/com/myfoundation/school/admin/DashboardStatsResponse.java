package com.myfoundation.school.admin;

import lombok.Builder;
import lombok.Data;

import java.util.List;

@Data
@Builder
public class DashboardStatsResponse {

    private long totalRaised;
    private long totalDonations;
    private long totalDonors;
    private long averageDonation;
    private long activeCampaigns;
    private long monthlyRaised;
    private long monthlyDonations;
    private List<RecentDonation> recentDonations;
    private List<TopCampaign> topCampaigns;

    @Data
    @Builder
    public static class RecentDonation {
        private String id;
        private String donorName;
        private long amount;
        private String currency;
        private String campaignTitle;
        private String status;
        private String createdAt;
    }

    @Data
    @Builder
    public static class TopCampaign {
        private String id;
        private String title;
        private long raised;
        private long target;
        private long donationCount;
    }
}
