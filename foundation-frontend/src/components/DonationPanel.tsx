/**
 * Donation panel — matches mockup "Choose how you want to give" section.
 *
 * All content is admin-controlled:
 *   - Preset amounts  via /api/public/donation-presets
 *   - Money allocation percentages via /api/public/money-allocations
 *   - Testimonial quote via /api/public/stories (first available story)
 *   - 80G disclaimer via /api/admin/registration status
 *
 * The allocation and testimonial blocks are hidden entirely when the API
 * returns no data (e.g. pre-registration) rather than showing fabricated values.
 */
import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useDonationPresets } from '../hooks/useDonationPresets';
import { useMoneyAllocations } from '../hooks/useMoneyAllocations';
import { useStories } from '../hooks/useStories';
import { useRegistrationInfo } from '../hooks/useRegistrationInfo';
import './DonationPanel.css';

const ArrowIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="M5 12h14M13 5l7 7-7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

/* ── Hardcoded fallback preset amounts used only when the API is unavailable ── */
const FALLBACK_PRESETS = [
  { amountRupees: 500, label: 'Feeds a child for a week' },
  { amountRupees: 1500, label: 'School kit for one child' },
  { amountRupees: 5000, label: 'One term of tuition' },
  { amountRupees: 15000, label: 'Library shelf in their name' },
];

