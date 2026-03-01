import { useEffect, useState, useRef, type FormEvent } from 'react';
import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
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
  const { t } = useTranslation();
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
        .catch(() => setCampaignLoadError(t('donation.loadError')));
    }
  }, [campaignId]);

  const handleNextStep = () => {
    if (currentStep === 'amount') {
      if (amount <= 0) {
        setError(t('donation.invalidAmount'));
        return;
      }
      setError('');
      setCurrentStep('personal');
    } else if (currentStep === 'personal') {
      if (!anonymous && (isEmpty(donorName) || isEmpty(donorEmail))) {
        setError(t('donation.nameEmailRequired'));
        return;
      }
      if (!anonymous && donorEmail && !isValidEmail(donorEmail)) {
        setError(t('donation.invalidEmail'));
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
        donorName: anonymous ? t('donation.anonymous') : donorName,
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
      setError(t('donation.checkoutError'));
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
            <h1>{t('donation.campaignNotFound')}</h1>
          </div>
          <div style={{ padding: '2rem', textAlign: 'center' }}>
            <p className="error">{campaignLoadError}</p>
            <a href="/campaigns" style={{ marginTop: '1rem', display: 'inline-block' }}>{t('donation.browseCampaigns')}</a>
          </div>
        </div>
      </div>
    );
  }

  if (!campaign) {
    return <div className="container"><p className="loading">{t('common.loading')}</p></div>;
  }

  // Safety check for campaign data
  if (!campaign.id || !campaign.title) {
    return (
      <div className="container">
        <p className="error">{t('donation.invalidCampaign')}</p>
      </div>
    );
  }

  // Check if campaign is inactive
  if (campaign.active === false) {
    return (
      <div className="container">
        <div className="donation-form-container">
          <div className="form-header">
            <h1>{t('donation.campaignNotAvailable')}</h1>
          </div>
          <div className="inactive-notice" style={{ padding: '2rem', textAlign: 'center' }}>
            <p className="inactive-message">{t('campaign.notAcceptingNotice')}</p>
            <a href="/campaigns" style={{ marginTop: '1rem', display: 'inline-block' }}>{t('donation.backToCampaigns')}</a>
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
          <h1>{t('donation.makeADonation')}</h1>
          <p className="campaign-name">
            {campaign.categoryIcon && <span className="category-icon">{campaign.categoryIcon}</span>}
            <strong>{campaign.title || 'Untitled Campaign'}</strong>
          </p>
        </div>

        {/* Progress Steps */}
        <div className="steps-indicator">
          <div className={`step ${currentStep === 'amount' ? 'active' : ''} ${currentStep !== 'amount' ? 'completed' : ''}`}>
            <div className="step-number">1</div>
            <div className="step-label">{t('donation.stepAmount')}</div>
          </div>
          <div className="step-line"></div>
          <div className={`step ${currentStep === 'personal' ? 'active' : ''} ${currentStep === 'payment' ? 'completed' : ''}`}>
            <div className="step-number">2</div>
            <div className="step-label">{t('donation.stepInfo')}</div>
          </div>
          <div className="step-line"></div>
          <div className={`step ${currentStep === 'payment' ? 'active' : ''}`}>
            <div className="step-number">3</div>
            <div className="step-label">{t('donation.stepPayment')}</div>
          </div>
        </div>

        {error && (
          <div className="error-message" data-testid="donation-error"
               role="alert" aria-live="assertive">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="donation-form" data-testid="donation-form">
          {/* Step 1: Amount Selection */}
          {currentStep === 'amount' && (
            <div className="form-step">
              <h2 className="step-title">{t('donation.chooseAmount')}</h2>

              {/* Frequency Toggle */}
              <div className="frequency-toggle" role="group" aria-label="Donation frequency">
                <button
                  type="button"
                  className={`frequency-btn ${frequency === 'one_time' ? 'active' : ''}`}
                  onClick={() => setFrequency('one_time')}
                  data-testid="freq-one-time"
                >
                  {t('donation.oneTime')}
                </button>
                <button
                  type="button"
                  className={`frequency-btn ${frequency === 'monthly' ? 'active monthly' : ''}`}
                  onClick={() => setFrequency('monthly')}
                  data-testid="freq-monthly"
                >
                  {t('donation.monthly')} ♻️
                </button>
              </div>
              {frequency === 'monthly' && (
                <p className="frequency-note" data-testid="monthly-note">
                  💚 {t('donation.monthlyImpact')}
                </p>
              )}

              <div className="form-section">
                <label className="form-label">{t('donation.selectCurrency')}</label>
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
                <label className="form-label">{t('donation.selectAmount', { currency: currency.toUpperCase() })}</label>
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
                  <label className="form-label">{t('donation.orEnterCustom')}</label>
                  <div className="input-with-prefix">
                    <span className="prefix">{getCurrencySymbol(currency)}</span>
                    <input
                      type="number"
                      className="form-input"
                      placeholder={t('donation.customPlaceholder')}
                      value={customAmount}
                      onChange={(e) => handleCustomAmountChange(e.target.value)}
                      min="1"
                      step="0.01"
                      data-testid="donation-amount"
                    />
                  </div>
                </div>

                <div className="amount-display">
                  {t('donation.yourDonation')} <strong>{getCurrencySymbol(currency)}{centsToAmount(amount).toFixed(2)}</strong> {currency.toUpperCase()}
                </div>
              </div>

              <button
                type="button"
                className="submit-btn"
                onClick={handleNextStep}
                data-testid="donation-next-amount"
              >
                {t('donation.continueToInfo')}
              </button>
            </div>
          )}

          {/* Step 2: Personal Information */}
          {currentStep === 'personal' && (
            <div className="form-step">
              <h2 className="step-title">{t('donation.yourInformation')}</h2>

              <div className="anonymous-option">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={anonymous}
                    onChange={(e) => setAnonymous(e.target.checked)}
                  />
                  <span>{t('donation.donateAnonymously')}</span>
                </label>
              </div>

              {!anonymous && (
                <>
                  <div className="form-section">
                    <label className="form-label">{t('donation.donorName')} *</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder={t('donation.namePlaceholder')}
                      value={donorName}
                      onChange={(e) => setDonorName(e.target.value)}
                      required={!anonymous}
                      data-testid="donation-name"
                    />
                  </div>

                  <div className="form-section">
                    <label className="form-label">{t('donation.donorEmail')} *</label>
                    <input
                      type="email"
                      className="form-input"
                      placeholder={t('donation.emailPlaceholder')}
                      value={donorEmail}
                      onChange={(e) => setDonorEmail(e.target.value)}
                      required={!anonymous}
                      data-testid="donation-email"
                    />
                    <p className="form-hint">{t('donation.receiptHint')}</p>
                  </div>

                </>
              )}

              <div className="form-actions">
                <button type="button" className="btn-secondary" onClick={handlePreviousStep}>
                  {t('donation.back')}
                </button>
                <button
                  type="button"
                  className="submit-btn"
                  onClick={handleNextStep}
                  data-testid="donation-next-personal"
                >
                  {t('donation.continueToPayment')}
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Payment Summary */}
          {currentStep === 'payment' && (
            <div className="form-step">
              <h2 className="step-title">{t('donation.reviewPayment')}</h2>

              <div className="donation-summary">
                <h3>{t('donation.donationSummary')}</h3>
                <div className="summary-row">
                  <span>{t('donation.campaign')}:</span>
                  <strong>{campaign.title}</strong>
                </div>
                <div className="summary-row">
                  <span>{t('donation.frequency')}:</span>
                  <strong>{frequency === 'monthly' ? `${t('donation.monthly')} ♻️` : t('donation.oneTime')}</strong>
                </div>
                <div className="summary-row">
                  <span>{t('donation.amount')}:</span>
                  <strong>{getCurrencySymbol(currency)}{centsToAmount(amount).toFixed(2)} {currency.toUpperCase()}</strong>
                </div>
                {!anonymous && donorName && (
                  <div className="summary-row">
                    <span>{t('donation.donorLabel')}</span>
                    <strong>{donorName}</strong>
                  </div>
                )}
                {anonymous && (
                  <div className="summary-row">
                    <span>{t('donation.donorLabel')}</span>
                    <strong>{t('donation.anonymous')}</strong>
                  </div>
                )}
              </div>

              <div className="payment-info">
                <p>
                  🔒 {t('donation.paymentInfo')}
                </p>
              </div>

              <div className="form-actions">
                <button type="button" className="btn-secondary" onClick={handlePreviousStep}>
                  {t('donation.back')}
                </button>
                <button
                  type="submit"
                  className="submit-btn"
                  disabled={loading}
                  aria-busy={loading}
                  data-testid="donation-submit"
                >
                  {loading ? (
                    <span data-testid="donation-loading">{t('donation.processing')}</span>
                  ) : (
                    t('donation.proceedToPayment')
                  )}
                </button>
              </div>

              <p className="security-note">
                {t('donation.secureStripe')}
              </p>
            </div>
          )}
        </form>
        {redirectingUrl && (
          <p className="redirecting-message" data-testid="donation-redirecting"
             aria-live="polite">
            {t('donation.redirecting')}
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
