import { useState, useEffect, useMemo } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { RiLockLine, RiAlertLine } from 'react-icons/ri';
import { API_BASE_URL } from '../api';
import logger from '../utils/logger';
import './ResetPassword.css';

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');

  const [loading, setLoading] = useState(true);
  const [validToken, setValidToken] = useState(false);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!token) {
      setError('Invalid or expired reset link');
      setLoading(false);
      return;
    }

    validateToken();
  }, [token]);

  const validateToken = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/auth/validate-token/${token}`);
      const data = await res.json();

      if (data.valid) {
        setValidToken(true);
      } else {
        setError(data.message || 'Invalid or expired reset link');
      }
    } catch (err) {
      logger.error('ResetPassword', 'Token validation error:', err);
      setError('Failed to validate reset link');
    } finally {
      setLoading(false);
    }
  };

  const requirements = useMemo(() => ({
    minLength: password.length >= 8,
    hasUppercase: /[A-Z]/.test(password),
    hasLowercase: /[a-z]/.test(password),
    hasDigit: /\d/.test(password),
    passwordsMatch: password.length > 0 && password === confirmPassword,
  }), [password, confirmPassword]);

  const allRequirementsMet = requirements.minLength
    && requirements.hasUppercase
    && requirements.hasLowercase
    && requirements.hasDigit
    && requirements.passwordsMatch;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!requirements.minLength) {
      setError('Password must be at least 8 characters');
      return;
    }
    if (!requirements.hasUppercase || !requirements.hasLowercase || !requirements.hasDigit) {
      setError('Password must contain at least 1 uppercase letter, 1 lowercase letter, and 1 digit');
      return;
    }
    if (!requirements.passwordsMatch) {
      setError('Passwords do not match');
      return;
    }

    setSubmitting(true);

    try {
      const res = await fetch(`${API_BASE_URL}/auth/reset-password/${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
        credentials: 'include',
      });

      if (res.ok) {
        setSuccess(true);
        setTimeout(() => {
          navigate('/admin/login');
        }, 3000);
      } else {
        const errorData = await res.json();
        setError(errorData.error || 'Failed to reset password. Please try again.');
      }
    } catch (err) {
      logger.error('ResetPassword', 'Reset error:', err);
      setError('Connection error. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="reset-password" data-testid="reset-password-page">
        <Helmet>
          <title>Reset Password &mdash; Foundation</title>
          <meta name="robots" content="noindex" />
        </Helmet>
        <div className="reset-password-container">
          <div className="reset-password-loading">Validating reset link...</div>
        </div>
      </div>
    );
  }

  if (!validToken) {
    return (
      <div className="reset-password" data-testid="reset-password-page">
        <Helmet>
          <title>Reset Password &mdash; Foundation</title>
          <meta name="robots" content="noindex" />
        </Helmet>
        <div className="reset-password-container">
          <div className="reset-password-error-state">
            <h2>
              <RiAlertLine style={{ verticalAlign: 'middle', marginRight: '0.5rem' }} />
              Invalid Link
            </h2>
            <p data-testid="reset-password-error">{error || 'Invalid or expired reset link'}</p>
            <Link to="/admin/forgot-password" className="reset-password-back-link">
              Request a new reset link
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="reset-password" data-testid="reset-password-page">
      <Helmet>
        <title>Reset Password &mdash; Foundation</title>
        <meta name="robots" content="noindex" />
      </Helmet>
      <div className="reset-password-container">
        <div className="reset-password-header">
          <h1><RiLockLine className="header-icon" /> Reset Password</h1>
          <p>Enter your new password below.</p>
        </div>

        <form onSubmit={handleSubmit} className="reset-password-form">
          {error && (
            <div className="error-message" data-testid="reset-password-error">
              <RiAlertLine style={{ verticalAlign: 'middle', marginRight: '0.5rem' }} /> {error}
            </div>
          )}

          {success ? (
            <div className="success-message" data-testid="reset-password-success">
              Your password has been reset successfully!
              <p>Redirecting to login page in a few seconds...</p>
              <Link to="/admin/login" className="reset-password-back-link" style={{ marginTop: '1rem' }}>
                Go to Login
              </Link>
            </div>
          ) : (
            <>
              <div className="form-group">
                <label>New Password</label>
                <input
                  type="password"
                  value={password}
                  data-testid="reset-password-password"
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter new password"
                  required
                  autoFocus
                />
              </div>

              <div className="form-group">
                <label>Confirm Password</label>
                <input
                  type="password"
                  value={confirmPassword}
                  data-testid="reset-password-confirm"
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter your password"
                  required
                />
              </div>

              <div className="password-requirements">
                <p>Password Requirements</p>
                <ul>
                  <li className={requirements.minLength ? 'met' : ''}>
                    <span className="check-icon">{requirements.minLength ? '✓' : '•'}</span>
                    At least 8 characters
                  </li>
                  <li className={requirements.hasUppercase ? 'met' : ''}>
                    <span className="check-icon">{requirements.hasUppercase ? '✓' : '•'}</span>
                    At least 1 uppercase letter
                  </li>
                  <li className={requirements.hasLowercase ? 'met' : ''}>
                    <span className="check-icon">{requirements.hasLowercase ? '✓' : '•'}</span>
                    At least 1 lowercase letter
                  </li>
                  <li className={requirements.hasDigit ? 'met' : ''}>
                    <span className="check-icon">{requirements.hasDigit ? '✓' : '•'}</span>
                    At least 1 digit
                  </li>
                  <li className={requirements.passwordsMatch ? 'met' : ''}>
                    <span className="check-icon">{requirements.passwordsMatch ? '✓' : '•'}</span>
                    Passwords match
                  </li>
                </ul>
              </div>

              <button
                type="submit"
                className="btn-submit"
                disabled={submitting || !allRequirementsMet}
                data-testid="reset-password-submit"
              >
                {submitting ? 'Resetting...' : 'Reset Password'}
              </button>
            </>
          )}
        </form>

        {!success && (
          <Link to="/admin/login" className="reset-password-back-link">
            &larr; Back to Login
          </Link>
        )}
      </div>
    </div>
  );
}
