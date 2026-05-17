/**
 * Donation panel — matches mockup "Choose how you want to give" section.
 *
 * 5-column grid:
 *   Left (3 cols): monthly toggle, amount buttons, custom input, impact line, CTA
 *   Right (2 cols): "Where your money goes" card + testimonial quote card
 */
import { useState } from 'react';
import { Link } from 'react-router-dom';
import './DonationPanel.css';

const ArrowIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="M5 12h14M13 5l7 7-7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

interface AmountOption {
  value: number;
  label: string;
  impact: string;
}

const AMOUNTS: AmountOption[] = [
  { value: 500, label: '₹500', impact: 'Feeds a child for a week' },
  { value: 1500, label: '₹1,500', impact: 'School kit for one child' },
  { value: 5000, label: '₹5,000', impact: 'One term of tuition' },
  { value: 15000, label: '₹15,000', impact: 'Library shelf in their name' },
];

const IMPACTS: Record<number, string> = {
  500: 'feed a child in Dhanrua for a full week',
  1500: "put a school kit into a first-grader's hands",
  5000: 'cover a full term of tuition for one child',
  15000: 'put a named library shelf in a village school',
};

export default function DonationPanel() {
  const [selectedAmount, setSelectedAmount] = useState(500);
  const [customAmount, setCustomAmount] = useState('');
  const [isMonthly, setIsMonthly] = useState(false);

  const activeAmount = customAmount ? Number(customAmount) : selectedAmount;
  const impactText = IMPACTS[activeAmount] || 'go straight to the ground';
  const periodLabel = isMonthly ? 'this month' : 'today';

  const handleAmountClick = (value: number) => {
    setSelectedAmount(value);
    setCustomAmount('');
  };

  const handleCustomChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCustomAmount(e.target.value);
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
            {/* Monthly toggle */}
            <div className="donation-monthly-toggle">
              <div className="donation-monthly-text">
                <div className="donation-monthly-title">Make it monthly</div>
                <div className="donation-monthly-desc">
                  Sustain a child's learning all year. Cancel anytime.
                </div>
              </div>
              <label className="donation-switch">
                <input
                  type="checkbox"
                  checked={isMonthly}
                  onChange={(e) => setIsMonthly(e.target.checked)}
                  aria-label="Toggle monthly giving"
                />
                <span className="donation-switch-track" />
              </label>
            </div>

            {/* Amount buttons */}
            <div className="donation-amounts">
              {AMOUNTS.map((opt) => (
                <button
                  key={opt.value}
                  className="donation-amount-btn"
                  aria-pressed={!customAmount && selectedAmount === opt.value}
                  onClick={() => handleAmountClick(opt.value)}
                >
                  <div className="donation-amount-value">{opt.label}</div>
                  <div className="donation-amount-impact">{opt.impact}</div>
                </button>
              ))}
            </div>

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
                  onChange={handleCustomChange}
                  className="donation-custom-input"
                />
              </div>
            </div>

            {/* Impact line */}
            <div className="donation-impact-line">
              Your <strong>₹{(activeAmount || 0).toLocaleString('en-IN')}</strong> {periodLabel} will {impactText}.
            </div>

            {/* CTA */}
            <Link to={`/donate?amount=${activeAmount}&monthly=${isMonthly}`} className="donation-cta-btn">
              Proceed to secure payment <ArrowIcon />
            </Link>

            <p className="donation-disclaimer">
              We accept UPI, cards, netbanking, and wallets. <strong>Note:</strong> we are not yet registered for 80G tax deduction. We'll email you when that's approved.
            </p>
          </div>

          {/* ── Right: info cards ── */}
          <div className="donation-sidebar">
            {/* Where money goes */}
            <div className="donation-allocation-card">
              <h3>Where your money goes</h3>
              <ul className="donation-allocation-list">
                <li>
                  <span className="donation-alloc-dot" />
                  <span><strong>92%</strong> programmes on the ground</span>
                </li>
                <li>
                  <span className="donation-alloc-dot" />
                  <span><strong>6%</strong> programme management</span>
                </li>
                <li>
                  <span className="donation-alloc-dot" />
                  <span><strong>2%</strong> fundraising &amp; admin</span>
                </li>
              </ul>
              <Link to="/transparency" className="donation-audit-link">
                Read our last audit →
              </Link>
            </div>

            {/* Testimonial quote */}
            <div className="donation-quote-card">
              <div className="donation-quote-text font-display">
                "My daughter now reads to me. I couldn't read when I was her age."
              </div>
              <div className="donation-quote-author">
                — Sushila, mother in Dhanrua village
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