export default function DonationPanel() {
  const { loading: presetsLoading, data: presetsData } = useDonationPresets();
  const { loading: allocLoading, allocations } = useMoneyAllocations();
  const { loading: storiesLoading, stories } = useStories();
  const registration = useRegistrationInfo();

  /* ── Build preset list from API or fallback ── */
  const presets = useMemo(() => {
    if (presetsData?.presets?.length) {
      return presetsData.presets.map(p => ({
        amountRupees: Math.round(p.amountMinorUnits / 100),
        label: p.label ?? '',
      }));
    }
    return FALLBACK_PRESETS;
  }, [presetsData]);

  const defaultAmountRupees = useMemo(() => {
    if (presetsData?.defaultAmountMinorUnits) {
      return Math.round(presetsData.defaultAmountMinorUnits / 100);
    }
    return presets[0]?.amountRupees ?? 500;
  }, [presetsData, presets]);

  const [selectedAmountRupees, setSelectedAmountRupees] = useState<number | null>(null);
  const [customAmount, setCustomAmount] = useState('');
  const [isMonthly] = useState(false);

  /* Use defaultAmount once loaded, only if user hasn't selected yet */
  const effectiveSelected = selectedAmountRupees ?? defaultAmountRupees;
  const activeAmountRupees = customAmount ? Number(customAmount) : effectiveSelected;

  const selectedPreset = presets.find(p => p.amountRupees === activeAmountRupees);
  const impactText = selectedPreset?.label ?? '';
  const periodLabel = isMonthly ? 'this month' : 'today';

  /* ── Testimonial: first story from API ── */
  const testimonial = useMemo(() => {
    if (stories && stories.length > 0) return stories[0];
    return null;
  }, [stories]);

  /* ── 80G disclaimer: derive from registration status ── */
  const is80GActive = registration?.eightyGActive ?? false;
  const disclaimerText = is80GActive
    ? 'Donations are eligible for 80G tax deduction.'
    : 'We accept UPI, cards, netbanking, and wallets. 80G tax deduction not yet available — we\'ll email you when it\'s approved.';

  const handleAmountClick = (amountRupees: number) => {
    setSelectedAmountRupees(amountRupees);
    setCustomAmount('');
  };

  return (
    <section id="donate" className="donation-panel-section">
      <div className="donation-panel-container">
        {/* Header */}
        <div className="donation-panel-header">
          <h2 className="font-display">Choose how you want to give</h2>
          <p>Pick an amount. Every rupee is traceable. A payment receipt will be emailed to you within minutes.</p>
        </div>

        <div className="donation-panel-grid">
          {/* ── Left: form ── */}
          <div className="donation-form-card">
            {/* Monthly toggle — disabled until backend Stripe Subscriptions are wired */}
            <div className="donation-monthly-toggle" style={{ opacity: 0.55, pointerEvents: 'none' }}>
              <div className="donation-monthly-text">
                <div className="donation-monthly-title">Make it monthly <span style={{ fontSize: '0.75rem', fontWeight: 400, color: '#9ca3af' }}>(Coming soon)</span></div>
                <div className="donation-monthly-desc">
                  Sustain a child's learning all year. Cancel anytime.
                </div>
              </div>
              <label className="donation-switch">
                <input
                  type="checkbox"
                  checked={false}
                  disabled
                  aria-label="Toggle monthly giving (coming soon)"
                />
                <span className="donation-switch-track" />
              </label>
            </div>

            {/* Amount buttons — from /api/public/donation-presets */}
            {!presetsLoading && (
              <div className="donation-amounts">
                {presets.map((opt) => (
                  <button
                    key={opt.amountRupees}
                    className="donation-amount-btn"
                    aria-pressed={!customAmount && effectiveSelected === opt.amountRupees}
                    onClick={() => handleAmountClick(opt.amountRupees)}
                  >
                    <div className="donation-amount-value">₹{opt.amountRupees.toLocaleString('en-IN')}</div>
                    {opt.label && <div className="donation-amount-impact">{opt.label}</div>}
                  </button>
                ))}
              </div>
            )}

            {/* Custom amount */}
            <div className="donation-custom-row">
              <label htmlFor="donation-custom" className="donation-custom-label">
                Or enter amount
              </label>
              <div className="donation-custom-input-wrap">
                <span className="donation-custom-prefix">₹</span>
                <input
                  id="donation-custom"
                  type="number"
                  min={100}
                  placeholder="Other amount"
                  value={customAmount}
                  onChange={(e) => { setCustomAmount(e.target.value); setSelectedAmountRupees(null); }}
                  className="donation-custom-input"
                />
              </div>
            </div>

            {/* Impact line */}
            {impactText && (
              <div className="donation-impact-line">
                Your <strong>₹{(activeAmountRupees || 0).toLocaleString('en-IN')}</strong> {periodLabel} will {impactText}.
              </div>
            )}

            {/* CTA */}
            <Link to={`/donate?amount=${activeAmountRupees * 100}&monthly=${isMonthly}`} className="donation-cta-btn">
              Proceed to secure payment <ArrowIcon />
            </Link>

            {/* 80G disclaimer — driven by registration API */}
            <p className="donation-disclaimer">{disclaimerText}</p>
          </div>

          {/* ── Right: info cards ── */}
          <div className="donation-sidebar">
            {/* Money allocation — from /api/public/money-allocations
                Hidden entirely when API returns no data (pre-registration) */}
            {!allocLoading && allocations && allocations.length > 0 && (
              <div className="donation-allocation-card">
                <h3>Where your money goes</h3>
                <ul className="donation-allocation-list">
                  {allocations.map((alloc) => (
                    <li key={alloc.id}>
                      <span
                        className="donation-alloc-dot"
                        style={alloc.colorHex ? { backgroundColor: alloc.colorHex } : undefined}
                      />
                      <span>
                        <strong>{alloc.percentage}%</strong> {alloc.label}
                        {alloc.description && (
                          <span className="donation-alloc-desc"> — {alloc.description}</span>
                        )}
                      </span>
                    </li>
                  ))}
                </ul>
                <Link to="/transparency" className="donation-audit-link">
                  Read our last audit →
                </Link>
              </div>
            )}

            {/* Testimonial quote — from /api/public/stories (first story)
                Hidden entirely when API returns no data (pre-registration) */}
            {!storiesLoading && testimonial && (
              <div className="donation-quote-card">
                <div className="donation-quote-text font-display">
                  "{testimonial.quote}"
                </div>
                <div className="donation-quote-author">
                  — {testimonial.attribution}
                  {testimonial.location && `, ${testimonial.location}`}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
