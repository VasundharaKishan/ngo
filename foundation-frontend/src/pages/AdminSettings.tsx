import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_BASE_URL } from '../api';
import './AdminSettings.css';

interface SiteConfig {
  id: string;
  configKey: string;
  configValue: string;
  description: string;
}

export default function AdminSettings() {
  const navigate = useNavigate();
  const [configs, setConfigs] = useState<SiteConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    // Check if user is logged in
    const token = localStorage.getItem('adminToken');
    if (!token) {
      navigate('/admin/login');
      return;
    }
    loadConfigs();
  }, [navigate]);

  const loadConfigs = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/admin/config`);
      const data = await res.json();
      setConfigs(data);
      setLoading(false);
    } catch (error) {
      console.error('Error loading configs:', error);
      // Initialize if empty
      try {
        await fetch(`${API_BASE_URL}/admin/config/initialize`, {
          method: 'POST'
        });
        loadConfigs();
      } catch (initError) {
        console.error('Error initializing configs:', initError);
        setLoading(false);
      }
    }
  };

  const handleUpdate = async (configKey: string, newValue: string, description: string) => {
    setSaving(true);
    try {
      await fetch(`${API_BASE_URL}/admin/config`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ configKey, configValue: newValue, description })
      });
      loadConfigs();
    } catch (error) {
      console.error('Error updating config:', error);
      alert('Failed to update configuration');
    } finally {
      setSaving(false);
    }
  };

  const handleValueChange = (index: number, newValue: string) => {
    const updatedConfigs = [...configs];
    updatedConfigs[index].configValue = newValue;
    setConfigs(updatedConfigs);
  };

  if (loading) {
    return <div className="admin-settings"><p>Loading...</p></div>;
  }

  return (
    <div className="admin-settings">
      <div className="settings-container">
        <div className="settings-section">
          <h2>Display Settings</h2>
          <p className="section-description">
            Control how many items are displayed on different pages
          </p>

          {configs.length === 0 ? (
            <p style={{ textAlign: 'center', color: '#64748b', padding: '2rem' }}>
              No configuration settings found. Click "Initialize" to create defaults.
            </p>
          ) : (
            configs.map((config, index) => (
            <div key={config.id || index} className="config-item">
              <div className="config-info">
                <label>{config.description || config.configKey}</label>
                <code className="config-key">{config.configKey}</code>
              </div>
              <div className="config-control">
                <input
                  type="number"
                  value={config.configValue}
                  onChange={(e) => handleValueChange(index, e.target.value)}
                  min="1"
                  max="50"
                  className="config-input"
                />
                <button
                  onClick={() => handleUpdate(config.configKey, config.configValue, config.description)}
                  disabled={saving}
                  className="btn-save"
                >
                  {saving ? 'Saving...' : 'Save'}
                </button>
              </div>
            </div>
          ))
          )}
        </div>

        <div className="settings-info">
          <div className="info-box">
            <h3>💡 Tips</h3>
            <ul>
              <li>
                <strong>Featured Campaigns Count:</strong> Controls how many featured campaigns 
                appear on the homepage. Recommended: 3-6 campaigns.
              </li>
              <li>
                <strong>Items Per Page:</strong> Sets the number of campaigns shown on the 
                campaigns list page. Recommended: 9-12 campaigns.
              </li>
              <li>
                <strong>⚡ Instant Updates:</strong> Changes take effect immediately. Users will see 
                the new settings as soon as they load or refresh the page.
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
