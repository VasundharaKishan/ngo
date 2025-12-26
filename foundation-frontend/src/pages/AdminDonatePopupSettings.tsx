import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, getDonatePopupSettings, updateDonatePopupSettings, type Campaign, type DonatePopupSettingsResponse } from '../api';
import { useToast } from '../components/ToastProvider';
import './AdminSettings.css';

export default function AdminDonatePopupSettings() {
  const navigate = useNavigate();
  const showToast = useToast();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [settings, setSettings] = useState<DonatePopupSettingsResponse | null>(null);
  const [selectedCampaignId, setSelectedCampaignId] = useState<string>('');

  useEffect(() => {
    // Check if user is logged in
    const token = localStorage.getItem('adminToken');
    if (!token) {
      navigate('/admin/login');
      return;
    }
    loadData();
  }, [navigate]);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Load active campaigns
      const campaignsData = await api.getCampaigns({});
      const activeCampaigns = campaignsData.filter(c => c.active);
      setCampaigns(activeCampaigns);
      
      // Load current settings
      const settingsData = await getDonatePopupSettings();
      setSettings(settingsData);
      setSelectedCampaignId(settingsData.spotlightCampaignId || '');
      
      setLoading(false);
    } catch (error) {
      console.error('Error loading data:', error);
      showToast('Failed to load settings', 'error');
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const request = {
        campaignId: selectedCampaignId || null
      };
      
      await updateDonatePopupSettings(request);
      
      showToast(
        selectedCampaignId 
          ? 'Spotlight campaign updated successfully' 
          : 'Spotlight campaign cleared - automatic selection enabled',
        'success'
      );
      
      // Reload to show updated info
      await loadData();
    } catch (error) {
      console.error('Error updating settings:', error);
      showToast('Failed to update spotlight campaign', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleClear = async () => {
    setSaving(true);
    try {
      await updateDonatePopupSettings({ campaignId: null });
      setSelectedCampaignId('');
      showToast('Spotlight campaign cleared - automatic selection enabled', 'success');
      await loadData();
    } catch (error) {
      console.error('Error clearing spotlight:', error);
      showToast('Failed to clear spotlight campaign', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="admin-settings"><p>Loading...</p></div>;
  }

  return (
    <div className="admin-settings">
      <div className="settings-container">
        <div className="settings-section">
          <h2>Donate Popup Settings</h2>
          <p className="section-description">
            Choose which campaign appears when users click the "Donate Now" button. 
            If no spotlight is set, the system automatically shows the most recent active campaign.
          </p>

          {settings?.spotlightCampaign && (
            <div className="current-spotlight" style={{
              background: '#f0f9ff',
              border: '2px solid #0ea5e9',
              borderRadius: '12px',
              padding: '1.5rem',
              marginBottom: '2rem'
            }}>
              <h3 style={{ margin: '0 0 0.5rem 0', color: '#0ea5e9', fontSize: '0.875rem', textTransform: 'uppercase', fontWeight: 600 }}>
                🌟 Current Spotlight Campaign
              </h3>
              <p style={{ margin: '0 0 0.5rem 0', fontSize: '1.125rem', fontWeight: 600, color: '#0f172a' }}>
                {settings.spotlightCampaign.title}
              </p>
              <div style={{ display: 'flex', gap: '1rem', fontSize: '0.875rem', color: '#64748b' }}>
                <span>
                  Status: <strong style={{ color: settings.spotlightCampaign.active ? '#10b981' : '#ef4444' }}>
                    {settings.spotlightCampaign.active ? 'Active' : 'Inactive'}
                  </strong>
                </span>
                {settings.spotlightCampaign.categoryName && (
                  <span>Category: <strong>{settings.spotlightCampaign.categoryName}</strong></span>
                )}
              </div>
            </div>
          )}

          <div className="config-item">
            <div className="config-info">
              <label htmlFor="spotlight-campaign">Spotlight Campaign</label>
              <p style={{ fontSize: '0.875rem', color: '#64748b', margin: '0.25rem 0 0 0' }}>
                Select a campaign to feature in the Donate Now popup, or leave empty for automatic selection
              </p>
            </div>
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
              <select
                id="spotlight-campaign"
                value={selectedCampaignId}
                onChange={(e) => setSelectedCampaignId(e.target.value)}
                style={{
                  flex: 1,
                  padding: '0.75rem',
                  border: '2px solid #e2e8f0',
                  borderRadius: '8px',
                  fontSize: '1rem',
                  background: 'white',
                  cursor: 'pointer'
                }}
              >
                <option value="">Automatic Selection (Most Recent Active)</option>
                <optgroup label="Active Campaigns">
                  {campaigns.map(campaign => (
                    <option key={campaign.id} value={campaign.id}>
                      {campaign.title} {campaign.featured ? '⭐' : ''} {campaign.urgent ? '🔥' : ''}
                    </option>
                  ))}
                </optgroup>
              </select>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
            <button
              onClick={handleSave}
              disabled={saving}
              style={{
                padding: '0.875rem 2rem',
                background: selectedCampaignId === (settings?.spotlightCampaignId || '') ? '#94a3b8' : '#667eea',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '1rem',
                fontWeight: 600,
                cursor: selectedCampaignId === (settings?.spotlightCampaignId || '') ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s'
              }}
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
            
            {selectedCampaignId && (
              <button
                onClick={handleClear}
                disabled={saving}
                style={{
                  padding: '0.875rem 2rem',
                  background: 'white',
                  color: '#64748b',
                  border: '2px solid #e2e8f0',
                  borderRadius: '8px',
                  fontSize: '1rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                Clear Spotlight
              </button>
            )}
          </div>

          <div style={{
            marginTop: '2rem',
            padding: '1.5rem',
            background: '#f8fafc',
            borderRadius: '12px',
            border: '1px solid #e2e8f0'
          }}>
            <h3 style={{ margin: '0 0 1rem 0', fontSize: '1rem', fontWeight: 600, color: '#0f172a' }}>
              💡 How it works
            </h3>
            <ul style={{ margin: 0, paddingLeft: '1.5rem', color: '#64748b', lineHeight: 1.6 }}>
              <li>When a spotlight campaign is set, it will always appear in the Donate Now popup</li>
              <li>If no spotlight is set, the system shows the most recent active campaign (prioritized by featured, urgent, then last updated)</li>
              <li>Only active campaigns can be selected as spotlight</li>
              <li>Changes take effect immediately for all users</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
