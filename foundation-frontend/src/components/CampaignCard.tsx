import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { type Campaign } from '../api';
import { formatCurrency, calculateProgress } from '../utils/currency';
import { IMAGES } from '../config/constants';
import { getThumbnailUrl } from '../utils/imageUtils';

interface CampaignCardProps {
  campaign: Campaign;
}

function CampaignCard({ campaign }: CampaignCardProps) {
  const { t } = useTranslation();
  const progress = calculateProgress(campaign.currentAmount, campaign.targetAmount);
  const isAlmostFunded = progress >= 85;
  const remaining = campaign.targetAmount && campaign.currentAmount != null
    ? Math.max(0, campaign.targetAmount - campaign.currentAmount)
    : null;

  return (
    <div className="campaign-card" data-testid="campaign-card">
      <div className="card-image-container">
        {campaign.imageUrl ? (
          <img
            src={getThumbnailUrl(campaign.imageUrl)}
            alt={campaign.title}
            className="card-image"
            loading="lazy"
            onError={(e) => {
              e.currentTarget.src = IMAGES.PLACEHOLDER.CAMPAIGN;
            }}
          />
        ) : null}

        {/* Badges overlaid on image */}
        <div className="card-badges">
          {campaign.urgent && (
            <span className="card-badge badge-urgent">{t('campaign.filterUrgent')}</span>
          )}
          {isAlmostFunded && campaign.currentAmount != null && (
            <span className="card-badge badge-almost-funded">{t('campaign.almostFunded')}</span>
          )}
          {campaign.featured && !campaign.urgent && (
            <span className="card-badge badge-featured">{t('campaign.filterFeatured')}</span>
          )}
        </div>
      </div>
      <div className="card-header">
        <h2 data-testid="campaign-title">{campaign.title}</h2>
      </div>
      <p className="description">{campaign.shortDescription}</p>

      {/* Progress Bar */}
      {campaign.currentAmount != null && campaign.targetAmount > 0 && (
        <div className="card-progress">
          <div className="card-progress-bar">
            <div
              className={`card-progress-fill ${isAlmostFunded ? 'almost-funded' : ''}`}
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="card-progress-stats">
            <span className="progress-pct"><strong>{t('campaign.progress', { percent: progress.toFixed(0) })}</strong></span>
            {remaining !== null && remaining > 0 && (
              <span className="progress-remaining">
                {formatCurrency(remaining, campaign.currency, { decimals: 0 })} {t('campaign.toGo')}
              </span>
            )}
          </div>
        </div>
      )}

      <div className="campaign-meta">
        <div className="meta-item">
          <span className="label">{t('campaign.goalLabel')}</span>
          <span className="value">
            {formatCurrency(campaign.targetAmount, campaign.currency, { decimals: 0 })}
          </span>
        </div>
      </div>
      <div className="card-actions">
        <Link to={`/campaigns/${campaign.id}`} className="btn-secondary">
          {t('campaign.viewDetails')}
        </Link>
        {campaign.active && (
          <Link to={`/donate/${campaign.id}`} className="btn-primary">
            <span className="heart-icon" aria-hidden="true">❤️</span>
            {t('campaign.donate')}
          </Link>
        )}
        {!campaign.active && (
          <span className="inactive-label">{t('campaign.notAccepting')}</span>
        )}
      </div>
    </div>
  );
}

export default React.memo(CampaignCard);
