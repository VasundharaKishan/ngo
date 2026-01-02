import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_BASE_URL } from '../api';
import { authFetch } from '../utils/auth';
import { useToast } from '../components/ToastProvider';
import { type JsonConfig } from '../types/common';
import './AdminSettings.css';

interface HomeSection {
  id: string;
  type: string;
  enabled: boolean;
  sortOrder: number;
  configJson: string;
  createdAt: string;
  updatedAt: string;
}

interface SectionUpdate {
  id: string;
  enabled: boolean;
  sortOrder: number;
  config: JsonConfig;
}

export default function AdminHomeSections() {
  const [sections, setSections] = useState<HomeSection[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingConfig, setEditingConfig] = useState<{ [key: string]: string }>({});
  const navigate = useNavigate();
  const showToast = useToast();

  useEffect(() => {
    loadSections();
  }, []);

  const loadSections = async () => {
    try {
      const response = await authFetch(`${API_BASE_URL}/admin/home/sections`);
      if (!response.ok) throw new Error('Failed to load sections');
      const data = await response.json();
      setSections(data);
      
      // Initialize editing state
      const configState: { [key: string]: string } = {};
      data.forEach((section: HomeSection) => {
        configState[section.id] = section.configJson || '{}';
      });
      setEditingConfig(configState);
    } catch (error) {
      console.error('Error loading sections:', error);
      showToast('Failed to load home sections', 'error');
    } finally {
      setLoading(false);
    }
  };

  const toggleEnabled = (id: string) => {
    setSections(sections.map(section =>
      section.id === id ? { ...section, enabled: !section.enabled } : section
    ));
  };

  const updateConfigJson = (id: string, json: string) => {
    setEditingConfig({ ...editingConfig, [id]: json });
  };

  const moveUp = (index: number) => {
    if (index === 0) return;
    const newSections = [...sections];
    [newSections[index - 1], newSections[index]] = [newSections[index], newSections[index - 1]];
    // Update sortOrder
    newSections.forEach((section, idx) => {
      section.sortOrder = (idx + 1) * 10;
    });
    setSections(newSections);
  };

  const moveDown = (index: number) => {
    if (index === sections.length - 1) return;
    const newSections = [...sections];
    [newSections[index], newSections[index + 1]] = [newSections[index + 1], newSections[index]];
    // Update sortOrder
    newSections.forEach((section, idx) => {
      section.sortOrder = (idx + 1) * 10;
    });
    setSections(newSections);
  };

  const saveChanges = async () => {
    setSaving(true);
    try {
      // Prepare updates
      const updates: SectionUpdate[] = sections.map(section => {
        let config: JsonConfig = {};
        try {
          config = JSON.parse(editingConfig[section.id] || '{}') as JsonConfig;
        } catch (e) {
          throw new Error(`Invalid JSON in section ${section.type}`);
        }

        return {
          id: section.id,
          enabled: section.enabled,
          sortOrder: section.sortOrder,
          config
        };
      });

      const response = await authFetch(
        `${API_BASE_URL}/admin/home/sections`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updates)
        }
      );

      if (!response.ok) throw new Error('Failed to update sections');

      showToast('Home sections updated successfully', 'success');
      loadSections();
    } catch (error) {
      console.error('Error saving sections:', error);
      showToast(error instanceof Error ? error.message : 'Failed to save changes', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="admin-settings">
        <div className="settings-header">
          <h1>Home Sections</h1>
        </div>
        <div className="loading-container">
          <p>Loading sections...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-settings">
      <div className="settings-header">
        <h1>Home Sections</h1>
        <button onClick={() => navigate('/admin')} className="btn-back">
          ← Back to Dashboard
        </button>
      </div>

      <div className="settings-section">
        <div className="section-header">
          <h2>Manage Homepage Layout</h2>
          <p className="section-description">
            Reorder, enable/disable, and configure sections that appear on the homepage
          </p>
        </div>

        <div className="sections-list" style={{ marginTop: '1.5rem' }}>
          {sections.map((section, index) => (
            <div key={section.id} style={{
              background: '#f8fafc',
              borderRadius: '8px',
              padding: '1.5rem',
              marginBottom: '1rem',
              border: section.enabled ? '2px solid #10b981' : '2px solid #e2e8f0'
            }}>
              {/* Header Row */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '1rem',
                marginBottom: '1rem'
              }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: '1.1rem', marginBottom: '0.25rem' }}>
                    {section.type}
                  </div>
                  <div style={{ fontSize: '0.85rem', color: '#64748b' }}>
                    Sort Order: {section.sortOrder}
                  </div>
                </div>

                {/* Enabled Toggle */}
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={section.enabled}
                    onChange={() => toggleEnabled(section.id)}
                    style={{ width: '20px', height: '20px', cursor: 'pointer' }}
                  />
                  <span style={{ fontSize: '0.95rem', fontWeight: 600, color: section.enabled ? '#10b981' : '#64748b' }}>
                    {section.enabled ? 'Enabled' : 'Disabled'}
                  </span>
                </label>

                {/* Reorder Buttons */}
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button
                    onClick={() => moveUp(index)}
                    disabled={index === 0}
                    style={{
                      padding: '0.5rem 1rem',
                      background: index === 0 ? '#e2e8f0' : '#3b82f6',
                      color: index === 0 ? '#94a3b8' : 'white',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: index === 0 ? 'not-allowed' : 'pointer',
                      fontSize: '0.9rem',
                      fontWeight: 600
                    }}
                  >
                    ↑ Up
                  </button>
                  <button
                    onClick={() => moveDown(index)}
                    disabled={index === sections.length - 1}
                    style={{
                      padding: '0.5rem 1rem',
                      background: index === sections.length - 1 ? '#e2e8f0' : '#3b82f6',
                      color: index === sections.length - 1 ? '#94a3b8' : 'white',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: index === sections.length - 1 ? 'not-allowed' : 'pointer',
                      fontSize: '0.9rem',
                      fontWeight: 600
                    }}
                  >
                    ↓ Down
                  </button>
                </div>
              </div>

              {/* Config JSON Editor */}
              <div>
                <label style={{
                  display: 'block',
                  fontSize: '0.9rem',
                  fontWeight: 600,
                  color: '#475569',
                  marginBottom: '0.5rem'
                }}>
                  Configuration (JSON)
                </label>
                <textarea
                  value={editingConfig[section.id] || '{}'}
                  onChange={(e) => updateConfigJson(section.id, e.target.value)}
                  rows={4}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    borderRadius: '6px',
                    border: '1px solid #cbd5e1',
                    fontSize: '0.85rem',
                    fontFamily: 'monospace',
                    resize: 'vertical'
                  }}
                  placeholder='{"key": "value"}'
                />
              </div>
            </div>
          ))}
        </div>

        <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'flex-end' }}>
          <button
            onClick={saveChanges}
            disabled={saving}
            style={{
              background: '#10b981',
              color: 'white',
              padding: '0.75rem 2rem',
              border: 'none',
              borderRadius: '8px',
              fontWeight: 600,
              cursor: saving ? 'not-allowed' : 'pointer',
              fontSize: '1rem',
              opacity: saving ? 0.6 : 1
            }}
          >
            {saving ? 'Saving...' : 'Save All Changes'}
          </button>
        </div>
      </div>
    </div>
  );
}
