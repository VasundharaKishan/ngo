import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_BASE_URL } from '../api';
import { authFetch } from '../utils/auth';
import { useToast } from '../components/ToastProvider';
import { type JsonConfig } from '../types/common';
import { RiImageLine, RiLayoutLine } from 'react-icons/ri';
import './AdminHomepage.css';

type TabType = 'hero' | 'sections';

interface HeroSlide {
  id: string;
  imageUrl: string;
  altText: string;
  focus: 'CENTER' | 'LEFT' | 'RIGHT' | 'TOP' | 'BOTTOM';
  enabled: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

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

const FOCUS_OPTIONS: Array<'CENTER' | 'LEFT' | 'RIGHT' | 'TOP' | 'BOTTOM'> = [
  'CENTER', 'LEFT', 'RIGHT', 'TOP', 'BOTTOM'
];

export default function AdminHomepage() {
  const navigate = useNavigate();
  const showToast = useToast();
  const [activeTab, setActiveTab] = useState<TabType>('hero');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Hero Slides State
  const [slides, setSlides] = useState<HeroSlide[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [newSlide, setNewSlide] = useState({ 
    imageUrl: '', 
    altText: '', 
    focus: 'CENTER' as HeroSlide['focus'], 
    filename: '' 
  });

  // Home Sections State
  const [sections, setSections] = useState<HomeSection[]>([]);
  const [editingConfig, setEditingConfig] = useState<{ [key: string]: string }>({});

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
    await Promise.all([loadSlides(), loadSections()]);
    setLoading(false);
  };

  // ========== HERO SLIDES FUNCTIONS ==========
  const loadSlides = async () => {
    try {
      const response = await authFetch(`${API_BASE_URL}/admin/hero-slides`);
      if (!response.ok) throw new Error('Failed to load slides');
      const data = await response.json();
      setSlides(data);
    } catch (error) {
      console.error('Error loading slides:', error);
      showToast('Failed to load hero slides', 'error');
    }
  };

  const toggleSlideEnabled = (id: string) => {
    setSlides(slides.map(slide =>
      slide.id === id ? { ...slide, enabled: !slide.enabled } : slide
    ));
  };

  const updateSlideFocus = (id: string, focus: HeroSlide['focus']) => {
    setSlides(slides.map(slide =>
      slide.id === id ? { ...slide, focus } : slide
    ));
  };

  const moveSlideUp = (index: number) => {
    if (index === 0) return;
    const newSlides = [...slides];
    [newSlides[index - 1], newSlides[index]] = [newSlides[index], newSlides[index - 1]];
    newSlides.forEach((slide, idx) => {
      slide.sortOrder = (idx + 1) * 10;
    });
    setSlides(newSlides);
  };

  const moveSlideDown = (index: number) => {
    if (index === slides.length - 1) return;
    const newSlides = [...slides];
    [newSlides[index], newSlides[index + 1]] = [newSlides[index + 1], newSlides[index]];
    newSlides.forEach((slide, idx) => {
      slide.sortOrder = (idx + 1) * 10;
    });
    setSlides(newSlides);
  };

  const saveSlides = async () => {
    setSaving(true);
    try {
      for (const slide of slides) {
        const response = await authFetch(
          `${API_BASE_URL}/admin/hero-slides/${slide.id}`,
          {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              imageUrl: slide.imageUrl,
              altText: slide.altText,
              focus: slide.focus,
              enabled: slide.enabled,
              sortOrder: slide.sortOrder
            })
          }
        );
        if (!response.ok) throw new Error('Failed to update slide');
      }

      showToast('Hero slides updated successfully', 'success');
      await loadSlides();
    } catch (error) {
      console.error('Error saving slides:', error);
      showToast('Failed to save changes', 'error');
    } finally {
      setSaving(false);
    }
  };

  const addNewSlide = async () => {
    if (!newSlide.imageUrl.trim()) {
      showToast('Please upload an image or enter an image URL', 'error');
      return;
    }
    
    if (newSlide.imageUrl.length > 500) {
      showToast('Image URL is too long (max 500 characters)', 'error');
      return;
    }
    
    if (!newSlide.altText.trim()) {
      showToast('Please enter alt text for the image', 'error');
      return;
    }

    try {
      const nextSortOrder = slides.length > 0 ? Math.max(...slides.map(s => s.sortOrder)) + 10 : 10;
      
      const response = await authFetch(`${API_BASE_URL}/admin/hero-slides`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageUrl: newSlide.imageUrl,
          altText: newSlide.altText,
          focus: newSlide.focus,
          enabled: true,
          sortOrder: nextSortOrder
        })
      });

      if (!response.ok) throw new Error('Failed to create slide');

      showToast('Slide added successfully', 'success');
      setNewSlide({ imageUrl: '', altText: '', focus: 'CENTER', filename: '' });
      setShowAddForm(false);
      await loadSlides();
    } catch (error) {
      console.error('Error adding slide:', error);
      showToast('Failed to add slide', 'error');
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    setUploading(true);
    try {
      const res = await authFetch(`${API_BASE_URL}/admin/upload/image`, {
        method: 'POST',
        body: formData
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        const errorMessage = errorData.error || 'Upload failed. Please use manual URL input instead.';
        throw new Error(errorMessage);
      }

      const data = await res.json();
      
      if (!data.url) {
        throw new Error('No URL returned from upload. Please use manual URL input instead.');
      }
      
      setNewSlide(prev => ({ ...prev, imageUrl: data.url, filename: data.filename || '' }));
      showToast('Image uploaded successfully', 'success');
    } catch (error) {
      console.error('Error uploading image:', error);
      const message = error instanceof Error ? error.message : 'Failed to upload image';
      showToast(message, 'error');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const handleRemoveUploadedImage = async () => {
    if (!newSlide.filename) {
      setNewSlide(prev => ({ ...prev, imageUrl: '', filename: '' }));
      return;
    }

    const confirmed = window.confirm('Remove this image from storage?');
    if (!confirmed) return;

    try {
      const res = await authFetch(`${API_BASE_URL}/admin/upload/image/${encodeURIComponent(newSlide.filename)}`, {
        method: 'DELETE'
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        const msg = data.error || 'Failed to delete image';
        showToast(msg, 'error');
        return;
      }

      setNewSlide(prev => ({ ...prev, imageUrl: '', filename: '' }));
      showToast('Image deleted successfully', 'success');
    } catch (error) {
      console.error('Error deleting image:', error);
      showToast('Failed to delete image', 'error');
    }
  };

  const deleteSlide = async (id: string) => {
    if (!confirm('Are you sure you want to delete this slide?')) return;

    try {
      const response = await authFetch(`${API_BASE_URL}/admin/hero-slides/${id}`, {
        method: 'DELETE'
      });

      if (!response.ok) throw new Error('Failed to delete slide');

      showToast('Slide deleted successfully', 'success');
      await loadSlides();
    } catch (error) {
      console.error('Error deleting slide:', error);
      showToast('Failed to delete slide', 'error');
    }
  };

  // ========== HOME SECTIONS FUNCTIONS ==========
  const loadSections = async () => {
    try {
      const response = await authFetch(`${API_BASE_URL}/admin/home/sections`);
      if (!response.ok) throw new Error('Failed to load sections');
      const data = await response.json();
      setSections(data);
      
      const configState: { [key: string]: string } = {};
      data.forEach((section: HomeSection) => {
        configState[section.id] = section.configJson || '{}';
      });
      setEditingConfig(configState);
    } catch (error) {
      console.error('Error loading sections:', error);
      showToast('Failed to load home sections', 'error');
    }
  };

  const toggleSectionEnabled = (id: string) => {
    setSections(sections.map(section =>
      section.id === id ? { ...section, enabled: !section.enabled } : section
    ));
  };

  const updateConfigJson = (id: string, json: string) => {
    setEditingConfig({ ...editingConfig, [id]: json });
  };

  const moveSectionUp = (index: number) => {
    if (index === 0) return;
    const newSections = [...sections];
    [newSections[index - 1], newSections[index]] = [newSections[index], newSections[index - 1]];
    newSections.forEach((section, idx) => {
      section.sortOrder = (idx + 1) * 10;
    });
    setSections(newSections);
  };

  const moveSectionDown = (index: number) => {
    if (index === sections.length - 1) return;
    const newSections = [...sections];
    [newSections[index], newSections[index + 1]] = [newSections[index + 1], newSections[index]];
    newSections.forEach((section, idx) => {
      section.sortOrder = (idx + 1) * 10;
    });
    setSections(newSections);
  };

  const saveSections = async () => {
    setSaving(true);
    try {
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
      await loadSections();
    } catch (error) {
      console.error('Error saving sections:', error);
      showToast(error instanceof Error ? error.message : 'Failed to save changes', 'error');
    } finally {
      setSaving(false);
    }
  };

  // ========== RENDER ==========
  if (loading) {
    return (
      <div className="admin-homepage">
        <div className="loading-state">Loading homepage settings...</div>
      </div>
    );
  }

  return (
    <div className="admin-homepage">
      <div className="homepage-header">
        <h1>Homepage Management</h1>
        <p>Manage your homepage hero carousel and content sections</p>
      </div>

      {/* Tab Navigation */}
      <div className="homepage-tabs">
        <button
          className={`tab-button ${activeTab === 'hero' ? 'active' : ''}`}
          onClick={() => setActiveTab('hero')}
        >
          <RiImageLine className="tab-icon" />
          <span>Hero Carousel</span>
          <span className="tab-count">{slides.length}</span>
        </button>
        <button
          className={`tab-button ${activeTab === 'sections' ? 'active' : ''}`}
          onClick={() => setActiveTab('sections')}
        >
          <RiLayoutLine className="tab-icon" />
          <span>Content Sections</span>
          <span className="tab-count">{sections.length}</span>
        </button>
      </div>

      {/* Tab Content */}
      <div className="homepage-content">
        {/* HERO CAROUSEL TAB */}
        {activeTab === 'hero' && (
          <div className="tab-panel">
            <div className="panel-header">
              <div>
                <h2>Hero Carousel Slides</h2>
                <p className="panel-description">
                  Manage the large hero images displayed at the top of the homepage
                </p>
              </div>
              <button
                className="btn-primary"
                onClick={() => setShowAddForm(!showAddForm)}
              >
                {showAddForm ? 'Cancel' : 'Add New Slide'}
              </button>
            </div>

            {/* Add New Slide Form */}
            {showAddForm && (
              <div className="add-form-card">
                <h3>Add New Hero Slide</h3>
                
                <div className="form-group">
                  <label>Upload Image</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    disabled={uploading}
                  />
                  {uploading && <span className="upload-status">Uploading...</span>}
                </div>

                {newSlide.imageUrl && (
                  <div className="uploaded-preview">
                    <img src={newSlide.imageUrl} alt="Preview" />
                    <button
                      type="button"
                      onClick={handleRemoveUploadedImage}
                      className="btn-remove-image"
                    >
                      Remove Image
                    </button>
                  </div>
                )}

                <div className="form-group">
                  <label htmlFor="image-url">Or Enter Image URL</label>
                  <input
                    id="image-url"
                    type="text"
                    value={newSlide.imageUrl}
                    onChange={(e) => setNewSlide(prev => ({ ...prev, imageUrl: e.target.value }))}
                    placeholder="https://example.com/image.jpg"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="alt-text">Alt Text *</label>
                  <input
                    id="alt-text"
                    type="text"
                    value={newSlide.altText}
                    onChange={(e) => setNewSlide(prev => ({ ...prev, altText: e.target.value }))}
                    placeholder="Describe the image for accessibility"
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="focus">Image Focus</label>
                  <select
                    id="focus"
                    value={newSlide.focus}
                    onChange={(e) => setNewSlide(prev => ({ ...prev, focus: e.target.value as HeroSlide['focus'] }))}
                  >
                    {FOCUS_OPTIONS.map(option => (
                      <option key={option} value={option}>{option}</option>
                    ))}
                  </select>
                </div>

                <button
                  className="btn-primary"
                  onClick={addNewSlide}
                  disabled={!newSlide.imageUrl || !newSlide.altText}
                >
                  Add Slide
                </button>
              </div>
            )}

            {/* Slides List */}
            <div className="slides-list">
              {slides.length === 0 ? (
                <div className="empty-state">
                  No hero slides yet. Click "Add New Slide" to create one.
                </div>
              ) : (
                slides.map((slide, index) => (
                  <div key={slide.id} className={`slide-card ${!slide.enabled ? 'disabled' : ''}`}>
                    <div className="slide-preview">
                      <img src={slide.imageUrl} alt={slide.altText} />
                      <div className="slide-overlay">
                        <span className="sort-badge">Order: {slide.sortOrder}</span>
                      </div>
                    </div>

                    <div className="slide-details">
                      <div className="slide-info">
                        <strong>Alt Text:</strong> {slide.altText}
                        <br />
                        <strong>Focus:</strong> {slide.focus}
                      </div>

                      <div className="slide-controls">
                        <label className="toggle-label">
                          <input
                            type="checkbox"
                            checked={slide.enabled}
                            onChange={() => toggleSlideEnabled(slide.id)}
                          />
                          <span>{slide.enabled ? 'Enabled' : 'Disabled'}</span>
                        </label>

                        <select
                          value={slide.focus}
                          onChange={(e) => updateSlideFocus(slide.id, e.target.value as HeroSlide['focus'])}
                        >
                          {FOCUS_OPTIONS.map(option => (
                            <option key={option} value={option}>{option}</option>
                          ))}
                        </select>
                      </div>

                      <div className="slide-actions">
                        <button
                          onClick={() => moveSlideUp(index)}
                          disabled={index === 0}
                          className="btn-order"
                        >
                          ↑
                        </button>
                        <button
                          onClick={() => moveSlideDown(index)}
                          disabled={index === slides.length - 1}
                          className="btn-order"
                        >
                          ↓
                        </button>
                        <button
                          onClick={() => deleteSlide(slide.id)}
                          className="btn-delete"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {slides.length > 0 && (
              <div className="panel-actions">
                <button
                  className="btn-primary btn-large"
                  onClick={saveSlides}
                  disabled={saving}
                >
                  {saving ? 'Saving...' : 'Save All Changes'}
                </button>
              </div>
            )}
          </div>
        )}

        {/* CONTENT SECTIONS TAB */}
        {activeTab === 'sections' && (
          <div className="tab-panel">
            <div className="panel-header">
              <div>
                <h2>Homepage Content Sections</h2>
                <p className="panel-description">
                  Reorder, enable/disable, and configure sections that appear on the homepage
                </p>
              </div>
            </div>

            <div className="sections-list">
              {sections.length === 0 ? (
                <div className="empty-state">
                  No content sections configured.
                </div>
              ) : (
                sections.map((section, index) => (
                  <div key={section.id} className={`section-card ${!section.enabled ? 'disabled' : ''}`}>
                    <div className="section-header-row">
                      <div className="section-title">
                        <h3>{section.type}</h3>
                        <span className="sort-badge">Order: {section.sortOrder}</span>
                      </div>

                      <div className="section-controls">
                        <label className="toggle-label">
                          <input
                            type="checkbox"
                            checked={section.enabled}
                            onChange={() => toggleSectionEnabled(section.id)}
                          />
                          <span>{section.enabled ? 'Enabled' : 'Disabled'}</span>
                        </label>

                        <div className="order-buttons">
                          <button
                            onClick={() => moveSectionUp(index)}
                            disabled={index === 0}
                            className="btn-order"
                          >
                            ↑
                          </button>
                          <button
                            onClick={() => moveSectionDown(index)}
                            disabled={index === sections.length - 1}
                            className="btn-order"
                          >
                            ↓
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="section-config">
                      <label>Configuration (JSON)</label>
                      <textarea
                        value={editingConfig[section.id] || '{}'}
                        onChange={(e) => updateConfigJson(section.id, e.target.value)}
                        rows={6}
                        spellCheck={false}
                      />
                    </div>
                  </div>
                ))
              )}
            </div>

            {sections.length > 0 && (
              <div className="panel-actions">
                <button
                  className="btn-primary btn-large"
                  onClick={saveSections}
                  disabled={saving}
                >
                  {saving ? 'Saving...' : 'Save All Changes'}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
