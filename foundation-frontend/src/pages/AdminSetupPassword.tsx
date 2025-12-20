import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import './AdminSetupPassword.css';

export default function AdminSetupPassword() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const [loading, setLoading] = useState(true);
  const [tokenValid, setTokenValid] = useState(false);
  const [userInfo, setUserInfo] = useState<{ username: string; email: string } | null>(null);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [securityQuestion, setSecurityQuestion] = useState('');
  const [securityAnswer, setSecurityAnswer] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const securityQuestions = [
    "What was the name of your first pet?",
    "What is your mother's maiden name?",
    "What city were you born in?",
    "What was the name of your elementary school?",
    "What is your favorite book?"
  ];

  useEffect(() => {
    if (!token) {
      setError('Invalid setup link. Please contact your administrator.');
      setLoading(false);
      return;
    }

    // Validate token
    fetch(`http://localhost:8080/api/auth/validate-setup-token?token=${token}`)
      .then(res => {
        if (res.ok) {
          return res.json();
        }
        throw new Error('Invalid or expired token');
      })
      .then(data => {
        setTokenValid(true);
        setUserInfo({ username: data.username, email: data.email });
        setLoading(false);
      })
      .catch(() => {
        setError('This setup link is invalid or has expired. Please contact your administrator for a new link.');
        setLoading(false);
      });
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validation
    if (password.length < 8) {
      setError('Password must be at least 8 characters long');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (!securityQuestion) {
      setError('Please select a security question');
      return;
    }

    if (securityAnswer.trim().length < 3) {
      setError('Security answer must be at least 3 characters long');
      return;
    }

    setSubmitting(true);

    try {
      const res = await fetch('http://localhost:8080/api/auth/setup-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          password,
          securityQuestion,
          securityAnswer
        })
      });

      if (res.ok) {
        setSuccess(true);
        setTimeout(() => {
          navigate('/admin/login');
        }, 3000);
      } else {
        const errorData = await res.json();
        setError(errorData.error || 'Failed to set up password. Please try again.');
      }
    } catch (error) {
      console.error('Setup error:', error);
      setError('Connection error. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="setup-password-page">
        <div className="setup-container">
          <div className="loading-message">
            <div className="spinner"></div>
            <p>Validating your setup link...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!tokenValid) {
    return (
      <div className="setup-password-page">
        <div className="setup-container">
          <div className="error-container">
            <h1>❌ Invalid Setup Link</h1>
            <p>{error}</p>
            <p className="help-text">
              Setup links expire after 24 hours for security reasons.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="setup-password-page">
        <div className="setup-container">
          <div className="success-container">
            <h1>✅ Account Setup Complete!</h1>
            <p>Your password has been set successfully.</p>
            <p>Redirecting to login page...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="setup-password-page">
      <div className="setup-container">
        <div className="setup-header">
          <h1>🔐 Complete Your Account Setup</h1>
          <p>Welcome, <strong>{userInfo?.username}</strong>!</p>
          <p className="email-info">{userInfo?.email}</p>
        </div>

        <form onSubmit={handleSubmit} className="setup-form">
          {error && (
            <div className="error-message">
              ⚠️ {error}
            </div>
          )}

          <div className="form-section">
            <h2>Create Your Password</h2>
            
            <div className="form-group">
              <label>Password *</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter a strong password (min 8 characters)"
                required
                minLength={8}
                disabled={submitting}
              />
              <small className="field-hint">Must be at least 8 characters</small>
            </div>

            <div className="form-group">
              <label>Confirm Password *</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter your password"
                required
                minLength={8}
                disabled={submitting}
              />
            </div>
          </div>

          <div className="form-section">
            <h2>Security Question</h2>
            <p className="section-description">
              This will be used for account recovery if you forget your password.
            </p>

            <div className="form-group">
              <label>Select a Security Question *</label>
              <select
                value={securityQuestion}
                onChange={(e) => setSecurityQuestion(e.target.value)}
                required
                disabled={submitting}
              >
                <option value="">-- Choose a question --</option>
                {securityQuestions.map((q, idx) => (
                  <option key={idx} value={q}>{q}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Your Answer *</label>
              <input
                type="text"
                value={securityAnswer}
                onChange={(e) => setSecurityAnswer(e.target.value)}
                placeholder="Enter your answer"
                required
                minLength={3}
                disabled={submitting}
              />
              <small className="field-hint">Remember this answer - you'll need it for account recovery</small>
            </div>
          </div>

          <button 
            type="submit" 
            className="btn-submit"
            disabled={submitting}
          >
            {submitting ? 'Setting up...' : 'Complete Setup'}
          </button>
        </form>
      </div>
    </div>
  );
}
