import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const CONSENT_KEY = 'cookie_consent';

export default function CookieConsent() {
  const { t } = useTranslation();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem(CONSENT_KEY);
    if (!consent) {
      // Small delay to avoid layout shift on initial load
      const timer = setTimeout(() => setVisible(true), 1000);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem(CONSENT_KEY, 'accepted');
    setVisible(false);
  };

  const handleDecline = () => {
    localStorage.setItem(CONSENT_KEY, 'declined');
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div
      role="dialog"
      aria-label="Cookie consent"
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        background: '#1e293b',
        color: '#e2e8f0',
        padding: '1rem 1.5rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '1rem',
        flexWrap: 'wrap',
        zIndex: 9999,
        boxShadow: '0 -4px 20px rgba(0,0,0,0.2)',
        fontSize: '0.9rem',
      }}
    >
      <p style={{ margin: 0, maxWidth: '600px' }}>
        {t('cookie.message')}{' '}
        <Link to="/cookies" style={{ color: '#93c5fd', textDecoration: 'underline' }}>{t('cookie.policyLink')}</Link>.
      </p>
      <div style={{ display: 'flex', gap: '0.5rem' }}>
        <button
          onClick={handleAccept}
          style={{
            background: '#667eea',
            color: 'white',
            border: 'none',
            padding: '0.5rem 1.25rem',
            borderRadius: '6px',
            cursor: 'pointer',
            fontWeight: 600,
            fontSize: '0.85rem',
          }}
        >
          {t('cookie.accept')}
        </button>
        <button
          onClick={handleDecline}
          style={{
            background: 'transparent',
            color: '#94a3b8',
            border: '1px solid #475569',
            padding: '0.5rem 1.25rem',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '0.85rem',
          }}
        >
          {t('cookie.decline')}
        </button>
      </div>
    </div>
  );
}
