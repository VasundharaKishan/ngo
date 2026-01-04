import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_BASE_URL } from '../api';
import { authFetch } from '../utils/auth';
import { useToast } from '../components/ToastProvider';
import { 
  RiSettings3Line, 
  RiPhoneLine, 
  RiLayoutBottomLine,
  RiGlobalLine 
} from 'react-icons/ri';
import './AdminSettingsConsolidated.css';

type TabType = 'general' | 'contact' | 'footer' | 'banner';

interface SiteSetting {
  key: string;
  value: string;
  type: 'STRING' | 'INTEGER' | 'BOOLEAN' | 'JSON';
  isPublic: boolean;
  description: string;
  createdAt: string;
  updatedAt: string;
  updatedBy: string;
}

interface ContactLocation {
  label: string;
  lines: string[];
  postalLabel: string;
  postalCode: string;
  mobile: string;
}

interface ContactInfo {
  email: string;
  locations: ContactLocation[];
  showInFooter?: boolean;
}

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

interface BannerSettings {
  enabled: boolean;
  message: string;
}

interface SettingField {
  key: string;
  label: string;
  type: 'text' | 'number' | 'color' | 'textarea';
  placeholder?: string;
  description?: string;
  category: 'branding' | 'theme' | 'pagination';
}

const GENERAL_SETTINGS: SettingField[] = [
  // Branding
  { key: 'site.name', label: 'Site Name', type: 'text', placeholder: 'Yugal Savitri Seva', description: 'Site name displayed in header and footer', category: 'branding' },
  { key: 'site.tagline', label: 'Site Tagline', type: 'text', placeholder: 'Empowering communities worldwide', description: 'Site tagline or slogan', category: 'branding' },
  { key: 'site.logo_url', label: 'Logo URL', type: 'text', placeholder: '/logo.png', description: 'Path to site logo image', category: 'branding' },
  
  // Theme
  { key: 'theme.primary_color', label: 'Primary Color', type: 'color', placeholder: '#2563eb', description: 'Primary brand color', category: 'theme' },
  { key: 'theme.secondary_color', label: 'Secondary Color', type: 'color', placeholder: '#7c3aed', description: 'Secondary brand color', category: 'theme' },
  { key: 'theme.header_height', label: 'Header Height', type: 'text', placeholder: '76px', description: 'Header height (include unit: px, rem)', category: 'theme' },
  
  // Pagination
  { key: 'homepage.featured_campaigns_count', label: 'Featured Campaigns Count', type: 'number', placeholder: '3', description: 'Number of featured campaigns on homepage', category: 'pagination' },
  { key: 'campaigns_page.items_per_page', label: 'Items Per Page', type: 'number', placeholder: '12', description: 'Number of campaigns per page', category: 'pagination' },
];

