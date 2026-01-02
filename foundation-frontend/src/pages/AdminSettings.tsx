import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_BASE_URL } from '../api';
import { authFetch } from '../utils/auth';
import { useToast } from '../components/ToastProvider';
import './AdminSettings.css';

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

interface SettingField {
  key: string;
  label: string;
  type: 'text' | 'number' | 'color' | 'textarea';
  placeholder?: string;
  description?: string;
  category: 'branding' | 'theme' | 'pagination' | 'contact' | 'footer';
}

const KNOWN_SETTINGS: SettingField[] = [
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
  
  // Contact
  { key: 'contact.email', label: 'Contact Email', type: 'text', placeholder: 'info@example.org', description: 'Primary contact email', category: 'contact' },
  { key: 'contact.phone', label: 'Contact Phone', type: 'text', placeholder: '+1-234-567-8900', description: 'Primary contact phone', category: 'contact' },
  
  // Footer
  { key: 'footer.copyright_text', label: 'Copyright Text', type: 'text', placeholder: '© 2025 Organization Name', description: 'Footer copyright text', category: 'footer' },
  { key: 'footer.disclaimer', label: 'Footer Disclaimer', type: 'textarea', placeholder: 'Organization is a registered nonprofit...', description: 'Footer disclaimer text', category: 'footer' },
];

export default function AdminSettings() {
  const navigate = useNavigate();
  const showToast = useToast();
  const [settings, setSettings] = useState<Record<string, SiteSetting>>({});
  const [formValues, setFormValues] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    if (!token) {
      navigate('/admin/login');
      return;
    }
    loadSettings();
  }, [navigate]);

  const loadSettings = async () => {
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
      setLoading(false);
    } catch (error) {
      console.error('Error loading settings:', error);
      showToast('Failed to load settings', 'error');
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Only send changed values
      const updates: Record<string, string> = {};
      Object.keys(formValues).forEach(key => {
        if (settings[key] && formValues[key] !== settings[key].value) {
          updates[key] = formValues[key];
        }
      });
      
      if (Object.keys(updates).length === 0) {
        showToast('No changes to save', 'info');
        setSaving(false);
        return;
      }
      
      const res = await authFetch(`${API_BASE_URL}/admin/settings`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });
      
      const results: Record<string, string> = await res.json();
      
      // Check for errors
      const errors = Object.entries(results).filter(([_, status]) => status.startsWith('ERROR'));
      if (errors.length > 0) {
        showToast(`Failed to update ${errors.length} setting(s)`, 'error');
      } else {
        showToast('Settings saved successfully', 'success');
      }
      
      loadSettings();
    } catch (error) {
      console.error('Error saving settings:', error);
      showToast('Failed to save settings', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleValueChange = (key: string, value: string) => {
    setFormValues(prev => ({ ...prev, [key]: value }));
  };

  const renderField = (field: SettingField) => {
    const value = formValues[field.key] || '';
    const setting = settings[field.key];
    
    return (
      <div key={field.key} className="config-item">
        <div className="config-info">
          <label>{field.label}</label>
          <span className="config-key">{field.key}</span>
          {field.description && <p className="config-description">{field.description}</p>}
          {setting && (
            <small className="config-meta">
              Last updated: {new Date(setting.updatedAt).toLocaleString()} by {setting.updatedBy}
            </small>
          )}
        </div>
        <div className="config-input">
          {field.type === 'textarea' ? (
            <textarea
              value={value}
              onChange={(e) => handleValueChange(field.key, e.target.value)}
              placeholder={field.placeholder}
              rows={3}
            />
          ) : (
            <input
              type={field.type}
              value={value}
              onChange={(e) => handleValueChange(field.key, e.target.value)}
              placeholder={field.placeholder}
            />
          )}
        </div>
      </div>
    );
  };

  const renderCategory = (category: string, title: string) => {
    const categoryFields = KNOWN_SETTINGS.filter(f => f.category === category);
    if (categoryFields.length === 0) return null;
    
    return (
      <div className="settings-section">
        <h2>{title}</h2>
        <div className="section-description">Configure {title.toLowerCase()} settings</div>
        {categoryFields.map(field => renderField(field))}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="admin-settings">
        <div className="settings-header">
          <h1>Site Settings</h1>
        </div>
        <p>Loading settings...</p>
      </div>
    );
  }

  return (
    <div className="admin-settings">
      <div className="settings-header">
        <h1>Site Settings</h1>
        <button onClick={handleSave} disabled={saving} className="btn-save-all">
          {saving ? 'Saving...' : 'Save All Changes'}
        </button>
      </div>

      <div className="settings-grid">
        {renderCategory('branding', 'Site Branding')}
        {renderCategory('theme', 'Theme Customization')}
        {renderCategory('pagination', 'Pagination Settings')}
        {renderCategory('contact', 'Contact Information')}
        {renderCategory('footer', 'Footer Content')}
      </div>

      <div className="settings-info-box">
        <h3>💡 About Site Settings</h3>
        <ul>
          <li><strong>Site Branding:</strong> Configure your organization name, tagline, and logo</li>
          <li><strong>Theme:</strong> Customize colors and layout dimensions</li>
          <li><strong>Pagination:</strong> Control how many items display per page</li>
          <li><strong>Contact:</strong> Set public contact information</li>
          <li><strong>Footer:</strong> Manage footer copyright and disclaimer text</li>
          <li><strong>⚡ Live Updates:</strong> Changes apply immediately after saving</li>
        </ul>
      </div>
    </div>
  );
}
