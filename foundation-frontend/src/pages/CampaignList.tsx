import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, type Campaign } from '../api';
import './CampaignList.css';

export default function CampaignList() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api.getCampaigns()
      .then(data => {
        setCampaigns(data);
        setLoading(false);
      })
      .catch(() => {
        setError('Failed to load campaigns. Please try again.');
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="container">
        <p className="loading">Loading campaigns...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container">
        <p className="error">{error}</p>
      </div>
    );
  }

  return (
    <div className="container">
      <h1>All Campaigns</h1>
      <p className="subtitle">Choose a campaign to support our mission</p>
      
      <div className="campaign-grid">
        {campaigns.map(campaign => (
          <div key={campaign.id} className="campaign-card">
            <div className="card-header">
              <h2>{campaign.title}</h2>
              {campaign.active && <span className="badge-active">Active</span>}
            </div>
            <p className="description">{campaign.shortDescription}</p>
            <div className="campaign-meta">
              <div className="meta-item">
                <span className="label">Goal:</span>
                <span className="value">
                  ${(campaign.targetAmount / 100).toLocaleString()} {campaign.currency.toUpperCase()}
                </span>
              </div>
            </div>
            <div className="card-actions">
              <Link to={`/campaigns/${campaign.id}`} className="btn-secondary">
                View Details
              </Link>
              <Link to={`/donate/${campaign.id}`} className="btn-primary">
                Donate Now
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