export default function AdminSettingsConsolidated() {
  const navigate = useNavigate();
  const showToast = useToast();
  const [activeTab, setActiveTab] = useState<TabType>('general');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // General Settings State
  const [settings, setSettings] = useState<Record<string, SiteSetting>>({});
  const [formValues, setFormValues] = useState<Record<string, string>>({});

  // Contact Settings State
  const [contactInfo, setContactInfo] = useState<ContactInfo>({
    email: '',
    locations: [],
    showInFooter: true
  });

  // Footer Settings State
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

  // Banner Settings State
  const [bannerSettings, setBannerSettings] = useState<BannerSettings>({
    enabled: false,
    message: 'This website is under development'
  });

  useEffect(() => {
    const user = localStorage.getItem('adminUser');
    if (!user) {
      navigate('/admin/login');
      return;
    }
    loadAllData();
  }, [navigate]);

  const loadAllData = async () => {
    setLoading(true);
    await Promise.all([
      loadGeneralSettings(),
      loadContactInfo(),
      loadFooterConfig(),
      loadBannerSettings()
    ]);
    setLoading(false);
  };

  // GENERAL SETTINGS FUNCTIONS
  const loadGeneralSettings = async () => {
    try {
      const res = await authFetch(`${API_BASE_URL}/admin/settings`);
      const data: SiteSetting[] = await res.json();
      
      const settingsMap: Record<string, SiteSetting> = {};
      const valuesMap: Record<string, string> = {};
      
      data.forEach(setting => {
        settingsMap[setting.key] = setting;
        valuesMap[setting.key] = setting.value;
      });

      setSettings(settingsMap);
      setFormValues(valuesMap);
    } catch (error) {
      console.error('Error loading general settings:', error);
    }
  };

  const handleGeneralChange = (key: string, value: string) => {
    setFormValues(prev => ({ ...prev, [key]: value }));
  };

  const saveGeneralSettings = async () => {
    setSaving(true);
    try {
      const updates = Object.entries(formValues).map(([key, value]) => ({
        key,
        value,
        type: settings[key]?.type || 'STRING',
        isPublic: settings[key]?.isPublic ?? true,
        description: settings[key]?.description || ''
      }));

      await authFetch(`${API_BASE_URL}/admin/settings/batch`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ settings: updates })
      });

      showToast('General settings saved successfully', 'success');
      await loadGeneralSettings();
    } catch (error) {
      showToast('Failed to save general settings', 'error');
    } finally {
      setSaving(false);
    }
  };

  // CONTACT SETTINGS FUNCTIONS
  const loadContactInfo = async () => {
    try {
      const res = await authFetch(`${API_BASE_URL}/admin/config/contact`);
      const data = await res.json();
      setContactInfo(data);
    } catch (error) {
      console.error('Error loading contact info:', error);
    }
  };

  const addLocation = () => {
    setContactInfo(prev => ({
      ...prev,
      locations: [...prev.locations, {
        label: '',
        lines: [''],
        postalLabel: '',
        postalCode: '',
        mobile: ''
      }]
    }));
  };

  const updateLocation = (index: number, field: keyof ContactLocation, value: any) => {
    setContactInfo(prev => ({
      ...prev,
      locations: prev.locations.map((loc, i) => 
        i === index ? { ...loc, [field]: value } : loc
      )
    }));
  };

  const removeLocation = (index: number) => {
    setContactInfo(prev => ({
      ...prev,
      locations: prev.locations.filter((_, i) => i !== index)
    }));
  };

  const addAddressLine = (locationIndex: number) => {
    setContactInfo(prev => ({
      ...prev,
      locations: prev.locations.map((loc, i) => 
        i === locationIndex ? { ...loc, lines: [...loc.lines, ''] } : loc
      )
    }));
  };

  const updateAddressLine = (locationIndex: number, lineIndex: number, value: string) => {
    setContactInfo(prev => ({
      ...prev,
      locations: prev.locations.map((loc, i) => 
        i === locationIndex 
          ? { ...loc, lines: loc.lines.map((line, j) => j === lineIndex ? value : line) }
          : loc
      )
    }));
  };

  const removeAddressLine = (locationIndex: number, lineIndex: number) => {
    setContactInfo(prev => ({
      ...prev,
      locations: prev.locations.map((loc, i) => 
        i === locationIndex 
          ? { ...loc, lines: loc.lines.filter((_, j) => j !== lineIndex) }
          : loc
      )
    }));
  };

  const saveContactSettings = async () => {
    // Validate email
    if (contactInfo.email && contactInfo.email.trim().length > 0 && !contactInfo.email.includes('@')) {
      showToast('Please enter a valid email address', 'error');
      return;
    }

    // Validate locations
    for (const location of contactInfo.locations) {
      if (!location.label || location.label.trim().length === 0) {
        showToast('Each location must have a label', 'error');
        return;
      }
    }

    setSaving(true);
    try {
      await authFetch(`${API_BASE_URL}/admin/config/contact`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(contactInfo)
      });
      showToast('Contact information saved successfully', 'success');
      await loadContactInfo();
    } catch (error) {
      showToast('Failed to save contact information', 'error');
    } finally {
      setSaving(false);
    }
  };

  // FOOTER SETTINGS FUNCTIONS
  const loadFooterConfig = async () => {
    try {
      const res = await authFetch(`${API_BASE_URL}/admin/config/footer`);
      const data = await res.json();
      setFooterConfig(data);
    } catch (error) {
      console.error('Error loading footer config:', error);
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

    setSaving(true);
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
    } finally {
      setSaving(false);
    }
  };

  // BANNER SETTINGS FUNCTIONS
  const loadBannerSettings = async () => {
    try {
      const response = await authFetch(`${API_BASE_URL}/admin/cms/content/site-settings`);

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
      console.error('Error loading banner settings:', error);
    }
  };

  const saveBannerSettings = async () => {
    setSaving(true);
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
    } finally {
      setSaving(false);
    }
  };

  // SAVE HANDLER
  const handleSave = async () => {
    switch (activeTab) {
      case 'general':
        await saveGeneralSettings();
        break;
      case 'contact':
        await saveContactSettings();
        break;
      case 'footer':
        await saveFooterSettings();
        break;
      case 'banner':
        await saveBannerSettings();
        break;
    }
  };

  if (loading) {
    return (
      <div className="admin-settings-consolidated">
        <div className="loading-state">Loading settings...</div>
      </div>
    );
  }

  return (
    <div className="admin-settings-consolidated">
      <div className="settings-header">
        <h1>Settings</h1>
        <p>Manage all site settings in one place</p>
      </div>

      {/* Tab Navigation */}
      <div className="settings-tabs">
        <button
          className={`tab-button ${activeTab === 'general' ? 'active' : ''}`}
          onClick={() => setActiveTab('general')}
        >
          <RiSettings3Line className="tab-icon" />
          <span>General</span>
        </button>
        <button
          className={`tab-button ${activeTab === 'contact' ? 'active' : ''}`}
          onClick={() => setActiveTab('contact')}
        >
          <RiPhoneLine className="tab-icon" />
          <span>Contact</span>
        </button>
        <button
          className={`tab-button ${activeTab === 'footer' ? 'active' : ''}`}
          onClick={() => setActiveTab('footer')}
        >
          <RiLayoutBottomLine className="tab-icon" />
          <span>Footer</span>
        </button>
        <button
          className={`tab-button ${activeTab === 'banner' ? 'active' : ''}`}
          onClick={() => setActiveTab('banner')}
        >
          <RiGlobalLine className="tab-icon" />
          <span>Banner</span>
        </button>
      </div>

      {/* Tab Content */}
      <div className="settings-content">
        {/* GENERAL TAB */}
        {activeTab === 'general' && (
          <div className="tab-panel">
            <h2>General Settings</h2>
            
            <div className="settings-section">
              <h3>Branding</h3>
              {GENERAL_SETTINGS.filter(s => s.category === 'branding').map(setting => (
                <div key={setting.key} className="form-group">
                  <label htmlFor={setting.key}>{setting.label}</label>
                  <input
                    id={setting.key}
                    type={setting.type}
                    value={formValues[setting.key] || ''}
                    onChange={(e) => handleGeneralChange(setting.key, e.target.value)}
                    placeholder={setting.placeholder}
                  />
                  {setting.description && (
                    <small className="field-description">{setting.description}</small>
                  )}
                </div>
              ))}
            </div>

            <div className="settings-section">
              <h3>Theme</h3>
              {GENERAL_SETTINGS.filter(s => s.category === 'theme').map(setting => (
                <div key={setting.key} className="form-group">
                  <label htmlFor={setting.key}>{setting.label}</label>
                  <input
                    id={setting.key}
                    type={setting.type}
                    value={formValues[setting.key] || ''}
                    onChange={(e) => handleGeneralChange(setting.key, e.target.value)}
                    placeholder={setting.placeholder}
                  />
                  {setting.description && (
                    <small className="field-description">{setting.description}</small>
                  )}
                </div>
              ))}
            </div>

            <div className="settings-section">
              <h3>Pagination</h3>
              {GENERAL_SETTINGS.filter(s => s.category === 'pagination').map(setting => (
                <div key={setting.key} className="form-group">
                  <label htmlFor={setting.key}>{setting.label}</label>
                  <input
                    id={setting.key}
                    type={setting.type}
                    value={formValues[setting.key] || ''}
                    onChange={(e) => handleGeneralChange(setting.key, e.target.value)}
                    placeholder={setting.placeholder}
                  />
                  {setting.description && (
                    <small className="field-description">{setting.description}</small>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* CONTACT TAB */}
        {activeTab === 'contact' && (
          <div className="tab-panel">
            <h2>Contact Information</h2>
            
            <div className="form-group">
              <label htmlFor="contact-email">Contact Email</label>
              <input
                id="contact-email"
                type="email"
                value={contactInfo.email}
                onChange={(e) => setContactInfo(prev => ({ ...prev, email: e.target.value }))}
                placeholder="info@example.org"
              />
              <small className="field-description">Primary contact email address</small>
            </div>

            <div className="form-group">
              <label>
                <input
                  type="checkbox"
                  checked={contactInfo.showInFooter ?? true}
                  onChange={(e) => setContactInfo(prev => ({ ...prev, showInFooter: e.target.checked }))}
                />
                Show contact information in footer
              </label>
            </div>

            <div className="locations-section">
              <div className="section-header">
                <h3>Locations</h3>
                <button 
                  type="button" 
                  onClick={addLocation}
                  className="btn-add"
                >
                  Add Location
                </button>
              </div>

              {contactInfo.locations.map((location, locIndex) => (
                <div key={locIndex} className="location-card">
                  <div className="card-header">
                    <h4>Location {locIndex + 1}</h4>
                    <button
                      type="button"
                      onClick={() => removeLocation(locIndex)}
                      className="btn-remove"
                    >
                      Remove
                    </button>
                  </div>

                  <div className="form-group">
                    <label>Location Label *</label>
                    <input
                      type="text"
                      value={location.label}
                      onChange={(e) => updateLocation(locIndex, 'label', e.target.value)}
                      placeholder="e.g., Main Office, Branch Office"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>Address Lines</label>
                    {location.lines.map((line, lineIndex) => (
                      <div key={lineIndex} className="input-with-button">
                        <input
                          type="text"
                          value={line}
                          onChange={(e) => updateAddressLine(locIndex, lineIndex, e.target.value)}
                          placeholder={`Address line ${lineIndex + 1}`}
                        />
                        {location.lines.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeAddressLine(locIndex, lineIndex)}
                            className="btn-icon"
                          >
                            ✕
                          </button>
                        )}
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() => addAddressLine(locIndex)}
                      className="btn-secondary btn-sm"
                    >
                      Add Address Line
                    </button>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label>Postal Label</label>
                      <input
                        type="text"
                        value={location.postalLabel}
                        onChange={(e) => updateLocation(locIndex, 'postalLabel', e.target.value)}
                        placeholder="e.g., PIN, ZIP"
                      />
                    </div>
                    <div className="form-group">
                      <label>Postal Code</label>
                      <input
                        type="text"
                        value={location.postalCode}
                        onChange={(e) => updateLocation(locIndex, 'postalCode', e.target.value)}
                        placeholder="e.g., 110001"
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Mobile Number</label>
                    <input
                      type="tel"
                      value={location.mobile}
                      onChange={(e) => updateLocation(locIndex, 'mobile', e.target.value)}
                      placeholder="+1-234-567-8900"
                    />
                  </div>
                </div>
              ))}

              {contactInfo.locations.length === 0 && (
                <div className="empty-state">
                  No locations added yet. Click "Add Location" to create one.
                </div>
              )}
            </div>
          </div>
        )}

        {/* FOOTER TAB */}
        {activeTab === 'footer' && (
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
        )}

        {/* BANNER TAB */}
        {activeTab === 'banner' && (
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
        )}
      </div>

      {/* Save Button */}
      <div className="settings-actions">
        <button
          className="btn-primary"
          onClick={handleSave}
          disabled={saving}
        >
          {saving ? 'Saving...' : 'Save Settings'}
        </button>
      </div>
    </div>
  );
}
