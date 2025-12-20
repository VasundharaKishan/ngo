import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api, type Campaign } from '../api';
import { formatCurrency, formatCurrencyCode } from '../utils/currency';
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

        {campaign.imageUrl && (
          <div className="detail-image-container">
            <img 
              src={campaign.imageUrl} 
              alt={campaign.title}
              className="detail-image"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
          </div>
        )}

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
                  <span className="amount">
                    {campaign.targetAmount != null 
                      ? formatCurrency(campaign.targetAmount, campaign.currency || 'eur', { includeSymbol: false })
                      : 'N/A'}
                  </span>
                  <span className="currency">{formatCurrencyCode(campaign.currency || 'eur')}</span>
                </div>
                <p className="goal-label">Funding Goal</p>
              </div>
              
              {campaign.active ? (
                <>
                  <Link to={`/donate/${campaign.id}`} className="btn-donate-large">
                    Donate Now
                  </Link>
                  <p className="secure-note">🔒 Secure payment via Stripe</p>
                </>
              ) : (
                <div className="inactive-notice">
                  <p className="inactive-message">⚠️ This campaign is not currently accepting donations</p>
                </div>
              )}
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
