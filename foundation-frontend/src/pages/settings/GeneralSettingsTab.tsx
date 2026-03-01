import { useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import { API_BASE_URL } from '../../api';
import { authFetch } from '../../utils/auth';
import logger from '../../utils/logger';
import { GENERAL_SETTINGS, buildGeneralSettingTestId } from './types';
import type { SiteSetting, TabRef } from './types';

interface GeneralSettingsTabProps {
  showToast: (msg: string, type: 'success' | 'error') => void;
}

const GeneralSettingsTab = forwardRef<TabRef, GeneralSettingsTabProps>(({ showToast }, ref) => {
  const [settings, setSettings] = useState<Record<string, SiteSetting>>({});
  const [formValues, setFormValues] = useState<Record<string, string>>({});
  const [logoUploading, setLogoUploading] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadGeneralSettings();
  }, []);

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
      logger.error('AdminSettingsConsolidated', 'Error loading general settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleGeneralChange = (key: string, value: string) => {
    setFormValues(prev => ({ ...prev, [key]: value }));
  };

  const handleLogoUpload = async (file: File) => {
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      showToast('Logo file must be under 5 MB', 'error');
      return;
    }
    setLogoUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await authFetch(`${API_BASE_URL}/admin/upload/image`, {
        method: 'POST',
        body: formData,
      });
      if (!res.ok) throw new Error('Upload failed');
      const data = await res.json();
      handleGeneralChange('site.logo_url', data.url);
      showToast('Logo uploaded successfully', 'success');
    } catch {
      showToast('Failed to upload logo', 'error');
    } finally {
      setLogoUploading(false);
    }
  };

  const saveGeneralSettings = async () => {
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
    }
  };

  useImperativeHandle(ref, () => ({
    save: saveGeneralSettings
  }));

  if (loading) {
    return <div className="loading-state">Loading settings...</div>;
  }

  return (
    <div className="tab-panel">
      <h2>General Settings</h2>

      <div className="settings-section">
        <h3>Branding</h3>
        {GENERAL_SETTINGS.filter(s => s.category === 'branding').map(setting => (
          <div key={setting.key} className="form-group">
            <label htmlFor={setting.key}>{setting.label}</label>
            {setting.key === 'site.logo_url' ? (
              <>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                  <input
                    id={setting.key}
                    type="text"
                    value={formValues[setting.key] || ''}
                    onChange={(e) => handleGeneralChange(setting.key, e.target.value)}
                    placeholder={setting.placeholder}
                    data-testid={buildGeneralSettingTestId(setting.key)}
                    style={{ flex: 1, minWidth: '200px' }}
                  />
                  <label
                    htmlFor="logo-file-upload"
                    className="btn-upload"
                    style={{ cursor: logoUploading ? 'not-allowed' : 'pointer', opacity: logoUploading ? 0.6 : 1 }}
                    title="Upload a logo image (max 5 MB)"
                  >
                    {logoUploading ? 'Uploading\u2026' : '\uD83D\uDCC1 Upload Logo'}
                  </label>
                  <input
                    id="logo-file-upload"
                    type="file"
                    accept="image/*"
                    style={{ display: 'none' }}
                    disabled={logoUploading}
                    data-testid="logo-file-input"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleLogoUpload(file);
                      e.target.value = '';
                    }}
                  />
                </div>
                {formValues[setting.key] && (
                  <div style={{ marginTop: '0.5rem' }}>
                    <img
                      src={formValues[setting.key]}
                      alt="Current logo preview"
                      style={{ maxHeight: '64px', maxWidth: '200px', objectFit: 'contain', border: '1px solid #ddd', borderRadius: '4px', padding: '4px' }}
                      data-testid="logo-preview"
                      onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                    />
                  </div>
                )}
              </>
            ) : (
              <input
                id={setting.key}
                type={setting.type}
                value={formValues[setting.key] || ''}
                onChange={(e) => handleGeneralChange(setting.key, e.target.value)}
                placeholder={setting.placeholder}
                data-testid={buildGeneralSettingTestId(setting.key)}
              />
            )}
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
              data-testid={buildGeneralSettingTestId(setting.key)}
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
              data-testid={buildGeneralSettingTestId(setting.key)}
            />
            {setting.description && (
              <small className="field-description">{setting.description}</small>
            )}
          </div>
        ))}
      </div>
    </div>
  );
});

GeneralSettingsTab.displayName = 'GeneralSettingsTab';

export default GeneralSettingsTab;
