/**
 * Public hero panel — matches mockup-home-and-donate.html hero section.
 *
 * Two-column layout:
 *   Left: live badge, headline (Fraunces), subtitle, CTA buttons, trust strip
 *   Right: featured campaign card with progress bar
 *
 * Below: donor ticker with live-donations marquee.
 */
import { Link } from 'react-router-dom';
import { useHeroPanel, type PublicHeroPanel } from '../hooks/useHeroPanel';
import { useFeaturedCampaign } from '../hooks/useFeaturedCampaign';
import './HeroPanel.css';

/* ── Icons ── */
const ArrowIcon = ({ size = 18 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="M5 12h14M13 5l7 7-7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const ShieldIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="M12 2l8 4v6c0 5-3.5 8.5-8 10-4.5-1.5-8-5-8-10V6l8-4z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
  </svg>
);

const CheckIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="M4 12l5 5L20 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const CardIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <rect x="3" y="6" width="18" height="14" rx="2" stroke="currentColor" strokeWidth="2" />
    <path d="M3 10h18" stroke="currentColor" strokeWidth="2" />
  </svg>
);

const ClockIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" />
    <path d="M12 7v5l3 2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

/* ── Static fallback content ── */
const FALLBACK = {
  eyebrow: 'Live campaign · 14 days left',
  headline: 'Education is the quiet revolution that changes a life.',
  headlineAccent: 'quiet revolution',
  subtitle:
    'Every ₹500 you give today feeds, clothes and teaches a child in rural Uttar Pradesh for one week. We are a community-led foundation — almost every rupee goes straight to the programme.',
  primaryCtaLabel: 'Donate now',
  primaryCtaHref: '#donate',
  secondaryCtaLabel: 'See the impact',
  secondaryCtaHref: '#impact',
};

/* ── Trust badges ── */
const TRUST_ITEMS = [
  { icon: <ShieldIcon />, title: 'Transparent', subtitle: 'Every rupee tracked' },
  { icon: <CheckIcon />, title: 'Direct', subtitle: 'No middlemen' },
  { icon: <CardIcon />, title: 'Secure', subtitle: 'Stripe & UPI' },
  { icon: <ClockIcon />, title: 'Volunteer-led', subtitle: 'Community built' },
];

/* ── Donor ticker (static for now — will be live when backend supports it) ── */
const SAMPLE_DONATIONS = [
  { name: 'Priya', amount: '₹1,000', time: '3 min ago' },
  { name: 'Aarav', amount: '₹500', time: '8 min ago' },
  { name: 'Anonymous', amount: '₹5,000', time: '14 min ago' },
  { name: 'Rohit', amount: '₹250 monthly', time: '22 min ago' },
  { name: 'Meera', amount: '₹2,100', time: '31 min ago' },
];

/* ── Featured campaign card ── */
interface FeaturedCampaign {
  id: string;
  title: string;
  category?: string;
  location?: string;
  targetAmount: number;
  currentAmount: number;
  donorCount?: number;
  daysLeft?: number;
}

function FeaturedCampaignCard({ campaign, onDonate }: { campaign: FeaturedCampaign; onDonate?: () => void }) {
  const pct = Math.min(100, Math.round((campaign.currentAmount / campaign.targetAmount) * 100));
  const fmt = (n: number) => n.toLocaleString('en-IN');

  return (
    <aside className="hero-campaign-card" aria-label="Featured campaign">
      {/* Placeholder hero image */}
      <div className="hero-campaign-img">
        <svg className="hero-campaign-img-svg" viewBox="0 0 400 250" aria-hidden="true">
          <circle cx="320" cy="60" r="30" fill="#fff" opacity="0.4" />
          <rect x="40" y="150" width="320" height="80" rx="6" fill="#fff" opacity="0.15" />
          <rect x="60" y="170" width="60" height="40" rx="4" fill="#fff" opacity="0.3" />
          <rect x="140" y="170" width="60" height="40" rx="4" fill="#fff" opacity="0.3" />
          <rect x="220" y="170" width="60" height="40" rx="4" fill="#fff" opacity="0.3" />
        </svg>
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
            <span className="hero-campaign-raised">₹{fmt(campaign.currentAmount)}</span>
            <span className="hero-campaign-goal">of ₹{fmt(campaign.targetAmount)}</span>
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
            {campaign.donorCount != null && (
              <span><strong>{campaign.donorCount}</strong> donors</span>
            )}
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
          Support this campaign
        </Link>
      </div>
    </aside>
  );
}

/* ── Main export ── */
export default function HeroPanel() {
  const { loading, panel } = useHeroPanel();
  const { campaign: featuredCampaign } = useFeaturedCampaign();

  // Use live hero content or fallback
  const hero = panel ?? FALLBACK;
  const headline = (hero as PublicHeroPanel).headline ?? FALLBACK.headline;
  const subtitle = (hero as PublicHeroPanel).subtitle ?? FALLBACK.subtitle;
  const eyebrow = (hero as PublicHeroPanel).eyebrow ?? FALLBACK.eyebrow;
  const ctaLabel = (hero as PublicHeroPanel).primaryCtaLabel ?? FALLBACK.primaryCtaLabel;
  const ctaHref = (hero as PublicHeroPanel).primaryCtaHref ?? FALLBACK.primaryCtaHref;

  // Format headline with accent if it contains the accent word
  const accentWord = FALLBACK.headlineAccent;
  const parts = headline.includes(accentWord)
    ? headline.split(accentWord)
    : null;

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

              <h1 className="hero-headline font-display">
                {parts ? (
                  <>
                    {parts[0]}
                    <span className="hero-headline-accent">{accentWord}</span>
                    {parts[1]}
                  </>
                ) : (
                  headline
                )}
              </h1>

              <p className="hero-subtitle">{subtitle}</p>

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
                <Link to="/about" className="hero-btn-secondary">
                  {FALLBACK.secondaryCtaLabel}
                </Link>
              </div>

              {/* Trust strip */}
              <div className="hero-trust-strip">
                {TRUST_ITEMS.map((item) => (
                  <div key={item.title} className="hero-trust-item">
                    <div className="hero-trust-icon">{item.icon}</div>
                    <span className="hero-trust-text">
                      <strong>{item.title}</strong>
                      {item.subtitle}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Right column — featured campaign card */}
            <div className="hero-card-col">
              {featuredCampaign ? (
                <FeaturedCampaignCard campaign={featuredCampaign} />
              ) : !loading ? (
                <FeaturedCampaignCard
                  campaign={{
                    id: 'placeholder',
                    title: 'Build a library for Dhanrua village school',
                    category: 'Education',
                    location: '220 children · Kasganj, Uttar Pradesh',
                    targetAmount: 750000,
                    currentAmount: 473920,
                    donorCount: 112,
                    daysLeft: 14,
                  }}
                />
              ) : null}
            </div>
          </div>
        </div>
      </div>

      {/* Donor ticker */}
      <div className="hero-ticker">
        <div className="hero-ticker-inner">
          <span className="hero-ticker-label">
            <span className="hero-live-dot pulse-dot" />
            Live donations
          </span>
          <div className="hero-ticker-scroll">
            <div className="hero-ticker-track ticker">
              {/* Double for seamless loop */}
              {[...SAMPLE_DONATIONS, ...SAMPLE_DONATIONS].map((d, i) => (
                <span key={i} className="hero-ticker-item">
                  <strong>{d.name}</strong> gave{' '}
                  <strong className="hero-ticker-amount">{d.amount}</strong> · {d.time}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
