import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { authFetch } from '../utils/auth';
import { API_BASE_URL } from '../config/constants';
import '../styles/AdminCMS.css';

interface BannerSettings {
  enabled: boolean;
  message: string;
}

function AdminSiteSettings() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [bannerSettings, setBannerSettings] = useState<BannerSettings>({
    enabled: false,
    message: 'This website is under development'
  });

  // Check authentication
  useEffect(() => {
    const user = localStorage.getItem('adminUser');
    if (!user) {
      navigate('/admin/login');
    }
  }, [navigate]);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await authFetch(`${API_BASE_URL}/admin/cms/content/site-settings`);

      if (!response.ok) throw new Error('Failed to load settings');

      const data = await response.json();
      const bannerSetting = data.find((item: any) => item.key === 'development_banner');
      
      if (bannerSetting) {
        setBannerSettings({
          enabled: bannerSetting.active,
          message: bannerSetting.value || 'This website is under development'
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    setSuccess(null);
    
    try {
      // Save as CMS content item
      const response = await authFetch(`${API_BASE_URL}/admin/cms/content`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          section: 'site-settings',
          key: 'development_banner',
          value: bannerSettings.message,
          contentType: 'text',
          active: bannerSettings.enabled
        }),
      });

      if (!response.ok) throw new Error('Failed to save settings');

      setSuccess('Settings saved successfully!');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="admin-cms"><div className="loading">Loading settings...</div></div>;
  }

  return (
    <div className="admin-cms">
      <div className="cms-header">
        <h1>Site Settings</h1>
        <button onClick={() => navigate('/admin/dashboard')} className="btn-secondary">
          Back to Dashboard
        </button>
      </div>

      {error && <div className="error-message">{error}</div>}
      {success && <div className="success-message">{success}</div>}

      <div className="settings-container">
        <div className="settings-section">
          <h2>Development Banner</h2>
          <p className="section-description">
            Control the development banner that appears at the top of all pages
          </p>

          <div className="setting-item">
            <label className="toggle-label">
              <input
                type="checkbox"
                checked={bannerSettings.enabled}
                onChange={(e) => setBannerSettings({ ...bannerSettings, enabled: e.target.checked })}
              />
              <span className="toggle-switch"></span>
              <span className="toggle-text">Show Development Banner</span>
            </label>
          </div>

          <div className="setting-item">
            <label>Banner Message</label>
            <input
              type="text"
              className="full-width-input"
              value={bannerSettings.message}
              onChange={(e) => setBannerSettings({ ...bannerSettings, message: e.target.value })}
              placeholder="Enter banner message"
              disabled={!bannerSettings.enabled}
            />
            <small className="field-hint">This message will be displayed in the development banner</small>
          </div>

          {bannerSettings.enabled && (
            <div className="banner-preview">
              <h3>Preview:</h3>
              <div className="preview-banner">
                <span>🚧 {bannerSettings.message}</span>
              </div>
            </div>
          )}

          <div className="form-actions">
            <button 
              onClick={handleSave} 
              className="btn-primary" 
              disabled={saving}
            >
              {saving ? 'Saving...' : 'Save Settings'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminSiteSettings;
