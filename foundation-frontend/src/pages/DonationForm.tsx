import { useEffect, useState, type FormEvent } from 'react';
import { useParams } from 'react-router-dom';
import { api, type Campaign } from '../api';
import './DonationForm.css';

const PRESET_AMOUNTS = [500, 1000, 2500, 5000, 10000];

type DonationStep = 'amount' | 'personal' | 'payment';

export default function DonationForm() {
  const { campaignId } = useParams<{ campaignId: string }>();
  
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [currentStep, setCurrentStep] = useState<DonationStep>('amount');
  const [amount, setAmount] = useState<number>(1000);
  const [currency, setCurrency] = useState<string>('eur');
  const [customAmount, setCustomAmount] = useState('');
  const [donorName, setDonorName] = useState('');
  const [donorEmail, setDonorEmail] = useState('');
  const [donorPhone, setDonorPhone] = useState('');
  const [anonymous, setAnonymous] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (campaignId) {
      api.getCampaign(campaignId)
        .then(setCampaign)
        .catch(() => setError('Failed to load campaign'));
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
      if (!anonymous && (!donorName || !donorEmail)) {
        setError('Please provide your name and email, or choose to donate anonymously');
        return;
      }
      if (!anonymous && donorEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(donorEmail)) {
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

      // Redirect to Stripe Checkout
      window.location.href = response.url;
    } catch (err) {
      setError('Failed to create checkout session. Please try again.');
      setLoading(false);
    }
  };

  const handleCustomAmountChange = (value: string) => {
    setCustomAmount(value);
    const cents = Math.round(parseFloat(value) * 100);
    if (!isNaN(cents) && cents > 0) {
      setAmount(cents);
    }
  };

  if (!campaign) {
    return <div className="container"><p className="loading">Loading...</p></div>;
  }

  return (
    <div className="container">
      <div className="donation-form-container">
        <div className="form-header">
          <h1>Make a Donation</h1>
          <p className="campaign-name">
            {campaign.categoryIcon && <span className="category-icon">{campaign.categoryIcon}</span>}
            <strong>{campaign.title}</strong>
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

        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleSubmit} className="donation-form">
          {/* Step 1: Amount Selection */}
          {currentStep === 'amount' && (
            <div className="form-step">
              <h2 className="step-title">Choose Your Donation Amount</h2>
              
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
                  {PRESET_AMOUNTS.map(preset => (
                    <button
                      key={preset}
                      type="button"
                      className={`amount-btn ${amount === preset ? 'active' : ''}`}
                      onClick={() => {
                        setAmount(preset);
                        setCustomAmount('');
                      }}
                    >
                      {currency === 'eur' ? '€' : currency === 'gbp' ? '£' : '$'}{(preset / 100).toFixed(0)}
                    </button>
                  ))}
                </div>

                <div className="custom-amount">
                  <label className="form-label">Or Enter Custom Amount</label>
                  <div className="input-with-prefix">
                    <span className="prefix">{currency === 'eur' ? '€' : currency === 'gbp' ? '£' : '$'}</span>
                    <input
                      type="number"
                      className="form-input"
                      placeholder="Enter amount"
                      value={customAmount}
                      onChange={(e) => handleCustomAmountChange(e.target.value)}
                      min="1"
                      step="0.01"
                    />
                  </div>
                </div>

                <div className="amount-display">
                  Your donation: <strong>{currency === 'eur' ? '€' : currency === 'gbp' ? '£' : '$'}{(amount / 100).toFixed(2)}</strong> {currency.toUpperCase()}
                </div>
              </div>

              <button type="button" className="submit-btn" onClick={handleNextStep}>
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
                    />
                    <p className="form-hint">We'll send your donation receipt to this email</p>
                  </div>

                  <div className="form-section">
                    <label className="form-label">Phone Number (Optional)</label>
                    <input
                      type="tel"
                      className="form-input"
                      placeholder="+1 (555) 000-0000"
                      value={donorPhone}
                      onChange={(e) => setDonorPhone(e.target.value)}
                    />
                  </div>
                </>
              )}

              <div className="form-actions">
                <button type="button" className="btn-secondary" onClick={handlePreviousStep}>
                  ← Back
                </button>
                <button type="button" className="submit-btn" onClick={handleNextStep}>
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
                  <span>Amount:</span>
                  <strong>{currency === 'eur' ? '€' : currency === 'gbp' ? '£' : '$'}{(amount / 100).toFixed(2)} {currency.toUpperCase()}</strong>
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
                <button type="submit" className="submit-btn" disabled={loading}>
                  {loading ? 'Processing...' : 'Proceed to Secure Payment →'}
                </button>
              </div>

              <p className="security-note">
                🛡️ Secure payment powered by Stripe
              </p>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
