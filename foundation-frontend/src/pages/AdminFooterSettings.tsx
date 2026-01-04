import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_BASE_URL } from '../api';
import { authFetch } from '../utils/auth';
import { useToast } from '../components/ToastProvider';
import './AdminSettings.css';

interface SocialMediaLinks {
  facebook: string;
  twitter: string;
  instagram: string;
  youtube: string;
  linkedin: string;
}

interface FooterConfig {
  tagline: string;
  socialMedia: SocialMediaLinks;
  showQuickLinks: boolean;
  showGetInvolved: boolean;
  copyrightText: string;
  disclaimerText: string;
}

export default function AdminFooterSettings() {
  const navigate = useNavigate();
  const showToast = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
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

  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    if (!token) {
      navigate('/admin/login');
      return;
    }
    loadFooterConfig();
  }, [navigate]);

  const loadFooterConfig = async () => {
    try {
      const res = await authFetch(`${API_BASE_URL}/admin/config/footer`);
      const data = await res.json();
      setFooterConfig(data);
      setLoading(false);
    } catch (error) {
      console.error('Error loading footer config:', error);
      showToast('Failed to load footer configuration', 'error');
      setLoading(false);
    }
  };

  const handleSave = async () => {
    // Basic validation
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

    if (footerConfig.disclaimerText.length > 1000) {
      showToast('Disclaimer text must not exceed 1000 characters', 'error');
      return;
    }

    setSaving(true);
    try {
      await authFetch(`${API_BASE_URL}/admin/config/footer`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(footerConfig)
      });
      showToast('Footer configuration saved successfully', 'success');
      loadFooterConfig();
    } catch (error) {
      console.error('Error saving footer config:', error);
      showToast('Failed to save footer configuration', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleFieldChange = (field: keyof FooterConfig, value: string | boolean) => {
    setFooterConfig({ ...footerConfig, [field]: value });
  };

  const handleSocialMediaChange = (platform: keyof SocialMediaLinks, value: string) => {
    setFooterConfig({
      ...footerConfig,
      socialMedia: { ...footerConfig.socialMedia, [platform]: value }
    });
  };

  if (loading) {
    return <div className="admin-settings"><p>Loading...</p></div>;
  }

  return (
    <div className="admin-settings">
      <div className="settings-container">
        <div className="settings-section">
          <h2>Footer Settings</h2>
          <p className="section-description">
            Manage the footer content displayed across all pages of the website
          </p>

          {/* Tagline Section */}
          <div className="config-item">
            <div className="config-info">
              <label>Organization Tagline</label>
              <p className="field-hint">A short inspiring message about your mission ({footerConfig.tagline.length}/500)</p>
            </div>
            <div className="config-control">
              <textarea
                value={footerConfig.tagline}
                onChange={(e) => handleFieldChange('tagline', e.target.value)}
                placeholder="Empowering communities worldwide..."
                className="config-textarea"
                rows={3}
                maxLength={500}
              />
            </div>
          </div>

          {/* Social Media Links Section */}
          <div style={{ marginTop: '2rem' }}>
            <h3>Social Media Links</h3>
            <p className="section-description">Enter the complete URLs for your social media profiles</p>

            <div className="config-item">
              <div className="config-info">
                <label>Facebook URL</label>
                <p className="field-hint">Your Facebook page URL</p>
              </div>
              <div className="config-control">
                <input
                  type="url"
                  value={footerConfig.socialMedia.facebook}
                  onChange={(e) => handleSocialMediaChange('facebook', e.target.value)}
                  placeholder="https://facebook.com/yourpage"
                  className="config-input full-width"
                />
              </div>
            </div>

            <div className="config-item">
              <div className="config-info">
                <label>Twitter/X URL</label>
                <p className="field-hint">Your Twitter/X profile URL</p>
              </div>
              <div className="config-control">
                <input
                  type="url"
                  value={footerConfig.socialMedia.twitter}
                  onChange={(e) => handleSocialMediaChange('twitter', e.target.value)}
                  placeholder="https://twitter.com/yourprofile"
                  className="config-input full-width"
                />
              </div>
            </div>

            <div className="config-item">
              <div className="config-info">
                <label>Instagram URL</label>
                <p className="field-hint">Your Instagram profile URL</p>
              </div>
              <div className="config-control">
                <input
                  type="url"
                  value={footerConfig.socialMedia.instagram}
                  onChange={(e) => handleSocialMediaChange('instagram', e.target.value)}
                  placeholder="https://instagram.com/yourprofile"
                  className="config-input full-width"
                />
              </div>
            </div>

            <div className="config-item">
              <div className="config-info">
                <label>YouTube URL</label>
                <p className="field-hint">Your YouTube channel URL</p>
              </div>
              <div className="config-control">
                <input
                  type="url"
                  value={footerConfig.socialMedia.youtube}
                  onChange={(e) => handleSocialMediaChange('youtube', e.target.value)}
                  placeholder="https://youtube.com/yourchannel"
                  className="config-input full-width"
                />
              </div>
            </div>

            <div className="config-item">
              <div className="config-info">
                <label>LinkedIn URL</label>
                <p className="field-hint">Your LinkedIn company page URL</p>
              </div>
              <div className="config-control">
                <input
                  type="url"
                  value={footerConfig.socialMedia.linkedin}
                  onChange={(e) => handleSocialMediaChange('linkedin', e.target.value)}
                  placeholder="https://linkedin.com/company/yourcompany"
                  className="config-input full-width"
                />
              </div>
            </div>
          </div>

          {/* Section Visibility Section */}
          <div style={{ marginTop: '2rem' }}>
            <h3>Footer Sections Visibility</h3>
            <p className="section-description">Control which sections appear in the footer</p>

            <div className="config-item">
              <div className="config-info">
                <label>Show Quick Links</label>
                <p className="field-hint">Display Quick Links menu (All Campaigns, About Us, etc.)</p>
              </div>
              <div className="config-control">
                <label className="toggle-switch">
                  <input
                    type="checkbox"
                    checked={footerConfig.showQuickLinks}
                    onChange={(e) => handleFieldChange('showQuickLinks', e.target.checked)}
                  />
                  <span className="toggle-slider"></span>
                </label>
                <span className="toggle-label">{footerConfig.showQuickLinks ? 'Visible' : 'Hidden'}</span>
              </div>
            </div>

            <div className="config-item">
              <div className="config-info">
                <label>Show Get Involved</label>
                <p className="field-hint">Display Get Involved section with donation link</p>
              </div>
              <div className="config-control">
                <label className="toggle-switch">
                  <input
                    type="checkbox"
                    checked={footerConfig.showGetInvolved}
                    onChange={(e) => handleFieldChange('showGetInvolved', e.target.checked)}
                  />
                  <span className="toggle-slider"></span>
                </label>
                <span className="toggle-label">{footerConfig.showGetInvolved ? 'Visible' : 'Hidden'}</span>
              </div>
            </div>
          </div>

          {/* Legal Footer Section */}
          <div style={{ marginTop: '2rem' }}>
            <h3>Legal Footer Text</h3>
            <p className="section-description">Copyright and disclaimer text shown at the bottom</p>

            <div className="config-item">
              <div className="config-info">
                <label>Copyright Text</label>
                <p className="field-hint">Use {'{'}year{'}'} for current year, {'{'}siteName{'}'} for site name ({footerConfig.copyrightText.length}/500)</p>
              </div>
              <div className="config-control">
                <input
                  type="text"
                  value={footerConfig.copyrightText}
                  onChange={(e) => handleFieldChange('copyrightText', e.target.value)}
                  placeholder="© {year} {siteName}. All rights reserved."
                  className="config-input full-width"
                  maxLength={500}
                />
              </div>
            </div>

            <div className="config-item">
              <div className="config-info">
                <label>Disclaimer Text</label>
                <p className="field-hint">Legal disclaimer about tax deductions, etc. ({footerConfig.disclaimerText.length}/1000)</p>
              </div>
              <div className="config-control">
                <textarea
                  value={footerConfig.disclaimerText}
                  onChange={(e) => handleFieldChange('disclaimerText', e.target.value)}
                  placeholder="Donations are tax-deductible to the extent permitted by law."
                  className="config-textarea"
                  rows={3}
                  maxLength={1000}
                />
              </div>
            </div>
          </div>

          {/* Save Button */}
          <div style={{ marginTop: '2rem', textAlign: 'center' }}>
            <button
              onClick={handleSave}
              disabled={saving}
              className="btn-save btn-large"
            >
              {saving ? 'Saving...' : 'Save Footer Configuration'}
            </button>
          </div>
        </div>

        <div className="settings-info">
          <div className="info-box">
            <h3>💡 Tips</h3>
            <ul>
              <li>
                <strong>Tagline:</strong> Keep it short and impactful - this is the first thing visitors see in the footer.
              </li>
              <li>
                <strong>Social Media:</strong> Enter complete URLs including https://. Leave blank to hide specific platforms.
              </li>
              <li>
                <strong>Dynamic Variables:</strong> Use {'{'}year{'}'} in copyright text for automatic year updates, {'{'}siteName{'}'} for organization name.
              </li>
              <li>
                <strong>Section Visibility:</strong> Toggle sections on/off to customize footer layout based on your needs.
              </li>
              <li>
                <strong>Contact Info:</strong> Email and office addresses are managed separately in Contact Info settings.
              </li>
              <li>
                <strong>⚡ Instant Updates:</strong> Changes take effect immediately across all website pages once saved.
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
