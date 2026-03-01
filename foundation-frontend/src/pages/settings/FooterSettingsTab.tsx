import { useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import { API_BASE_URL } from '../../api';
import { authFetch } from '../../utils/auth';
import logger from '../../utils/logger';
import type { FooterConfig, SocialMediaLinks, TabRef } from './types';

interface FooterSettingsTabProps {
  showToast: (msg: string, type: 'success' | 'error') => void;
}

const FooterSettingsTab = forwardRef<TabRef, FooterSettingsTabProps>(({ showToast }, ref) => {
  const [footerConfig, setFooterConfig] = useState<FooterConfig>({
    tagline: '',
    socialMedia: {
      facebook: '',
      twitter: '',
      instagram: '',
      youtube: '',
      linkedin: ''
    },
    showQuickLinks: true,
    showGetInvolved: true,
    copyrightText: '',
    disclaimerText: ''
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadFooterConfig();
  }, []);

  const loadFooterConfig = async () => {
    try {
      const res = await authFetch(`${API_BASE_URL}/admin/config/footer`);
      const data = await res.json();
      setFooterConfig(data);
    } catch (error) {
      logger.error('AdminSettingsConsolidated', 'Error loading footer config:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveFooterSettings = async () => {
    // Validation
    if (!footerConfig.tagline || footerConfig.tagline.trim().length === 0) {
      showToast('Please enter a tagline', 'error');
      return;
    }

    if (footerConfig.tagline.length > 500) {
      showToast('Tagline must not exceed 500 characters', 'error');
      return;
    }

    if (footerConfig.copyrightText.length > 500) {
      showToast('Copyright text must not exceed 500 characters', 'error');
      return;
    }

    if (footerConfig.disclaimerText.length > 2000) {
      showToast('Disclaimer text must not exceed 2000 characters', 'error');
      return;
    }

    try {
      await authFetch(`${API_BASE_URL}/admin/config/footer`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(footerConfig)
      });
      showToast('Footer configuration saved successfully', 'success');
      await loadFooterConfig();
    } catch (error) {
      showToast('Failed to save footer configuration', 'error');
    }
  };

  useImperativeHandle(ref, () => ({
    save: saveFooterSettings
  }));

  if (loading) {
    return <div className="loading-state">Loading settings...</div>;
  }

  return (
    <div className="tab-panel">
      <h2>Footer Configuration</h2>

      <div className="form-group">
        <label htmlFor="footer-tagline">Tagline *</label>
        <input
          id="footer-tagline"
          type="text"
          value={footerConfig.tagline}
          onChange={(e) => setFooterConfig(prev => ({ ...prev, tagline: e.target.value }))}
          placeholder="Empowering communities worldwide"
          required
          maxLength={500}
        />
        <small className="field-description">Footer tagline (max 500 characters)</small>
      </div>

      <div className="settings-section">
        <h3>Social Media Links</h3>
        {Object.keys(footerConfig.socialMedia).map((platform) => (
          <div key={platform} className="form-group">
            <label htmlFor={`social-${platform}`}>
              {platform.charAt(0).toUpperCase() + platform.slice(1)}
            </label>
            <input
              id={`social-${platform}`}
              type="url"
              value={footerConfig.socialMedia[platform as keyof SocialMediaLinks]}
              onChange={(e) => setFooterConfig(prev => ({
                ...prev,
                socialMedia: { ...prev.socialMedia, [platform]: e.target.value }
              }))}
              placeholder={`https://${platform}.com/yourpage`}
            />
          </div>
        ))}
      </div>

      <div className="settings-section">
        <h3>Footer Sections</h3>
        <div className="form-group">
          <label>
            <input
              type="checkbox"
              checked={footerConfig.showQuickLinks}
              onChange={(e) => setFooterConfig(prev => ({ ...prev, showQuickLinks: e.target.checked }))}
            />
            Show Quick Links section
          </label>
        </div>
        <div className="form-group">
          <label>
            <input
              type="checkbox"
              checked={footerConfig.showGetInvolved}
              onChange={(e) => setFooterConfig(prev => ({ ...prev, showGetInvolved: e.target.checked }))}
            />
            Show Get Involved section
          </label>
        </div>
      </div>

      <div className="form-group">
        <label htmlFor="footer-copyright">Copyright Text</label>
        <input
          id="footer-copyright"
          type="text"
          value={footerConfig.copyrightText}
          onChange={(e) => setFooterConfig(prev => ({ ...prev, copyrightText: e.target.value }))}
          placeholder="© 2025 Organization Name. All rights reserved."
          maxLength={500}
        />
        <small className="field-description">Footer copyright text (max 500 characters)</small>
      </div>

      <div className="form-group">
        <label htmlFor="footer-disclaimer">Disclaimer Text</label>
        <textarea
          id="footer-disclaimer"
          value={footerConfig.disclaimerText}
          onChange={(e) => setFooterConfig(prev => ({ ...prev, disclaimerText: e.target.value }))}
          placeholder="Organization is a registered nonprofit..."
          rows={4}
          maxLength={2000}
        />
        <small className="field-description">
          Footer disclaimer text (max 2000 characters) - {footerConfig.disclaimerText.length}/2000
        </small>
      </div>
    </div>
  );
});

FooterSettingsTab.displayName = 'FooterSettingsTab';

export default FooterSettingsTab;
