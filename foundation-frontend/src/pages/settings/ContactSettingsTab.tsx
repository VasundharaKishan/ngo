import { useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import { API_BASE_URL } from '../../api';
import { authFetch } from '../../utils/auth';
import logger from '../../utils/logger';
import type { ContactInfo, ContactLocation, TabRef } from './types';

interface ContactSettingsTabProps {
  showToast: (msg: string, type: 'success' | 'error') => void;
}

const ContactSettingsTab = forwardRef<TabRef, ContactSettingsTabProps>(({ showToast }, ref) => {
  const [contactInfo, setContactInfo] = useState<ContactInfo>({
    email: '',
    locations: [],
    showInFooter: true
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadContactInfo();
  }, []);

  const loadContactInfo = async () => {
    try {
      const res = await authFetch(`${API_BASE_URL}/admin/config/contact`);
      const data = await res.json();
      setContactInfo(data);
    } catch (error) {
      logger.error('AdminSettingsConsolidated', 'Error loading contact info:', error);
    } finally {
      setLoading(false);
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
    }
  };

  useImperativeHandle(ref, () => ({
    save: saveContactSettings
  }));

  if (loading) {
    return <div className="loading-state">Loading settings...</div>;
  }

  return (
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
  );
});

ContactSettingsTab.displayName = 'ContactSettingsTab';

export default ContactSettingsTab;
