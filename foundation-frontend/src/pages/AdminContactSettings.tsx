import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_BASE_URL } from '../api';
import { authFetch } from '../utils/auth';
import { useToast } from '../components/ToastProvider';
import './AdminSettings.css';

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

export default function AdminContactSettings() {
  const navigate = useNavigate();
  const showToast = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [contactInfo, setContactInfo] = useState<ContactInfo>({
    email: '',
    locations: [],
    showInFooter: true
  });

  useEffect(() => {
    // Check if user is logged in
    const token = localStorage.getItem('adminToken');
    if (!token) {
      navigate('/admin/login');
      return;
    }
    loadContactInfo();
  }, [navigate]);

  const loadContactInfo = async () => {
    try {
      const res = await authFetch(`${API_BASE_URL}/admin/config/contact`);
      const data = await res.json();
      setContactInfo(data);
      setLoading(false);
    } catch (error) {
      console.error('Error loading contact info:', error);
      showToast('Failed to load contact information', 'error');
      setLoading(false);
    }
  };

  const handleSave = async () => {
    // Validate email if provided
    if (contactInfo.email && contactInfo.email.trim().length > 0 && !contactInfo.email.includes('@')) {
      showToast('Please enter a valid email address', 'error');
      return;
    }

    // Validate locations - each location must have a label if it exists
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
      loadContactInfo();
    } catch (error) {
      console.error('Error saving contact info:', error);
      showToast('Failed to save contact information', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleEmailChange = (newEmail: string) => {
    setContactInfo({ ...contactInfo, email: newEmail });
  };

  const handleLocationChange = (index: number, field: keyof ContactLocation, value: string | string[]) => {
    const updatedLocations = [...contactInfo.locations];
    updatedLocations[index] = { ...updatedLocations[index], [field]: value };
    setContactInfo({ ...contactInfo, locations: updatedLocations });
  };

  const handleLinesChange = (index: number, linesText: string) => {
    const lines = linesText.split('\n').filter(line => line.trim() !== '');
    handleLocationChange(index, 'lines', lines);
  };

  const addLocation = () => {
    const newLocation: ContactLocation = {
      label: '',
      lines: [],
      postalLabel: '',
      postalCode: '',
      mobile: ''
    };
    setContactInfo({ ...contactInfo, locations: [...contactInfo.locations, newLocation] });
  };

  const removeLocation = (index: number) => {
    const updatedLocations = contactInfo.locations.filter((_, i) => i !== index);
    setContactInfo({ ...contactInfo, locations: updatedLocations });
  };

  if (loading) {
    return <div className="admin-settings"><p>Loading...</p></div>;
  }

  return (
    <div className="admin-settings">
      <div className="settings-container">
        <div className="settings-section">
          <h2>Contact Information</h2>
          <p className="section-description">
            Manage the contact details displayed on the website footer
          </p>

          {/* Show in Footer Toggle */}
          <div className="config-item">
            <div className="config-info">
              <label>Show Contact Section in Footer</label>
              <p className="field-hint">Display contact information in the website footer</p>
            </div>
            <div className="config-control">
              <label className="toggle-switch">
                <input
                  type="checkbox"
                  checked={contactInfo.showInFooter !== false}
                  onChange={(e) => setContactInfo({ ...contactInfo, showInFooter: e.target.checked })}
                />
                <span className="toggle-slider"></span>
              </label>
              <span className="toggle-label">{contactInfo.showInFooter !== false ? 'Visible' : 'Hidden'}</span>
            </div>
          </div>

          {/* Email Section */}
          <div className="config-item">
            <div className="config-info">
              <label>Email Address (Optional)</label>
              <p className="field-hint">Main contact email for the foundation</p>
            </div>
            <div className="config-control">
              <input
                type="email"
                value={contactInfo.email}
                onChange={(e) => handleEmailChange(e.target.value)}
                placeholder="contact@example.com"
                className="config-input full-width"
              />
            </div>
          </div>

          {/* Locations Section */}
          <div style={{ marginTop: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ margin: 0 }}>Office Locations</h3>
              <button onClick={addLocation} className="btn-add" style={{ padding: '0.5rem 1rem', fontSize: '0.9rem' }}>
                ➕ Add Location
              </button>
            </div>
            {contactInfo.locations.length === 0 && (
              <p style={{ color: '#64748b', fontStyle: 'italic', marginBottom: '1rem' }}>
                No locations added. Click "Add Location" to add office addresses.
              </p>
            )}
            {contactInfo.locations.map((location, index) => (
              <div key={index} className="location-section" style={{ position: 'relative', border: '1px solid #e2e8f0', padding: '1.5rem', marginBottom: '1rem', borderRadius: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <h4 style={{ margin: 0 }}>{location.label || `Location ${index + 1}`}</h4>
                  <button 
                    onClick={() => removeLocation(index)} 
                    className="btn-delete"
                    style={{ background: '#ef4444', color: 'white', border: 'none', padding: '0.5rem 1rem', borderRadius: '4px', cursor: 'pointer' }}
                  >
                    🗑️ Remove
                  </button>
                </div>
                
                <div className="config-item">
                  <div className="config-info">
                    <label>Label</label>
                    <p className="field-hint">Location name (e.g., "Ireland Office")</p>
                  </div>
                  <div className="config-control">
                    <input
                      type="text"
                      value={location.label}
                      onChange={(e) => handleLocationChange(index, 'label', e.target.value)}
                      className="config-input full-width"
                    />
                  </div>
                </div>

                <div className="config-item">
                  <div className="config-info">
                    <label>Address Lines</label>
                    <p className="field-hint">One line per row</p>
                  </div>
                  <div className="config-control">
                    <textarea
                      value={location.lines.join('\n')}
                      onChange={(e) => handleLinesChange(index, e.target.value)}
                      rows={4}
                      className="config-textarea"
                      placeholder="Street address&#10;City, State"
                    />
                  </div>
                </div>

                <div className="config-item">
                  <div className="config-info">
                    <label>Postal Label</label>
                    <p className="field-hint">E.g., "Eircode" or "Pincode"</p>
                  </div>
                  <div className="config-control">
                    <input
                      type="text"
                      value={location.postalLabel}
                      onChange={(e) => handleLocationChange(index, 'postalLabel', e.target.value)}
                      className="config-input full-width"
                    />
                  </div>
                </div>

                <div className="config-item">
                  <div className="config-info">
                    <label>Postal Code</label>
                    <p className="field-hint">Zip/postal code</p>
                  </div>
                  <div className="config-control">
                    <input
                      type="text"
                      value={location.postalCode}
                      onChange={(e) => handleLocationChange(index, 'postalCode', e.target.value)}
                      className="config-input full-width"
                    />
                  </div>
                </div>

                <div className="config-item">
                  <div className="config-info">
                    <label>Mobile Number</label>
                    <p className="field-hint">With country code</p>
                  </div>
                  <div className="config-control">
                    <input
                      type="tel"
                      value={location.mobile}
                      onChange={(e) => handleLocationChange(index, 'mobile', e.target.value)}
                      className="config-input full-width"
                      placeholder="+1 234 567 8900"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Save Button */}
          <div style={{ marginTop: '2rem', textAlign: 'center' }}>
            <button
              onClick={handleSave}
              disabled={saving}
              className="btn-save btn-large"
            >
              {saving ? 'Saving...' : 'Save Contact Information'}
            </button>
          </div>
        </div>

        <div className="settings-info">
          <div className="info-box">
            <h3>💡 Tips</h3>
            <ul>
              <li>
                <strong>Email:</strong> This email will be displayed in the footer and used 
                as the main contact point for visitors.
              </li>
              <li>
                <strong>Locations:</strong> Each office location can have its own address, 
                postal code, and phone number.
              </li>
              <li>
                <strong>Address Format:</strong> Enter each line of the address on a separate 
                row in the Address Lines field.
              </li>
              <li>
                <strong>⚡ Instant Updates:</strong> Changes take effect immediately on the 
                website footer once saved.
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
