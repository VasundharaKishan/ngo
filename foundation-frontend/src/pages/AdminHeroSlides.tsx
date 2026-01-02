import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_BASE_URL } from '../api';
import { authFetch } from '../utils/auth';
import { useToast } from '../components/ToastProvider';
import './AdminSettings.css';

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

const FOCUS_OPTIONS: Array<'CENTER' | 'LEFT' | 'RIGHT' | 'TOP' | 'BOTTOM'> = [
  'CENTER', 'LEFT', 'RIGHT', 'TOP', 'BOTTOM'
];

export default function AdminHeroSlides() {
  const [slides, setSlides] = useState<HeroSlide[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [newSlide, setNewSlide] = useState({ imageUrl: '', altText: '', focus: 'CENTER' as HeroSlide['focus'], filename: '' });
  const navigate = useNavigate();
  const showToast = useToast();

  useEffect(() => {
    loadSlides();
  }, []);

  const loadSlides = async () => {
    try {
      const response = await authFetch(`${API_BASE_URL}/admin/hero-slides`);
      if (!response.ok) throw new Error('Failed to load slides');
      const data = await response.json();
      setSlides(data);
    } catch (error) {
      console.error('Error loading slides:', error);
      showToast('Failed to load hero slides', 'error');
    } finally {
      setLoading(false);
    }
  };

  const toggleEnabled = (id: string) => {
    setSlides(slides.map(slide =>
      slide.id === id ? { ...slide, enabled: !slide.enabled } : slide
    ));
  };

  const updateFocus = (id: string, focus: HeroSlide['focus']) => {
    setSlides(slides.map(slide =>
      slide.id === id ? { ...slide, focus } : slide
    ));
  };

  const moveUp = (index: number) => {
    if (index === 0) return;
    const newSlides = [...slides];
    [newSlides[index - 1], newSlides[index]] = [newSlides[index], newSlides[index - 1]];
    // Update sortOrder
    newSlides.forEach((slide, idx) => {
      slide.sortOrder = (idx + 1) * 10;
    });
    setSlides(newSlides);
  };

  const moveDown = (index: number) => {
    if (index === slides.length - 1) return;
    const newSlides = [...slides];
    [newSlides[index], newSlides[index + 1]] = [newSlides[index + 1], newSlides[index]];
    // Update sortOrder
    newSlides.forEach((slide, idx) => {
      slide.sortOrder = (idx + 1) * 10;
    });
    setSlides(newSlides);
  };

  const saveChanges = async () => {
    setSaving(true);
    try {
      // Save each slide individually
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
      loadSlides();
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
      showToast('Image URL is too long (max 500 characters). Please use a shorter URL or upload to cloud storage.', 'error');
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
      loadSlides();
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
        const errorMessage = errorData.error || 'Upload failed. Cloud storage may not be configured. Please use manual URL input instead.';
        throw new Error(errorMessage);
      }

      const data = await res.json();
      console.log('Upload response:', data);
      
      if (!data.url) {
        throw new Error('No URL returned from upload. Please use manual URL input instead.');
      }
      
      setNewSlide(prev => ({ ...prev, imageUrl: data.url, filename: data.filename || '' }));
      showToast('Image uploaded successfully', 'success');
    } catch (error) {
      console.error('Error uploading image:', error);
      const message = error instanceof Error ? error.message : 'Failed to upload image';
      showToast(message, 'error');
      // Don't set the image URL on error
    } finally {
      setUploading(false);
      // Reset file input
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
      loadSlides();
    } catch (error) {
      console.error('Error deleting slide:', error);
      showToast('Failed to delete slide', 'error');
    }
  };

  if (loading) {
    return (
      <div className="admin-settings">
        <div className="settings-header">
          <h1>Hero Slides</h1>
        </div>
        <div className="loading-container">
          <p>Loading slides...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-settings">
      <div className="settings-header">
        <h1>Hero Slides</h1>
        <button onClick={() => navigate('/admin')} className="btn-back">
          ← Back to Dashboard
        </button>
      </div>

      <div className="settings-section">
        <div className="section-header">
          <h2>Manage Carousel Slides</h2>
          <p className="section-description">
            Reorder, enable/disable, and configure focus positioning for hero carousel slides
          </p>
        </div>

        {/* Add New Slide Button */}
        <div style={{ marginTop: '1.5rem', marginBottom: '1rem' }}>
          {!showAddForm ? (
            <button
              onClick={() => setShowAddForm(true)}
              style={{
                background: '#10b981',
                color: 'white',
                padding: '0.75rem 1.5rem',
                border: 'none',
                borderRadius: '8px',
                fontWeight: 600,
                cursor: 'pointer',
                fontSize: '0.95rem'
              }}
            >
              + Add New Slide
            </button>
          ) : (
            <div style={{
              background: '#f0fdf4',
              border: '2px solid #10b981',
              borderRadius: '8px',
              padding: '1.5rem',
              marginBottom: '1rem'
            }}>
              <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.1rem', color: '#059669' }}>Add New Slide</h3>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {/* Image Upload Section */}
                <div>
                  <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.5rem', fontSize: '0.9rem' }}>
                    Upload Image *
                  </label>
                  
                  {newSlide.imageUrl ? (
                    <div style={{
                      border: '2px solid #10b981',
                      borderRadius: '8px',
                      padding: '1rem',
                      background: 'white'
                    }}>
                      <img
                        src={newSlide.imageUrl}
                        alt="Preview"
                        style={{
                          width: '100%',
                          maxHeight: '200px',
                          objectFit: 'cover',
                          borderRadius: '4px',
                          marginBottom: '0.75rem'
                        }}
                      />
                      <button
                        type="button"
                        onClick={handleRemoveUploadedImage}
                        disabled={uploading}
                        style={{
                          background: '#ef4444',
                          color: 'white',
                          padding: '0.5rem 1rem',
                          border: 'none',
                          borderRadius: '4px',
                          fontWeight: 600,
                          cursor: uploading ? 'not-allowed' : 'pointer',
                          fontSize: '0.85rem',
                          opacity: uploading ? 0.6 : 1
                        }}
                      >
                        Remove Image
                      </button>
                    </div>
                  ) : (
                    <div>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        disabled={uploading}
                        style={{
                          width: '100%',
                          padding: '0.75rem',
                          borderRadius: '6px',
                          border: '2px dashed #cbd5e1',
                          fontSize: '0.9rem',
                          cursor: uploading ? 'not-allowed' : 'pointer'
                        }}
                      />
                      {uploading && (
                        <p style={{ marginTop: '0.5rem', color: '#059669', fontSize: '0.9rem' }}>
                          Uploading...
                        </p>
                      )}
                      <p style={{ marginTop: '0.5rem', fontSize: '0.85rem', color: '#64748b' }}>
                        Or enter image URL directly:
                      </p>
                      <input
                        type="text"
                        value={newSlide.imageUrl}
                        onChange={(e) => setNewSlide({ ...newSlide, imageUrl: e.target.value })}
                        placeholder="https://example.com/image.jpg"
                        style={{
                          width: '100%',
                          padding: '0.75rem',
                          borderRadius: '6px',
                          border: '1px solid #cbd5e1',
                          fontSize: '0.9rem',
                          marginTop: '0.5rem'
                        }}
                      />
                    </div>
                  )}
                </div>

                <div>
                  <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.5rem', fontSize: '0.9rem' }}>
                    Alt Text *
                  </label>
                  <input
                    type="text"
                    value={newSlide.altText}
                    onChange={(e) => setNewSlide({ ...newSlide, altText: e.target.value })}
                    placeholder="Description for accessibility"
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      borderRadius: '6px',
                      border: '1px solid #cbd5e1',
                      fontSize: '0.9rem'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.5rem', fontSize: '0.9rem' }}>
                    Focus Position
                  </label>
                  <select
                    value={newSlide.focus}
                    onChange={(e) => setNewSlide({ ...newSlide, focus: e.target.value as HeroSlide['focus'] })}
                    style={{
                      padding: '0.75rem',
                      borderRadius: '6px',
                      border: '1px solid #cbd5e1',
                      fontSize: '0.9rem',
                      minWidth: '150px'
                    }}
                  >
                    {FOCUS_OPTIONS.map(option => (
                      <option key={option} value={option}>{option}</option>
                    ))}
                  </select>
                </div>

                <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
                  <button
                    onClick={addNewSlide}
                    style={{
                      background: '#10b981',
                      color: 'white',
                      padding: '0.75rem 1.5rem',
                      border: 'none',
                      borderRadius: '6px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      fontSize: '0.9rem'
                    }}
                  >
                    Add Slide
                  </button>
                  <button
                    onClick={() => {
                      setShowAddForm(false);
                      setNewSlide({ imageUrl: '', altText: '', focus: 'CENTER', filename: '' });
                    }}
                    style={{
                      background: '#e2e8f0',
                      color: '#475569',
                      padding: '0.75rem 1.5rem',
                      border: 'none',
                      borderRadius: '6px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      fontSize: '0.9rem'
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="slides-list" style={{ marginTop: '1.5rem' }}>
          {slides.map((slide, index) => (
            <div key={slide.id} className="slide-item" style={{
              display: 'flex',
              alignItems: 'center',
              gap: '1rem',
              padding: '1rem',
              background: '#f8fafc',
              borderRadius: '8px',
              marginBottom: '0.75rem'
            }}>
              {/* Preview Image */}
              <img
                src={slide.imageUrl}
                alt={slide.altText}
                style={{
                  width: '120px',
                  height: '60px',
                  objectFit: 'cover',
                  borderRadius: '4px',
                  border: '1px solid #e2e8f0'
                }}
              />

              {/* Alt Text */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 600, fontSize: '0.95rem', marginBottom: '0.25rem' }}>
                  {slide.altText}
                </div>
                <div style={{ fontSize: '0.85rem', color: '#64748b' }}>
                  {slide.imageUrl}
                </div>
              </div>

              {/* Focus Dropdown */}
              <select
                value={slide.focus}
                onChange={(e) => updateFocus(slide.id, e.target.value as HeroSlide['focus'])}
                style={{
                  padding: '0.5rem',
                  borderRadius: '6px',
                  border: '1px solid #cbd5e1',
                  fontSize: '0.9rem',
                  minWidth: '100px'
                }}
              >
                {FOCUS_OPTIONS.map(option => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>

              {/* Enabled Toggle */}
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={slide.enabled}
                  onChange={() => toggleEnabled(slide.id)}
                  style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                />
                <span style={{ fontSize: '0.9rem', color: '#64748b' }}>Enabled</span>
              </label>

              {/* Reorder Buttons */}
              <div style={{ display: 'flex', gap: '0.25rem' }}>
                <button
                  onClick={() => moveUp(index)}
                  disabled={index === 0}
                  style={{
                    padding: '0.5rem 0.75rem',
                    background: index === 0 ? '#e2e8f0' : '#3b82f6',
                    color: index === 0 ? '#94a3b8' : 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: index === 0 ? 'not-allowed' : 'pointer',
                    fontSize: '0.85rem',
                    fontWeight: 600
                  }}
                >
                  ↑
                </button>
                <button
                  onClick={() => moveDown(index)}
                  disabled={index === slides.length - 1}
                  style={{
                    padding: '0.5rem 0.75rem',
                    background: index === slides.length - 1 ? '#e2e8f0' : '#3b82f6',
                    color: index === slides.length - 1 ? '#94a3b8' : 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: index === slides.length - 1 ? 'not-allowed' : 'pointer',
                    fontSize: '0.85rem',
                    fontWeight: 600
                  }}
                >
                  ↓
                </button>
              </div>

              {/* Delete Button */}
              <button
                onClick={() => deleteSlide(slide.id)}
                style={{
                  padding: '0.5rem 0.75rem',
                  background: '#ef4444',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '0.85rem',
                  fontWeight: 600
                }}
                title="Delete slide"
              >
                🗑️
              </button>
            </div>
          ))}
        </div>

        <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'flex-end' }}>
          <button
            onClick={saveChanges}
            disabled={saving}
            className="btn-save"
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
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
}
