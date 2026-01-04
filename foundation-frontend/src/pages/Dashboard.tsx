import { useState, useEffect } from 'react';
import { RiDashboardLine, RiMoneyDollarCircleLine, RiMegaphoneLine, RiStarLine } from 'react-icons/ri';
import { API_BASE_URL, getDonatePopupSettings, type DonatePopupSettingsResponse } from '../api';
import { authFetch } from '../utils/auth';
import { formatCurrency, calculateProgress } from '../utils/currency';

interface Campaign {
  id: string;
  title: string;
  targetAmount: number;
  currentAmount?: number;
  active: boolean;
  featured?: boolean;
  urgent?: boolean;
  category?: {
    id: string;
    name: string;
    icon: string;
  };
}

interface Donation {
  id: string;
  amount: number;
  currency: string;
  donorName: string;
  campaignId: string;
  campaignTitle: string;
  status: string;
  createdAt: string;
}

export default function AdminDashboard() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [donations, setDonations] = useState<Donation[]>([]);
  const [spotlightSettings, setSpotlightSettings] = useState<DonatePopupSettingsResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [campaignsRes, donationsRes, spotlightData] = await Promise.all([
        authFetch(`${API_BASE_URL}/admin/campaigns`),
        authFetch(`${API_BASE_URL}/admin/donations`),
        getDonatePopupSettings()
      ]);
      
      const campaignsData = await campaignsRes.json();
      const donationsData = await donationsRes.json();
      
      setCampaigns(campaignsData);
      setDonations(donationsData);
      setSpotlightSettings(spotlightData);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="content-header">
        <h2><RiDashboardLine style={{verticalAlign: 'middle', marginRight: '0.5rem'}} /> Dashboard</h2>
        <p>Loading dashboard...</p>
      </div>
    );
  }

  const successfulDonations = donations.filter(d => d.status === 'SUCCESS').length;
  const pendingDonations = donations.filter(d => d.status === 'PENDING').length;
  const featuredCampaignsCount = campaigns.filter(c => c.featured && c.active).length;
  const spotlightCampaignTitle = spotlightSettings?.spotlightCampaign?.title || null;

  const successfulDonationsByCampaign = donations
    .filter(d => d.status === 'SUCCESS')
    .reduce((acc, donation) => {
      const campaignId = donation.campaignId;
      if (!acc[campaignId]) {
        acc[campaignId] = {
          campaignTitle: donation.campaignTitle,
          totalAmount: 0,
          count: 0,
        };
      }
      acc[campaignId].totalAmount += donation.amount;
      acc[campaignId].count += 1;
      return acc;
    }, {} as Record<string, { campaignTitle: string; totalAmount: number; count: number }>);

  const topCampaigns = Object.entries(successfulDonationsByCampaign)
    .sort(([, a], [, b]) => b.totalAmount - a.totalAmount)
    .slice(0, 5);

  return (
    <>
      <div className="content-header">
        <h2><RiDashboardLine style={{verticalAlign: 'middle', marginRight: '0.5rem'}} /> Dashboard</h2>
        <p>Overview of donations and campaign performance</p>
      </div>

      <div className="content-body">
        <div className="dashboard-container">
          {/* Summary Cards */}
          <div className="dashboard-cards">
            <div className="dashboard-card">
              <div className="card-icon"><RiMoneyDollarCircleLine size={40} /></div>
              <div className="card-content">
                <h3>Total Donations</h3>
                <p className="card-value">{donations.length}</p>
              </div>
            </div>
            <div className="dashboard-card">
              <div className="card-icon">✅</div>
              <div className="card-content">
                <h3>Successful</h3>
                <p className="card-value">{successfulDonations}</p>
              </div>
            </div>
            <div className="dashboard-card">
              <div className="card-icon">⏳</div>
              <div className="card-content">
                <h3>Pending</h3>
                <p className="card-value">{pendingDonations}</p>
              </div>
            </div>
            <div className="dashboard-card">
              <div className="card-icon"><RiMegaphoneLine size={40} /></div>
              <div className="card-content">
                <h3>Active Campaigns</h3>
                <p className="card-value">{campaigns.filter(c => c.active).length}</p>
              </div>
            </div>
            <div className="dashboard-card">
              <div className="card-icon"><RiStarLine size={40} /></div>
              <div className="card-content">
                <h3>Featured Active</h3>
                <p className="card-value">{featuredCampaignsCount}</p>
              </div>
            </div>
            {spotlightCampaignTitle && (
              <div className="dashboard-card" style={{ gridColumn: 'span 2', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }}>
                <div className="card-icon">🎯</div>
                <div className="card-content">
                  <h3>Spotlight Campaign</h3>
                  <p className="card-value" style={{ fontSize: '1rem', fontWeight: 'normal' }}>{spotlightCampaignTitle}</p>
                </div>
              </div>
            )}
          </div>

          {/* Top Campaigns Chart */}
          <div className="dashboard-section">
            <h2>🏆 Top 5 Campaigns by Donations</h2>
            <div className="campaigns-chart">
              {topCampaigns.length === 0 ? (
                <p style={{ textAlign: 'center', color: '#64748b', padding: '2rem' }}>
                  No donation data available yet
                </p>
              ) : (
                topCampaigns.map(([campaignId, data], index) => {
                  const campaign = campaigns.find(c => c.id === campaignId);
                  const percentage = campaign && campaign.targetAmount > 0
                    ? Math.min((data.totalAmount / campaign.targetAmount) * 100, 100)
                    : 0;

                  return (
                    <div key={campaignId} className="campaign-bar-item">
                      <div className="campaign-bar-header">
                        <span className="campaign-rank">#{index + 1}</span>
                        <span className="campaign-name">{data.campaignTitle}</span>
                        <span className="campaign-stats">
                          <strong>{formatCurrency(data.totalAmount, 'usd', { decimals: 0 })}</strong>
                          <span className="donation-count">({data.count} donations)</span>
                        </span>
                      </div>
                      <div className="progress-bar-container">
                        <div 
                          className="progress-bar-fill" 
                          style={{ 
                            width: `${percentage}%`,
                            background: `linear-gradient(90deg, 
                              ${index === 0 ? '#10b981' : index === 1 ? '#3b82f6' : '#8b5cf6'} 0%, 
                              ${index === 0 ? '#059669' : index === 1 ? '#2563eb' : '#7c3aed'} 100%)`
                          }}
                        >
                          <span className="progress-label">{percentage.toFixed(1)}%</span>
                        </div>
                      </div>
                      {campaign && (
                        <div className="campaign-target">
                          Target: {formatCurrency(campaign.targetAmount, 'usd', { decimals: 0 })}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Recent Donations */}
          <div className="dashboard-section">
            <h2>📋 Recent Donations</h2>
            {donations.length === 0 ? (
              <p style={{ textAlign: 'center', color: '#64748b', padding: '2rem' }}>
                No donations yet
              </p>
            ) : (
              <div className="recent-donations-list">
                {donations.slice(0, 10).map((donation) => (
                  <div key={donation.id} className="recent-donation-item">
                    <div className="donation-avatar">
                      {(donation.donorName || 'A').charAt(0).toUpperCase()}
                    </div>
                    <div className="donation-details">
                      <strong>{donation.donorName || 'Anonymous'}</strong>
                      <span className="donation-campaign">{donation.campaignTitle || 'Unknown Campaign'}</span>
                    </div>
                    <div className="donation-amount-badge">
                      {formatCurrency(donation.amount || 0, donation.currency || 'eur')}
                    </div>
                    <span className={`status-badge ${(donation.status || 'pending').toLowerCase()}`}>
                      {donation.status || 'PENDING'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Campaign Performance Grid */}
          <div className="dashboard-section">
            <h2>📊 All Campaigns Performance</h2>
            {campaigns.length === 0 ? (
              <p style={{ textAlign: 'center', color: '#64748b', padding: '2rem' }}>
                No campaigns created yet
              </p>
            ) : (
              <div className="campaigns-grid">
                {campaigns.map((campaign) => {
                  const successfulCampaignDonations = donations.filter(
                    d => d.campaignId === campaign.id && d.status === 'SUCCESS'
                  );
                  const totalRaised = successfulCampaignDonations.reduce((sum, d) => sum + d.amount, 0);
                  const progress = calculateProgress(totalRaised, campaign.targetAmount);

                  const isSpotlight = spotlightSettings?.spotlightCampaignId === campaign.id;
                  
                  return (
                    <div key={campaign.id} className="campaign-performance-card">
                      <div className="campaign-card-header">
                        <h3>{campaign.title}</h3>
                        {isSpotlight && <span className="badge-spotlight" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white', padding: '4px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 'bold' }}>🎯 SPOTLIGHT</span>}
                        {campaign.featured && <span className="badge-featured">⭐ Featured</span>}
                        {campaign.urgent && <span className="badge-urgent">🔥 Urgent</span>}
                      </div>
                      <div className="campaign-card-stats">
                        <div className="stat-item">
                          <span className="stat-label">Raised</span>
                          <span className="stat-value">{formatCurrency(totalRaised, 'usd', { decimals: 0 })}</span>
                        </div>
                        <div className="stat-item">
                          <span className="stat-label">Goal</span>
                          <span className="stat-value">{formatCurrency(campaign.targetAmount, 'usd', { decimals: 0 })}</span>
                        </div>
                        <div className="stat-item">
                          <span className="stat-label">Donations</span>
                          <span className="stat-value">{successfulCampaignDonations.length}</span>
                        </div>
                      </div>
                      <div className="progress-bar-container">
                        <div 
                          className="progress-bar-fill" 
                          style={{ width: `${Math.min(progress, 100)}%` }}
                        >
                          <span className="progress-label">{progress.toFixed(1)}%</span>
                        </div>
                      </div>
                      <div className="campaign-card-footer">
                        <span className={`status-indicator ${campaign.active ? 'active' : 'inactive'}`}>
                          {campaign.active ? '🟢 Active' : '🔴 Inactive'}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
