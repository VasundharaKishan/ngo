import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { RiLockLine, RiAlertLine } from 'react-icons/ri';
import { API_BASE_URL } from '../api';
import logger from '../utils/logger';
import './ForgotPassword.css';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch(`${API_BASE_URL}/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
        credentials: 'include',
      });

      if (res.ok) {
        setSubmitted(true);
      } else {
        const errorData = await res.json();
        setError(errorData.error || 'Something went wrong. Please try again.');
      }
    } catch (err) {
      logger.error('ForgotPassword', 'Request error:', err);
      setError('Connection error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="forgot-password" data-testid="forgot-password-page">
      <Helmet>
        <title>Forgot Password &mdash; Foundation</title>
        <meta name="robots" content="noindex" />
      </Helmet>
      <div className="forgot-password-container">
        <div className="forgot-password-header">
          <h1><RiLockLine className="header-icon" /> Forgot Password</h1>
          <p>Enter your email address and we will send you a link to reset your password.</p>
        </div>

        <form onSubmit={handleSubmit} className="forgot-password-form">
          {error && (
            <div className="error-message" data-testid="forgot-password-error">
              <RiAlertLine style={{ verticalAlign: 'middle', marginRight: '0.5rem' }} /> {error}
            </div>
          )}

          {submitted ? (
            <div className="success-message" data-testid="forgot-password-success">
              If an account exists with that email, you will receive a reset link shortly.
            </div>
          ) : (
            <>
              <div className="form-group">
                <label>Email Address</label>
                <input
                  type="email"
                  value={email}
                  data-testid="forgot-password-email"
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email address"
                  required
                  autoFocus
                />
              </div>

              <button
                type="submit"
                className="btn-submit"
                disabled={loading}
                data-testid="forgot-password-submit"
              >
                {loading ? 'Sending...' : 'Send Reset Link'}
              </button>
            </>
          )}
        </form>

        <Link to="/admin/login" className="forgot-password-back-link">
          &larr; Back to Login
        </Link>
      </div>
    </div>
  );
}
