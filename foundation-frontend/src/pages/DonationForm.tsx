import { useEffect, useState, useRef, type FormEvent } from 'react';
import { useParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { api, type Campaign } from '../api';
import { useSiteName } from '../contexts/ConfigContext';
import { getCurrencySymbol, amountToCents, centsToAmount } from '../utils/currency';
import { isValidEmail, isEmpty } from '../utils/validators';
import { DONATION } from '../config/constants';
import './DonationForm.css';

type DonationStep = 'amount' | 'personal' | 'payment';
type DonationFrequency = 'one_time' | 'monthly';

export default function DonationForm() {
  const { campaignId } = useParams<{ campaignId: string }>();
  const siteName = useSiteName();

  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [currentStep, setCurrentStep] = useState<DonationStep>('amount');
  const [frequency, setFrequency] = useState<DonationFrequency>('one_time');
  const [amount, setAmount] = useState<number>(DONATION.DEFAULT_AMOUNT);
  const [currency, setCurrency] = useState<string>('eur');
  const [customAmount, setCustomAmount] = useState('');
  const [donorName, setDonorName] = useState('');
  const [donorEmail, setDonorEmail] = useState('');
  const [anonymous, setAnonymous] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [campaignLoadError, setCampaignLoadError] = useState('');
  const [redirectingUrl, setRedirectingUrl] = useState<string>('');
  const submittingRef = useRef(false);

  useEffect(() => {
    if (campaignId) {
      api.getCampaign(campaignId)
        .then(setCampaign)
        .catch(() => setCampaignLoadError('Failed to load campaign. Please check the URL and try again.'));
    }
  }, [campaignId]);

  const handleNextStep = () => {
    if (currentStep === 'amount') {
      if (amount <= 0) {
        setError('Please select or enter a valid amount');
        return;
      }
      setError('');
      setCurrentStep('personal');
    } else if (currentStep === 'personal') {
      if (!anonymous && (isEmpty(donorName) || isEmpty(donorEmail))) {
        setError('Please provide your name and email, or choose to donate anonymously');
        return;
      }
      if (!anonymous && donorEmail && !isValidEmail(donorEmail)) {
        setError('Please enter a valid email address');
        return;
      }
      setError('');
      setCurrentStep('payment');
    }
  };

  const handlePreviousStep = () => {
    setError('');
    if (currentStep === 'personal') {
      setCurrentStep('amount');
    } else if (currentStep === 'payment') {
      setCurrentStep('personal');
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!campaignId) return;

    // Prevent double-submit
    if (submittingRef.current) return;
    submittingRef.current = true;

    setLoading(true);
    setError('');

    try {
      const response = await api.createStripeSession({
        amount,
        currency: currency,
        donorName: anonymous ? 'Anonymous' : donorName,
        donorEmail: anonymous ? undefined : donorEmail,
        campaignId,
      });

      const redirectUrl = response.url;
      if (!redirectUrl) {
        throw new Error('Missing checkout URL');
      }
      setRedirectingUrl(redirectUrl);
      redirectToCheckout(redirectUrl);
    } catch (err) {
      setError('Failed to create checkout session. Please try again.');
      setLoading(false);
      submittingRef.current = false;
    }
  };

  const handleCustomAmountChange = (value: string) => {
    setCustomAmount(value);
    const cents = amountToCents(value);
    setAmount(cents > 0 ? cents : 0);
  };

  if (campaignLoadError) {
    return (
      <div className="container">
        <div className="donation-form-container">
          <div className="form-header">
            <h1>Campaign Not Found</h1>
          </div>
          <div style={{ padding: '2rem', textAlign: 'center' }}>
            <p className="error">{campaignLoadError}</p>
            <a href="/campaigns" style={{ marginTop: '1rem', display: 'inline-block' }}>← Browse campaigns</a>
          </div>
        </div>
      </div>
    );
  }

  if (!campaign) {
    return <div className="container"><p className="loading">Loading...</p></div>;
  }

  // Safety check for campaign data
  if (!campaign.id || !campaign.title) {
    return (
      <div className="container">
        <p className="error">Invalid campaign data. Please try again.</p>
      </div>
    );
  }

  // Check if campaign is inactive
  if (campaign.active === false) {
    return (
      <div className="container">
        <div className="donation-form-container">
          <div className="form-header">
            <h1>Campaign Not Available</h1>
          </div>
          <div className="inactive-notice" style={{ padding: '2rem', textAlign: 'center' }}>
            <p className="inactive-message">⚠️ This campaign is not currently accepting donations</p>
            <a href="/campaigns" style={{ marginTop: '1rem', display: 'inline-block' }}>← Back to campaigns</a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <Helmet>
        <title>Donate to {campaign.title} | {siteName}</title>
        <meta name="description" content={`Make a secure donation to support ${campaign.title}. Every contribution makes a difference.`} />
        <meta property="og:title" content={`Support ${campaign.title}`} />
        <meta name="robots" content="noindex" />
      </Helmet>
      <div className="donation-form-container">
        <div className="form-header">
          <h1>Make a Donation</h1>
          <p className="campaign-name">
            {campaign.categoryIcon && <span className="category-icon">{campaign.categoryIcon}</span>}
            <strong>{campaign.title || 'Untitled Campaign'}</strong>
          </p>
        </div>

        {/* Progress Steps */}
        <div className="steps-indicator">
          <div className={`step ${currentStep === 'amount' ? 'active' : ''} ${currentStep !== 'amount' ? 'completed' : ''}`}>
            <div className="step-number">1</div>
            <div className="step-label">Amount</div>
          </div>
          <div className="step-line"></div>
          <div className={`step ${currentStep === 'personal' ? 'active' : ''} ${currentStep === 'payment' ? 'completed' : ''}`}>
            <div className="step-number">2</div>
            <div className="step-label">Your Info</div>
          </div>
          <div className="step-line"></div>
          <div className={`step ${currentStep === 'payment' ? 'active' : ''}`}>
            <div className="step-number">3</div>
            <div className="step-label">Payment</div>
          </div>
        </div>

        {error && (
          <div className="error-message" data-testid="donation-error">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="donation-form" data-testid="donation-form">
          {/* Step 1: Amount Selection */}
          {currentStep === 'amount' && (
            <div className="form-step">
              <h2 className="step-title">Choose Your Donation Amount</h2>

              {/* Frequency Toggle */}
              <div className="frequency-toggle" role="group" aria-label="Donation frequency">
                <button
                  type="button"
                  className={`frequency-btn ${frequency === 'one_time' ? 'active' : ''}`}
                  onClick={() => setFrequency('one_time')}
                  data-testid="freq-one-time"
                >
                  One-time
                </button>
                <button
                  type="button"
                  className={`frequency-btn ${frequency === 'monthly' ? 'active monthly' : ''}`}
                  onClick={() => setFrequency('monthly')}
                  data-testid="freq-monthly"
                >
                  Monthly ♻️
                </button>
              </div>
              {frequency === 'monthly' && (
                <p className="frequency-note" data-testid="monthly-note">
                  💚 Monthly donors give <strong>5× more impact</strong> over a year
                </p>
              )}

              <div className="form-section">
                <label className="form-label">Select Currency</label>
                <select 
                  className="currency-select"
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                >
                  <option value="eur">EUR (€)</option>
                  <option value="usd">USD ($)</option>
                  <option value="gbp">GBP (£)</option>
                </select>
              </div>

              <div className="form-section">
                <label className="form-label">Select Amount ({currency.toUpperCase()})</label>
                <div className="amount-buttons">
                  {DONATION.PRESET_AMOUNTS.map(preset => (
                    <button
                      key={preset}
                      type="button"
                      className={`amount-btn ${amount === preset ? 'active' : ''}`}
                      onClick={() => {
                        setAmount(preset);
                        setCustomAmount('');
                      }}
                    >
                      {getCurrencySymbol(currency)}{(preset / 100).toFixed(0)}
                    </button>
                  ))}
                </div>

                <div className="custom-amount">
                  <label className="form-label">Or Enter Custom Amount</label>
                  <div className="input-with-prefix">
                    <span className="prefix">{getCurrencySymbol(currency)}</span>
                    <input
                      type="number"
                      className="form-input"
                      placeholder="Enter amount"
                      value={customAmount}
                      onChange={(e) => handleCustomAmountChange(e.target.value)}
                      min="1"
                      step="0.01"
                      data-testid="donation-amount"
                    />
                  </div>
                </div>

                <div className="amount-display">
                  Your donation: <strong>{getCurrencySymbol(currency)}{centsToAmount(amount).toFixed(2)}</strong> {currency.toUpperCase()}
                </div>
              </div>

              <button
                type="button"
                className="submit-btn"
                onClick={handleNextStep}
                data-testid="donation-next-amount"
              >
                Continue to Your Information →
              </button>
            </div>
          )}

          {/* Step 2: Personal Information */}
          {currentStep === 'personal' && (
            <div className="form-step">
              <h2 className="step-title">Your Information</h2>

              <div className="anonymous-option">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={anonymous}
                    onChange={(e) => setAnonymous(e.target.checked)}
                  />
                  <span>I want to donate anonymously</span>
                </label>
              </div>

              {!anonymous && (
                <>
                  <div className="form-section">
                    <label className="form-label">Full Name *</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="John Doe"
                      value={donorName}
                      onChange={(e) => setDonorName(e.target.value)}
                      required={!anonymous}
                      data-testid="donation-name"
                    />
                  </div>

                  <div className="form-section">
                    <label className="form-label">Email Address *</label>
                    <input
                      type="email"
                      className="form-input"
                      placeholder="john@example.com"
                      value={donorEmail}
                      onChange={(e) => setDonorEmail(e.target.value)}
                      required={!anonymous}
                      data-testid="donation-email"
                    />
                    <p className="form-hint">We'll send your donation receipt to this email</p>
                  </div>

                </>
              )}

              <div className="form-actions">
                <button type="button" className="btn-secondary" onClick={handlePreviousStep}>
                  ← Back
                </button>
                <button
                  type="button"
                  className="submit-btn"
                  onClick={handleNextStep}
                  data-testid="donation-next-personal"
                >
                  Continue to Payment →
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Payment Summary */}
          {currentStep === 'payment' && (
            <div className="form-step">
              <h2 className="step-title">Review & Complete Payment</h2>

              <div className="donation-summary">
                <h3>Donation Summary</h3>
                <div className="summary-row">
                  <span>Campaign:</span>
                  <strong>{campaign.title}</strong>
                </div>
                <div className="summary-row">
                  <span>Frequency:</span>
                  <strong>{frequency === 'monthly' ? 'Monthly ♻️' : 'One-time'}</strong>
                </div>
                <div className="summary-row">
                  <span>Amount:</span>
                  <strong>{getCurrencySymbol(currency)}{centsToAmount(amount).toFixed(2)} {currency.toUpperCase()}</strong>
                </div>
                {!anonymous && donorName && (
                  <div className="summary-row">
                    <span>Donor:</span>
                    <strong>{donorName}</strong>
                  </div>
                )}
                {anonymous && (
                  <div className="summary-row">
                    <span>Donor:</span>
                    <strong>Anonymous</strong>
                  </div>
                )}
              </div>

              <div className="payment-info">
                <p>
                  🔒 You will be redirected to Stripe's secure payment page to complete your donation.
                  Your payment information is processed securely and never stored on our servers.
                </p>
              </div>

              <div className="form-actions">
                <button type="button" className="btn-secondary" onClick={handlePreviousStep}>
                  ← Back
                </button>
                <button
                  type="submit"
                  className="submit-btn"
                  disabled={loading}
                  data-testid="donation-submit"
                >
                  {loading ? (
                    <span data-testid="donation-loading">Processing...</span>
                  ) : (
                    'Proceed to Secure Payment →'
                  )}
                </button>
              </div>

              <p className="security-note">
                🛡️ Secure payment powered by Stripe
              </p>
            </div>
          )}
        </form>
        {redirectingUrl && (
          <p className="redirecting-message" data-testid="donation-redirecting">
            Redirecting you to secure checkout...
          </p>
        )}
      </div>
    </div>
  );
}

export function redirectToCheckout(url: string) {
  if (typeof window === 'undefined') return;
  if (window.__SKIP_REDIRECT_TO_CHECKOUT) {
    window.__LAST_REDIRECT_URL = url;
    return;
  }
  window.location.href = url;
}

declare global {
  interface Window {
    __SKIP_REDIRECT_TO_CHECKOUT?: boolean;
    __LAST_REDIRECT_URL?: string;
  }
}
