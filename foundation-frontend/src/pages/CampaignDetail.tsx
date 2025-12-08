import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api, type Campaign } from '../api';
import './CampaignDetail.css';

export default function CampaignDetail() {
  const { id } = useParams<{ id: string }>();
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (id) {
      api.getCampaign(id)
        .then(data => {
          setCampaign(data);
          setLoading(false);
        })
        .catch(() => {
          setError('Failed to load campaign details.');
          setLoading(false);
        });
    }
  }, [id]);

  if (loading) {
    return <div className="container"><p className="loading">Loading...</p></div>;
  }

  if (error || !campaign) {
    return <div className="container"><p className="error">{error || 'Campaign not found'}</p></div>;
  }

  return (
    <div className="container">
      <div className="campaign-detail">
        <div className="detail-header">
          <h1>{campaign.title}</h1>
          {campaign.active && <span className="badge-active">Active Campaign</span>}
        </div>

        <div className="detail-content">
          <div className="main-content">
            <h2>About This Campaign</h2>
            <p className="full-description">{campaign.description}</p>
          </div>

          <div className="sidebar">
            <div className="donation-box">
              <h3>Support This Campaign</h3>
              <div className="goal-info">
                <div className="goal-amount">
                  <span className="amount">${(campaign.targetAmount / 100).toLocaleString()}</span>
                  <span className="currency">{campaign.currency.toUpperCase()}</span>
                </div>
                <p className="goal-label">Funding Goal</p>
              </div>
              
              <Link to={`/donate/${campaign.id}`} className="btn-donate-large">
                Donate Now
              </Link>
              
              <p className="secure-note">🔒 Secure payment via Stripe</p>
            </div>
          </div>
        </div>

        <div className="back-link">
          <Link to="/campaigns">← Back to all campaigns</Link>
        </div>
      </div>
    </div>
  );
}
