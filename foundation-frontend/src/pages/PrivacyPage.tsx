import { useState } from 'react';
import { sanitizeHtml } from '../utils/sanitize';
import { Helmet } from 'react-helmet-async';
import { useCMSContent } from '../hooks/useCMSContent';
import { useSiteName, useSiteLogo, useConfig } from '../contexts/ConfigContext';
import { API_BASE_URL } from '../api';
import './LegalPage.css';

function ErasureRequestForm() {
  const [email, setEmail] = useState('');
  const [reason, setReason] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/public/privacy/erasure-request`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, reason: reason || null }),
      });
      if (!response.ok) {
        const data = await response.json().catch(() => null);
        throw new Error(data?.message || 'Failed to submit request');
      }
      setSubmitted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="erasure-success" data-testid="erasure-request-success">
        <p>Your request has been received. We will process it within 30 days as required by law.</p>
      </div>
    );
  }

  if (!showForm) {
    return (
      <button
        onClick={() => setShowForm(true)}
        style={{
          background: '#dc2626',
          color: '#fff',
          border: 'none',
          padding: '0.6rem 1.2rem',
          borderRadius: '6px',
          cursor: 'pointer',
          fontSize: '0.95rem',
          marginTop: '0.5rem',
        }}
      >
        Request Data Erasure
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit} style={{ marginTop: '1rem', maxWidth: '480px' }}>
      {error && (
        <div style={{ color: '#dc2626', marginBottom: '0.75rem', fontSize: '0.9rem' }}>{error}</div>
      )}
      <div style={{ marginBottom: '1rem' }}>
        <label htmlFor="erasure-email" style={{ display: 'block', marginBottom: '0.25rem', fontWeight: 500 }}>
          Email address *
        </label>
        <input
          id="erasure-email"
          data-testid="erasure-request-email"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="your@email.com"
          style={{
            width: '100%',
            padding: '0.5rem',
            border: '1px solid #d1d5db',
            borderRadius: '6px',
            fontSize: '0.95rem',
          }}
        />
      </div>
      <div style={{ marginBottom: '1rem' }}>
        <label htmlFor="erasure-reason" style={{ display: 'block', marginBottom: '0.25rem', fontWeight: 500 }}>
          Reason (optional)
        </label>
        <textarea
          id="erasure-reason"
          data-testid="erasure-request-reason"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Tell us why you want your data deleted..."
          rows={3}
          style={{
            width: '100%',
            padding: '0.5rem',
            border: '1px solid #d1d5db',
            borderRadius: '6px',
            fontSize: '0.95rem',
            resize: 'vertical',
          }}
        />
      </div>
      <button
        type="submit"
        data-testid="erasure-request-submit"
        disabled={submitting}
        style={{
          background: submitting ? '#9ca3af' : '#dc2626',
          color: '#fff',
          border: 'none',
          padding: '0.6rem 1.2rem',
          borderRadius: '6px',
          cursor: submitting ? 'not-allowed' : 'pointer',
          fontSize: '0.95rem',
        }}
      >
        {submitting ? 'Submitting...' : 'Submit Erasure Request'}
      </button>
    </form>
  );
}

export default function PrivacyPage() {
  const { content, hasCMSContent } = useCMSContent('legal_privacy');
  const siteName = useSiteName();
  const logoUrl = useSiteLogo();
  const { config } = useConfig();

  return (
    <div className="legal-page">
      <Helmet>
        <title>Privacy Statement | {siteName}</title>
        <meta name="description" content="Learn how we collect, use, and protect your personal information." />
        <meta property="og:title" content={`Privacy Statement | ${siteName}`} />
        <meta property="og:description" content="Learn how we collect, use, and protect your personal information." />
        <meta property="og:type" content="website" />
        <meta property="og:image" content={logoUrl} />
        <meta property="og:site_name" content={siteName} />
        <meta property="og:url" content={typeof window !== 'undefined' ? window.location.href : ''} />
        <link rel="canonical" href={typeof window !== 'undefined' ? window.location.href : ''} />
      </Helmet>
      <h1>{content.title || 'Privacy Statement'}</h1>
      <p className="last-updated">Last Updated: {content.lastUpdated || 'December 2024'}</p>

      {hasCMSContent && content.body ? (
        <div dangerouslySetInnerHTML={{ __html: sanitizeHtml(content.body) }} />
      ) : (
        <>
          <section>
            <h2>1. Information We Collect</h2>
            <p>
              We collect information you provide directly to us, including your name, email address, payment information, and any other information you choose to provide when making a donation or contacting us.
            </p>
          </section>

          <section>
            <h2>2. How We Use Your Information</h2>
            <p>
              We use the information we collect to:
            </p>
            <ul>
              <li>Process your donations and send donation receipts</li>
              <li>Communicate with you about our programs and campaigns</li>
              <li>Improve our website and services</li>
              <li>Comply with legal obligations</li>
            </ul>
          </section>

          <section>
            <h2>3. Information Sharing</h2>
            <p>
              We do not sell, trade, or otherwise transfer your personally identifiable information to third parties. We may share information with trusted service providers who assist us in operating our website and conducting our operations, provided they agree to keep this information confidential.
            </p>
          </section>

          <section>
            <h2>4. Payment Security</h2>
            <p>
              All payment transactions are processed through Stripe, a secure payment gateway. We do not store your complete credit card information on our servers.
            </p>
          </section>

          <section>
            <h2>5. Cookies and Tracking</h2>
            <p>
              We use cookies and similar tracking technologies to enhance your experience on our website. You can control cookie preferences through your browser settings. For more information, see our{' '}
              <a href="/cookies">Cookie Policy</a>.
            </p>
          </section>

          <section>
            <h2>6. Your Rights</h2>
            <p>
              You have the right to:
            </p>
            <ul>
              <li>Access the personal information we hold about you</li>
              <li>Request correction of inaccurate information</li>
              <li>Request deletion of your personal information</li>
              <li>Opt-out of marketing communications</li>
            </ul>
          </section>

          <section>
            <h2>7. Data Retention</h2>
            <p>
              We retain your personal information for as long as necessary to fulfill the purposes outlined in this privacy statement, unless a longer retention period is required by law.
            </p>
          </section>

          <section>
            <h2>Contact Us</h2>
            <p>
              If you have questions about this Privacy Statement or want to exercise your privacy rights, please contact us at{' '}
              <a href={`mailto:${config['contact.email'] || 'contact@example.org'}`}>{config['contact.email'] || 'contact@example.org'}</a>.
            </p>
          </section>

          <section>
            <h2>Request Data Erasure</h2>
            <p>
              Under the GDPR and similar privacy regulations, you have the right to request the deletion of your personal data.
              Use the form below to submit an erasure request. We will process your request within 30 days.
            </p>
            <ErasureRequestForm />
          </section>
        </>
      )}
    </div>
  );
}
