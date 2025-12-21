import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { API_BASE_URL } from '../api';
import './PasswordSetup.css';

interface SecurityQuestion {
  id: string;
  question: string;
}

export default function PasswordSetup() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');

  const [loading, setLoading] = useState(true);
  const [validToken, setValidToken] = useState(false);
  const [userInfo, setUserInfo] = useState({ username: '', email: '', fullName: '' });
  const [questions, setQuestions] = useState<SecurityQuestion[]>([]);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [selectedQuestions, setSelectedQuestions] = useState<{ questionId: string; answer: string }[]>([
    { questionId: '', answer: '' },
    { questionId: '', answer: '' }
  ]);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!token) {
      setError('Invalid setup link');
      setLoading(false);
      return;
    }

    validateToken();
    loadSecurityQuestions();
  }, [token]);

  const validateToken = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/auth/validate-token/${token}`);
      const data = await res.json();
      
      if (data.valid) {
        setValidToken(true);
        setUserInfo({
          username: data.username,
          email: data.email,
          fullName: data.fullName
        });
      } else {
        setError(data.message || 'Invalid or expired setup link');
      }
    } catch (error) {
      setError('Failed to validate setup link');
    } finally {
      setLoading(false);
    }
  };

  const loadSecurityQuestions = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/auth/security-questions`);
      const data = await res.json();
      setQuestions(data);
    } catch (error) {
      console.error('Failed to load security questions:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    if (selectedQuestions[0].questionId === selectedQuestions[1].questionId) {
      setError('Please select different security questions');
      return;
    }

    if (!selectedQuestions[0].answer || !selectedQuestions[1].answer) {
      setError('Please answer all security questions');
      return;
    }

    setSubmitting(true);

    try {
      const res = await fetch(`${API_BASE_URL}/auth/setup-password/${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          password,
          securityAnswers: selectedQuestions
        })
      });

      if (res.ok) {
        alert('✅ Account setup complete! You can now login.');
        navigate('/admin/login');
      } else {
        const errorData = await res.json();
        setError(errorData.error || 'Setup failed');
      }
    } catch (error) {
      setError('Connection error. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="password-setup">
        <div className="setup-container">
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  if (!validToken) {
    return (
      <div className="password-setup">
        <div className="setup-container">
          <div className="error-box">
            <h2>⚠️ Invalid Link</h2>
            <p>{error}</p>
            <button onClick={() => navigate('/admin/login')} className="btn-primary">
              Go to Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="password-setup">
      <div className="setup-container">
        <div className="setup-header">
          <h1>🔐 Complete Your Account Setup</h1>
          <p>Welcome, <strong>{userInfo.fullName}</strong>!</p>
        </div>

        <form onSubmit={handleSubmit} className="setup-form">
          {error && (
            <div className="error-message">
              ⚠️ {error}
            </div>
          )}

          <div className="form-section">
            <h3>1️⃣ Create Your Password</h3>
            
            <div className="form-group">
              <label>Password *</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                placeholder="Enter secure password (min 6 characters)"
              />
            </div>

            <div className="form-group">
              <label>Confirm Password *</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={6}
                placeholder="Re-enter your password"
              />
            </div>
          </div>

          <div className="form-section">
            <h3>2️⃣ Set Security Questions</h3>
            <p className="section-desc">Choose 2 questions to help recover your account if needed.</p>

            {selectedQuestions.map((sq, index) => (
              <div key={index} className="security-question-group">
                <div className="form-group">
                  <label>Security Question {index + 1} *</label>
                  <select
                    value={sq.questionId}
                    onChange={(e) => {
                      const updated = [...selectedQuestions];
                      updated[index].questionId = e.target.value;
                      setSelectedQuestions(updated);
                    }}
                    required
                  >
                    <option value="">-- Select a Question --</option>
                    {questions.map(q => (
                      <option key={q.id} value={q.id}>{q.question}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Your Answer *</label>
                  <input
                    type="text"
                    value={sq.answer}
                    onChange={(e) => {
                      const updated = [...selectedQuestions];
                      updated[index].answer = e.target.value;
                      setSelectedQuestions(updated);
                    }}
                    required
                    placeholder="Enter your answer"
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="form-actions">
            <button type="submit" className="btn-primary" disabled={submitting}>
              {submitting ? 'Setting up...' : '✅ Complete Setup'}
            </button>
          </div>

          <div className="info-note">
            <strong>📌 Important:</strong> Remember your password and security answers. 
            They will be required to access your account.
          </div>
        </form>
      </div>
    </div>
  );
}
