/**
 * Public trust-badges surface. Two variants:
 *   - "strip"  → compact inline row rendered between <main> and the site footer
 *   - "grid"   → 2x2 / 4-column card grid rendered inside the About page
 *
 * The component renders whatever the API returns (already filtered for enable +
 * registration gate). If the API fails or returns zero rows, we render the historical
 * i18n'd defaults so visitors still see *something* — the one exception is the
 * "Registered NGO" fallback, which we omit unless the public registration status is
 * APPROVED (defence-in-depth against fallback accidentally claiming registered status).
 */
import { useTranslation } from 'react-i18next';
import { useTrustBadges, type PublicTrustBadge } from '../hooks/useTrustBadges';
import { useRegistrationInfo } from '../hooks/useRegistrationInfo';
import './TrustBadges.css';

interface Props {
  variant: 'strip' | 'grid';
  /** About-page grid uses its own title above the component; the strip has no title. */
  className?: string;
}

interface FallbackBadge {
  slotKey: string;
  iconEmoji: string;
  titleKey: string;
  descriptionKey: string;
  showInStrip: boolean;
  showInGrid: boolean;
  gated: boolean;
}

const FALLBACK: FallbackBadge[] = [
  {
    slotKey: 'secure',
    iconEmoji: '🔒',
    titleKey: 'about.trustSecure',
    descriptionKey: 'about.trustSecureDesc',
    showInStrip: true,
    showInGrid: true,
    gated: false,
  },
  {
    slotKey: 'registered_ngo',
    iconEmoji: '🏛️',
    titleKey: 'about.trustNgo',
    descriptionKey: 'about.trustNgoDesc',
    showInStrip: true,
    showInGrid: true,
    gated: true,
  },
  {
    slotKey: 'zero_fees',
    iconEmoji: '💯',
    titleKey: 'about.trustFees',
    descriptionKey: 'about.trustFeesDesc',
    showInStrip: true,
    showInGrid: true,
    gated: false,
  },
  {
    slotKey: 'annual_reports',
    iconEmoji: '📋',
    titleKey: 'about.trustReports',
    descriptionKey: 'about.trustReportsDesc',
    showInStrip: false,
    showInGrid: true,
    gated: false,
  },
];

export default function TrustBadges({ variant, className }: Props) {
  const { t } = useTranslation();
  const { loading, badges } = useTrustBadges();
  const registration = useRegistrationInfo();
  const approved = registration?.status === 'APPROVED';

  // Prefer server data. Fall back to i18n defaults (with gating applied) when the API
  // is unavailable or returned zero rows.
  const resolvedBadges: PublicTrustBadge[] =
    badges && badges.length > 0
      ? badges
      : FALLBACK.filter((f) => !f.gated || approved).map((f) => ({
          slotKey: f.slotKey,
          iconEmoji: f.iconEmoji,
          title: t(f.titleKey),
          description: t(f.descriptionKey),
          showInStrip: f.showInStrip,
          showInGrid: f.showInGrid,
          sortOrder: 0,
        }));

  const filtered = resolvedBadges.filter((b) =>
    variant === 'strip' ? b.showInStrip : b.showInGrid
  );

  if (loading && !badges) {
    // Render invisible placeholder with the same rough height to avoid layout shift.
    return (
      <div
        className={`trust-badges trust-badges--${variant} trust-badges--loading ${className ?? ''}`}
        aria-hidden="true"
      />
    );
  }

  if (filtered.length === 0) return null;

  if (variant === 'strip') {
    return (
      <div
        className={`trust-badges trust-badges--strip ${className ?? ''}`}
        role="region"
        aria-label="Trust indicators"
      >
        <div className="trust-badges-strip-inner">
          {filtered.map((b, idx) => (
            <span key={b.slotKey} className="trust-badges-strip-item-wrap">
              {idx > 0 && (
                <span className="trust-badges-strip-divider" aria-hidden="true">
                  ·
                </span>
              )}
              <span className="trust-badges-strip-item">
                <span className="trust-badges-strip-icon" aria-hidden="true">
                  {b.iconEmoji}
                </span>
                {b.title}
              </span>
            </span>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={`trust-badges trust-badges--grid ${className ?? ''}`}>
      {filtered.map((b) => (
        <div key={b.slotKey} className="trust-badges-grid-card" data-slot={b.slotKey}>
          <span className="trust-badges-grid-icon" aria-hidden="true">
            {b.iconEmoji}
          </span>
          <h3 className="trust-badges-grid-title">{b.title}</h3>
          <p className="trust-badges-grid-desc">{b.description}</p>
        </div>
      ))}
    </div>
  );
}
