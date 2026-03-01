import { useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import { API_BASE_URL } from '../../api';
import { authFetch } from '../../utils/auth';
import logger from '../../utils/logger';
import type { BannerSettings, TabRef } from './types';

interface BannerSettingsTabProps {
  showToast: (msg: string, type: 'success' | 'error') => void;
}

const BannerSettingsTab = forwardRef<TabRef, BannerSettingsTabProps>(({ showToast }, ref) => {
  const [bannerSettings, setBannerSettings] = useState<BannerSettings>({
    enabled: false,
    message: 'This website is under development'
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadBannerSettings();
  }, []);

  const loadBannerSettings = async () => {
    try {
      const response = await authFetch(`${API_BASE_URL}/admin/cms/content/section/site-settings`);

      if (!response.ok) return;

      const data = await response.json();
      const bannerSetting = data.find((item: any) => item.key === 'development_banner');

      if (bannerSetting) {
        setBannerSettings({
          enabled: bannerSetting.active,
          message: bannerSetting.value || 'This website is under development'
        });
      }
    } catch (error) {
      logger.error('AdminSettingsConsolidated', 'Error loading banner settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveBannerSettings = async () => {
    try {
      await authFetch(`${API_BASE_URL}/admin/cms/content`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          section: 'site-settings',
          key: 'development_banner',
          value: bannerSettings.message,
          active: bannerSettings.enabled
        })
      });

      showToast('Banner settings saved successfully', 'success');
      await loadBannerSettings();
    } catch (error) {
      showToast('Failed to save banner settings', 'error');
    }
  };

  useImperativeHandle(ref, () => ({
    save: saveBannerSettings
  }));

  if (loading) {
    return <div className="loading-state">Loading settings...</div>;
  }

  return (
    <div className="tab-panel">
      <h2>Development Banner</h2>
      <p className="tab-description">
        Display a banner at the top of your website to inform visitors that the site is under development.
      </p>

      <div className="form-group">
        <label>
          <input
            type="checkbox"
            checked={bannerSettings.enabled}
            onChange={(e) => setBannerSettings(prev => ({ ...prev, enabled: e.target.checked }))}
          />
          Enable development banner
        </label>
      </div>

      {bannerSettings.enabled && (
        <div className="form-group">
          <label htmlFor="banner-message">Banner Message</label>
          <input
            id="banner-message"
            type="text"
            value={bannerSettings.message}
            onChange={(e) => setBannerSettings(prev => ({ ...prev, message: e.target.value }))}
            placeholder="This website is under development"
          />
          <small className="field-description">
            This message will be displayed prominently at the top of your website
          </small>
        </div>
      )}

      {bannerSettings.enabled && (
        <div className="banner-preview">
          <strong>Preview:</strong>
          <div className="preview-banner">
            {bannerSettings.message}
          </div>
        </div>
      )}
    </div>
  );
});

BannerSettingsTab.displayName = 'BannerSettingsTab';

export default BannerSettingsTab;
