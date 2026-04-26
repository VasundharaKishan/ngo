/**
 * "Live campaigns" grid — matches mockup campaign card design.
 *
 * Eyebrow + Fraunces heading row with "All campaigns →" link,
 * 3-col grid of cards with gradient image placeholder, category badge,
 * saffron progress bar, and amount/days stats row.
 */
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { api, type Campaign } from '../../api';
import logger from '../../utils/logger';
import './FeaturedCampaignsSection.css';

interface FeaturedCampaignsSectionProps {
  config: {
    limit?: number;
    showProgress?: boolean;
    title?: string;
    eyebrow?: string;
  };
}

function getBadgeClass(category?: string): string {
  if (!category) return 'campaign-card-v2__badge--default';
  const lower = category.toLowerCase();
  if (lower.includes('education')) return 'campaign-card-v2__badge--education';
  if (lower.includes('health')) return 'campaign-card-v2__badge--healthcare';
  if (lower.includes('livelihood')) return 'campaign-card-v2__badge--livelihood';
  return 'campaign-card-v2__badge--default';
}

function formatINR(amount: number): string {
  return '₹' + amount.toLocaleString('en-IN');
}

function daysLeft(endDate?: string): string {
  if (!endDate) return '';
  const diff = Math.ceil((new Date(endDate).getTime() - Date.now()) / 86400000);
  if (diff <= 0) return 'Ended';
  return `${diff} days`;
}

export default function FeaturedCampaignsSection({ config }: FeaturedCampaignsSectionProps) {
  const { t } = useTranslation();
  const {
    limit = 3,
    title = 'Pick a cause, see the outcome.',
    eyebrow = 'Live campaigns',
  } = config;

  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadCampaigns = async () => {
      try {
        const data = await api.getCampaigns({ featured: true, limit });
        setCampaigns(data);
      } catch (error) {
        logger.error('FeaturedCampaignsSection', 'Error loading featured campaigns:', error);
      } finally {
        setLoading(false);
      }
    };

    loadCampaigns();
  }, [limit]);

  if (loading) return null;

  return (
    <section className="campaigns-section" aria-labelledby="campaigns-section-title">
      <div className="campaigns-container">
        {/* Header row */}
        <div className="campaigns-header">
          <div>
            <div className="campaigns-eyebrow">{eyebrow}</div>
            <h2 id="campaigns-section-title" className="campaigns-title font-display">{title}</h2>
          </div>
          <Link to="/campaigns" className="campaigns-all-link">
            All campaigns →
          </Link>
        </div>

        {/* Grid */}
        {campaigns.length === 0 ? (
          <p className="campaigns-empty">{t('campaign.noFeaturedCampaigns')}</p>
        ) : (
          <div className="campaigns-grid">
            {campaigns.map((campaign) => {
              const pct = campaign.targetAmount > 0
                ? Math.min(100, Math.round((campaign.currentAmount / campaign.targetAmount) * 100))
                : 0;

              return (
                <Link
                  key={campaign.id}
                  to={`/campaigns/${campaign.id}`}
                  className="campaign-card-v2"
                >
                  {/* Image */}
                  <div className="campaign-card-v2__image">
                    {campaign.imageUrl && (
                      <img src={campaign.imageUrl} alt="" loading="lazy" />
                    )}
                  </div>

                  {/* Body */}
                  <div className="campaign-card-v2__body">
                    {campaign.category && (
                      <span className={`campaign-card-v2__badge ${getBadgeClass(campaign.category)}`}>
                        {campaign.category}
                      </span>
                    )}

                    <h3 className="campaign-card-v2__title">{campaign.title}</h3>

                    {/* Progress bar */}
                    <div
                      className="campaign-card-v2__progress"
                      role="progressbar"
                      aria-valuenow={pct}
                      aria-valuemin={0}
                      aria-valuemax={100}
                    >
                      <div
                        className="campaign-card-v2__progress-fill"
                        style={{ width: `${pct}%` }}
                      />
                    </div>

                    {/* Stats */}
                    <div className="campaign-card-v2__stats">
                      <span>
                        {formatINR(campaign.currentAmount)} of {formatINR(campaign.targetAmount)}
                      </span>
                      {campaign.endDate && (
                        <span>{daysLeft(campaign.endDate)}</span>
                      )}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
