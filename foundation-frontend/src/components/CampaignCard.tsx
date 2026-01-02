import { Link } from 'react-router-dom';
import { type Campaign } from '../api';
import { formatCurrency, formatCurrencyCode } from '../utils/currency';

interface CampaignCardProps {
  campaign: Campaign;
}

export default function CampaignCard({ campaign }: CampaignCardProps) {
  return (
    <div className="campaign-card">
      <div className="card-header">
        <h2>{campaign.title}</h2>
        {campaign.active && <span className="badge-active">Active</span>}
      </div>
      <p className="description">{campaign.shortDescription}</p>
      <div className="campaign-meta">
        <div className="meta-item">
          <span className="label">Goal:</span>
          <span className="value">
            {formatCurrency(campaign.targetAmount, campaign.currency)} {formatCurrencyCode(campaign.currency)}
          </span>
        </div>
      </div>
      <div className="card-actions">
        <Link to={`/campaigns/${campaign.id}`} className="btn-secondary">
          View Details
        </Link>
        {campaign.active && (
          <Link to={`/donate/${campaign.id}`} className="btn-primary">
            <span className="heart-icon" aria-hidden="true">❤️</span>
            Donate
          </Link>
        )}
        {!campaign.active && (
          <span className="inactive-label">Not Accepting Donations</span>
        )}
      </div>
    </div>
  );
}
