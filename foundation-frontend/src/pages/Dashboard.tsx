import { useState, useEffect } from 'react';
import { RiDashboardLine, RiMoneyDollarCircleLine, RiGroupLine, RiCalendarLine, RiMegaphoneLine } from 'react-icons/ri';
import { API_BASE_URL } from '../api';
import { authFetch } from '../utils/auth';
import { formatCurrency, calculateProgress } from '../utils/currency';
import logger from '../utils/logger';

interface DashboardStats {
  totalRaised: number;
  totalDonations: number;
  totalDonors: number;
  averageDonation: number;
  activeCampaigns: number;
  monthlyRaised: number;
  monthlyDonations: number;
  recentDonations: {
    id: string;
    donorName: string;
    amount: number;
    currency: string;
    campaignTitle: string;
    status: string;
    createdAt: string;
  }[];
  topCampaigns: {
    id: string;
    title: string;
    raised: number;
    target: number;
    donationCount: number;
  }[];
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState(false);
  const [loadError, setLoadError] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    setAuthError(false);
    setLoadError('');
    try {
      const res = await authFetch(`${API_BASE_URL}/admin/dashboard/stats`);

      if (res.status === 401) {
        setAuthError(true);
        return;
      }

      if (!res.ok) {
        setLoadError(`Failed to load dashboard (${res.status})`);
        return;
      }

      setStats(await res.json());
    } catch (error) {
      logger.error('Dashboard', 'Error loading data:', error);
      setLoadError('Could not reach the server. Please check your connection.');
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

  if (authError) {
    return (
      <div className="content-header">
        <h2><RiDashboardLine style={{verticalAlign: 'middle', marginRight: '0.5rem'}} /> Dashboard</h2>
        <div style={{ marginTop: '1.5rem', padding: '1.5rem', background: '#fff3cd', border: '1px solid #ffc107', borderRadius: '8px', color: '#856404' }}>
          <strong>Session Expired</strong>
          <p style={{ margin: '0.5rem 0 1rem' }}>Your session has expired. Please log in again to view the dashboard.</p>
          <a href="/admin/login" style={{ background: '#2a3da8', color: 'white', padding: '0.5rem 1.25rem', borderRadius: '6px', textDecoration: 'none', fontWeight: 600 }}>
            Go to Login
          </a>
        </div>
      </div>
    );
  }

  if (loadError || !stats) {
    return (
      <div className="content-header">
        <h2><RiDashboardLine style={{verticalAlign: 'middle', marginRight: '0.5rem'}} /> Dashboard</h2>
        <div style={{ marginTop: '1.5rem', padding: '1.5rem', background: '#fee2e2', border: '1px solid #fca5a5', borderRadius: '8px', color: '#991b1b' }}>
          <strong>Error Loading Dashboard</strong>
          <p style={{ margin: '0.5rem 0 1rem' }}>{loadError}</p>
          <button onClick={loadData} style={{ background: '#2a3da8', color: 'white', padding: '0.5rem 1.25rem', borderRadius: '6px', border: 'none', cursor: 'pointer', fontWeight: 600 }}>
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="content-header">
        <h2><RiDashboardLine style={{verticalAlign: 'middle', marginRight: '0.5rem'}} /> Dashboard</h2>
        <p>Overview of donations and campaign performance</p>
      </div>

      <div className="content-body">
        <div className="dashboard-container">
          {/* KPI Cards */}
          <div className="dashboard-cards">
            <div className="dashboard-card" style={{ borderLeft: '4px solid #10b981' }}>
              <div className="card-icon"><RiMoneyDollarCircleLine size={36} color="#10b981" /></div>
              <div className="card-content">
                <p className="card-value">{formatCurrency(stats.totalRaised, 'usd', { decimals: 0 })}</p>
                <h3>Total Raised</h3>
              </div>
            </div>
            <div className="dashboard-card" style={{ borderLeft: '4px solid #3b82f6' }}>
              <div className="card-icon"><RiGroupLine size={36} color="#3b82f6" /></div>
              <div className="card-content">
                <p className="card-value">{stats.totalDonors}</p>
                <h3>Total Donors</h3>
              </div>
            </div>
            <div className="dashboard-card" style={{ borderLeft: '4px solid #8b5cf6' }}>
              <div className="card-icon"><RiMegaphoneLine size={36} color="#8b5cf6" /></div>
              <div className="card-content">
                <p className="card-value">{stats.activeCampaigns}</p>
                <h3>Active Campaigns</h3>
              </div>
            </div>
            <div className="dashboard-card" style={{ borderLeft: '4px solid #f59e0b' }}>
              <div className="card-icon"><RiCalendarLine size={36} color="#f59e0b" /></div>
              <div className="card-content">
                <p className="card-value">{formatCurrency(stats.monthlyRaised, 'usd', { decimals: 0 })}</p>
                <h3>This Month ({stats.monthlyDonations} donations)</h3>
              </div>
            </div>
          </div>

          {/* Two-column layout: Recent Donations + Top Campaigns */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
            {/* Recent Donations */}
            <div className="dashboard-section">
              <h2>Recent Donations</h2>
              {stats.recentDonations.length === 0 ? (
                <p style={{ textAlign: 'center', color: '#475569', padding: '2rem' }}>
                  No donations yet
                </p>
              ) : (
                <div className="recent-donations-list">
                  {stats.recentDonations.map((donation) => (
                    <div key={donation.id} className="recent-donation-item">
                      <div className="donation-avatar">
                        {(donation.donorName || 'A').charAt(0).toUpperCase()}
                      </div>
                      <div className="donation-details">
                        <strong>{donation.donorName}</strong>
                        <span className="donation-campaign">{donation.campaignTitle}</span>
                      </div>
                      <div className="donation-amount-badge">
                        {formatCurrency(donation.amount, donation.currency || 'usd')}
                      </div>
                      <span className={`status-badge ${donation.status.toLowerCase()}`}>
                        {donation.status}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Top Campaigns */}
            <div className="dashboard-section">
              <h2>Top Campaigns</h2>
              {stats.topCampaigns.length === 0 ? (
                <p style={{ textAlign: 'center', color: '#475569', padding: '2rem' }}>
                  No donation data available yet
                </p>
              ) : (
                <div className="campaigns-chart">
                  {stats.topCampaigns.map((campaign, index) => {
                    const percentage = campaign.target > 0
                      ? Math.min((campaign.raised / campaign.target) * 100, 100)
                      : 0;
                    return (
                      <div key={campaign.id} className="campaign-bar-item">
                        <div className="campaign-bar-header">
                          <span className="campaign-rank">#{index + 1}</span>
                          <span className="campaign-name">{campaign.title}</span>
                          <span className="campaign-stats">
                            <strong>{formatCurrency(campaign.raised, 'usd', { decimals: 0 })}</strong>
                            <span className="donation-count">({campaign.donationCount} donations)</span>
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
                            {percentage > 5 && <span className="progress-label">{percentage.toFixed(1)}%</span>}
                          </div>
                        </div>
                        <div className="campaign-target">
                          Target: {formatCurrency(campaign.target, 'usd', { decimals: 0 })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
