import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_BASE_URL } from '../api';
import './AdminLogin.css';

export default function AdminLogin() {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
        credentials: 'include' // Enable cookies for httpOnly JWT
      });

      if (res.ok) {
        const data = await res.json();
        
        // JWT is now in httpOnly cookie - no need to store token in localStorage
        // Only store non-sensitive user info for UI display
        localStorage.setItem('adminUser', JSON.stringify({
          username: data.username,
          email: data.email,
          fullName: data.fullName,
          role: data.role
        }));
        
        // Create session tracking (for activity monitoring, not authentication)
        const sessionId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        localStorage.setItem('admin_session_id', sessionId);
        localStorage.setItem('admin_last_activity', Date.now().toString());
        sessionStorage.setItem('admin_session_id', sessionId);
        
        navigate('/admin');
      } else {
        const errorData = await res.json();
        setError(errorData.error || 'Login failed');
      }
    } catch (error) {
      console.error('Login error:', error);
      setError('Connection error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-login">
      <div className="login-container">
        <div className="login-header">
          <h1>🛠️ Admin Portal</h1>
          <p>Yugal Savitri Seva</p>
        </div>

        <form onSubmit={handleLogin} className="login-form">
          {error && (
            <div className="error-message">
              ⚠️ {error}
            </div>
          )}

          <div className="form-group">
            <label>Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter your username"
              required
              autoFocus
            />
          </div>

          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              required
            />
          </div>

          <button type="submit" className="btn-login" disabled={loading}>
            {loading ? 'Logging in...' : 'Login'}
          </button>

        </form>

        <button onClick={() => navigate('/')} className="btn-home">
          ← Back to Website
        </button>
      </div>
    </div>
  );
}
