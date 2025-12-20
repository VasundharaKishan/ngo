import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
      const res = await fetch('http://localhost:8080/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });

      if (res.ok) {
        const data = await res.json();
        
        // Clear any existing sessions
        localStorage.removeItem('admin_session_id');
        localStorage.removeItem('admin_last_activity');
        sessionStorage.clear();
        
        // Create new session
        const sessionId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        localStorage.setItem('admin_session_id', sessionId);
        localStorage.setItem('admin_last_activity', Date.now().toString());
        sessionStorage.setItem('admin_session_id', sessionId);
        
        // Store auth data in localStorage
        localStorage.setItem('adminToken', data.token);
        localStorage.setItem('adminUser', JSON.stringify({
          username: data.username,
          email: data.email,
          fullName: data.fullName,
          role: data.role
        }));
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
          <p>Hope Foundation</p>
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

          <div className="login-info">
            <p>Default credentials:</p>
            <code>Username: admin / Password: admin123</code>
          </div>
        </form>

        <button onClick={() => navigate('/')} className="btn-home">
          ← Back to Website
        </button>
      </div>
    </div>
  );
}
