/**
 * Public hero panel — matches mockup-home-and-donate.html hero section.
 *
 * Two-column layout:
 *   Left: live badge, headline (Fraunces), subtitle, CTA buttons, trust strip
 *   Right: featured campaign card with progress bar
 *
 * All content is admin-controlled:
 *   - Hero copy (eyebrow, headline, subtitle, CTA labels/links) via /api/public/hero-panel
 *   - Trust strip items via /api/public/trust-badges (showInStrip === true)
 *   - Featured campaign via /api/campaigns (featured flag)
 * No hardcoded donor names, fake amounts, or placeholder campaigns are shown.
 */
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useHeroPanel, type PublicHeroPanel } from '../hooks/useHeroPanel';
import { useFeaturedCampaign, type FeaturedCampaign } from '../hooks/useFeaturedCampaign';
import { useTrustBadges } from '../hooks/useTrustBadges';
import { getThumbnailUrl } from '../utils/imageUtils';
import { IMAGES } from '../config/constants';
import './HeroPanel.css';

/* ── Icons ── */
const ArrowIcon = ({ size = 18 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="M5 12h14M13 5l7 7-7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

/* ── Featured campaign card ── */

function formatCampaignAmount(amount: number, currency: string): string {
  try {
    return new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency: currency.toUpperCase(),
      maximumFractionDigits: 0,
    }).format(amount);
  } catch {
    return amount.toLocaleString();
  }
}

function FeaturedCampaignCard({ campaign, onDonate }: { campaign: FeaturedCampaign; onDonate?: () => void }) {
  const { t } = useTranslation();
  const pct = campaign.targetAmount > 0
    ? Math.min(100, Math.round((campaign.currentAmount / campaign.targetAmount) * 100))
    : 0;

  return (
    <aside className="hero-campaign-card" aria-label="Featured campaign">
      {/* Campaign image — real image when available, placeholder otherwise */}
      <div className="hero-campaign-img">
        <img
          src={campaign.imageUrl ? getThumbnailUrl(campaign.imageUrl) : IMAGES.PLACEHOLDER.CAMPAIGN}
          alt={campaign.title}
          onError={(e) => { e.currentTarget.src = IMAGES.PLACEHOLDER.CAMPAIGN; }}
        />
        {campaign.category && (
          <span className="hero-campaign-badge">{campaign.category}</span>
        )}
      </div>

      <div className="hero-campaign-body">
        <h2 className="hero-campaign-title font-display">{campaign.title}</h2>
        {campaign.location && (
          <p className="hero-campaign-location">{campaign.location}</p>
        )}

        {/* Progress */}
        <div className="hero-campaign-progress">
          <div className="hero-campaign-amounts">
            <span className="hero-campaign-raised">{formatCampaignAmount(campaign.currentAmount, campaign.currency)}</span>
            <span className="hero-campaign-goal">of {formatCampaignAmount(campaign.targetAmount, campaign.currency)}</span>
          </div>
          <div
            className="hero-campaign-bar"
            role="progressbar"
            aria-valuenow={pct}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={`${pct}% funded`}
          >
            <div className="hero-campaign-bar-fill progress-bar" style={{ width: `${pct}%` }} />
          </div>
          <div className="hero-campaign-stats">
            {campaign.daysLeft != null && (
              <span><strong>{campaign.daysLeft}</strong> days left</span>
            )}
            <span><strong>{pct}%</strong> funded</span>
          </div>
        </div>

        <Link
          to={`/campaigns/${campaign.id}`}
          className="hero-campaign-cta"
          onClick={onDonate}
        >
          {t('campaign.supportCta', 'Support this campaign')}
        </Link>
      </div>
    </aside>
  );
}

/* ── Static fallback trust items shown only when API returns nothing ── */
const FALLBACK_TRUST = [
  { iconEmoji: '🛡️', title: 'Transparent', description: 'Every donation tracked' },
  { iconEmoji: '✅', title: 'Direct', description: 'No middlemen' },
  { iconEmoji: '🔒', title: 'Secure', description: 'Safe & encrypted' },
  { iconEmoji: '🤝', title: 'Volunteer-led', description: 'Community built' },
];

/* ── Main export ── */
export default function HeroPanel() {
  const { loading, panel } = useHeroPanel();
  const { loading: campaignLoading, campaign: featuredCampaign } = useFeaturedCampaign();
  const { loading: badgesLoading, badges } = useTrustBadges();

  // Use live hero content or sensible defaults
  const headline = (panel as PublicHeroPanel)?.headline ?? 'Support families building their way out of poverty.';
  const subtitle = (panel as PublicHeroPanel)?.subtitle ?? '';
  const eyebrow = (panel as PublicHeroPanel)?.eyebrow ?? '';
  const ctaLabel = (panel as PublicHeroPanel)?.primaryCtaLabel ?? 'Donate now';
  const ctaHref = (panel as PublicHeroPanel)?.primaryCtaHref ?? '/campaigns';
  const secondaryCtaLabel = (panel as PublicHeroPanel)?.secondaryCtaLabel ?? 'See the impact';
  const secondaryCtaHref = (panel as PublicHeroPanel)?.secondaryCtaHref ?? '/impact';

  // Trust strip: admin-managed badges filtered for strip display, fallback to static defaults
  const stripBadges = badges?.filter(b => b.showInStrip) ?? [];
  const trustItems = (!badgesLoading && stripBadges.length > 0) ? stripBadges : FALLBACK_TRUST;

  return (
    <section className="hero-section" data-hero-source={panel ? 'live' : 'fallback'}>
      {/* Main hero area */}
      <div className="hero-bg">
        <div className="hero-container">
          <div className="hero-grid">
            {/* Left column */}
            <div className="hero-content">
              {/* Live badge */}
              {eyebrow && (
                <div className="hero-live-badge">
                  <span className="hero-live-dot pulse-dot" />
                  {eyebrow}
                </div>
              )}

              <h1 className="hero-headline font-display">{headline}</h1>

              {subtitle && <p className="hero-subtitle">{subtitle}</p>}

              <div className="hero-cta-group">
                {ctaLabel && ctaHref && (
                  ctaHref.startsWith('/') ? (
                    <Link to={ctaHref} className="hero-btn-primary">
                      {ctaLabel} <ArrowIcon />
                    </Link>
                  ) : (
                    <a href={ctaHref} className="hero-btn-primary">
                      {ctaLabel} <ArrowIcon />
                    </a>
                  )
                )}
                {secondaryCtaLabel && (
                  secondaryCtaHref.startsWith('/') ? (
                    <Link to={secondaryCtaHref} className="hero-btn-secondary">
                      {secondaryCtaLabel}
                    </Link>
                  ) : (
                    <a href={secondaryCtaHref} className="hero-btn-secondary">
                      {secondaryCtaLabel}
                    </a>
                  )
                )}
              </div>

              {/* Trust strip — admin-managed via /api/public/trust-badges */}
              <div className="hero-trust-strip">
                {trustItems.map((item) => (
                  <div key={item.title} className="hero-trust-item">
                    <div className="hero-trust-icon" aria-hidden="true">{item.iconEmoji}</div>
                    <span className="hero-trust-text">
                      <strong>{item.title}</strong>
                      {item.description}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Right column — live featured campaign only; nothing shown if none exists */}
            <div className="hero-card-col">
              {featuredCampaign ? (
                <FeaturedCampaignCard campaign={featuredCampaign} />
              ) : campaignLoading || loading ? (
                <div className="hero-campaign-card hero-campaign-card--loading" aria-busy="true" />
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
