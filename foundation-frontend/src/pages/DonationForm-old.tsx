import { useEffect, useState, type FormEvent } from 'react';
import { useParams } from 'react-router-dom';
import { api, type Campaign } from '../api';
import './DonationForm.css';

const PRESET_AMOUNTS = [500, 1000, 2500, 5000, 10000];

export default function DonationForm() {
  const { campaignId } = useParams<{ campaignId: string }>();
  
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [amount, setAmount] = useState<number>(1000);
  const [customAmount, setCustomAmount] = useState('');
  const [donorName, setDonorName] = useState('');
  const [donorEmail, setDonorEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (campaignId) {
      api.getCampaign(campaignId)
        .then(setCampaign)
        .catch(() => setError('Failed to load campaign'));
    }
  }, [campaignId]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    if (!campaignId) return;
    
    if (amount <= 0) {
      setError('Please enter a valid amount');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await api.createStripeSession({
        amount,
        currency: 'usd',
        donorName: donorName || undefined,
        donorEmail: donorEmail || undefined,
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
          <p className="campaign-name">Supporting: <strong>{campaign.title}</strong></p>
        </div>

        <form onSubmit={handleSubmit} className="donation-form">
          <div className="form-section">
            <label className="form-label">Select Amount (USD)</label>
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
                  ${preset / 100}
                </button>
              ))}
            </div>
            
            <div className="custom-amount">
              <label htmlFor="custom-amount" className="form-label">Or enter custom amount</label>
              <div className="input-with-prefix">
                <span className="prefix">$</span>
                <input
                  id="custom-amount"
                  type="number"
                  placeholder="0.00"
                  value={customAmount}
                  onChange={(e) => handleCustomAmountChange(e.target.value)}
                  step="0.01"
                  min="1"
                  className="form-input"
                />
              </div>
            </div>

            <p className="amount-display">
              Donation Amount: <strong>${(amount / 100).toFixed(2)}</strong>
            </p>
          </div>

          <div className="form-section">
            <label htmlFor="donor-name" className="form-label">
              Your Name (optional)
            </label>
            <input
              id="donor-name"
              type="text"
              placeholder="John Doe"
              value={donorName}
              onChange={(e) => setDonorName(e.target.value)}
              className="form-input"
            />
          </div>

          <div className="form-section">
            <label htmlFor="donor-email" className="form-label">
              Email Address (optional)
            </label>
            <input
              id="donor-email"
              type="email"
              placeholder="john@example.com"
              value={donorEmail}
              onChange={(e) => setDonorEmail(e.target.value)}
              className="form-input"
            />
            <p className="form-hint">We'll send you a receipt if provided</p>
          </div>

          {error && <p className="error-message">{error}</p>}

          <button type="submit" disabled={loading} className="submit-btn">
            {loading ? 'Processing...' : 'Proceed to Payment'}
          </button>

          <p className="security-note">
            🔒 Secure payment powered by Stripe. Your payment information is encrypted and secure.
          </p>
        </form>
      </div>
    </div>
  );
}
