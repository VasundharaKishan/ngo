import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { amountToCents, formatAmountForInput } from '../utils/currency';
import { API_BASE_URL } from '../api';
import './AdminCampaignForm.css';

interface Category {
  id: string;
  name: string;
  icon: string;
}

export default function AdminCampaignForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = !!id;

  const [categories, setCategories] = useState<Category[]>([]);
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    shortDescription: '',
    fullDescription: '',
    categoryId: '',
    targetAmount: '',
    currentAmount: '0',
    imageUrl: '',
    location: '',
    beneficiariesCount: '',
    featured: false,
    urgent: false,
    active: true
  });

  useEffect(() => {
    // Check if user is logged in
    const token = localStorage.getItem('adminToken');
    if (!token) {
      navigate('/admin/login');
      return;
    }
    loadCategories();
    if (isEdit) {
      loadCampaign();
    }
  }, [id, navigate]);

  const loadCategories = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/admin/categories`);
      const data = await res.json();
      setCategories(data);
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  };

  const loadCampaign = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/admin/campaigns/${id}`);
      if (!res.ok) {
        alert('Failed to load campaign');
        navigate('/admin');
        return;
      }
      const data = await res.json();
      
      // Validate required fields
      if (!data || !data.title) {
        alert('Invalid campaign data received');
        navigate('/admin');
        return;
      }
      
      setFormData({
        title: data.title || '',
        shortDescription: data.shortDescription || '',
        fullDescription: data.fullDescription || '',
        categoryId: data.category?.id || '',
        targetAmount: formatAmountForInput(data.targetAmount || 0),
        currentAmount: formatAmountForInput(data.currentAmount || 0),
        imageUrl: data.imageUrl || '',
        location: data.location || '',
        beneficiariesCount: data.beneficiariesCount ? String(data.beneficiariesCount) : '',
        featured: data.featured ?? false,
        urgent: data.urgent ?? false,
        active: data.active ?? true
      });
    } catch (error) {
      console.error('Error loading campaign:', error);
      alert('Failed to load campaign. Please try again.');
      navigate('/admin');
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    setUploading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/admin/upload/image`, {
        method: 'POST',
        body: formData
      });
      const data = await res.json();
      setFormData(prev => ({ ...prev, imageUrl: data.url }));
    } catch (error) {
      console.error('Error uploading image:', error);
      alert('Failed to upload image');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate required fields
    if (!formData.title?.trim()) {
      alert('Title is required');
      return;
    }
    if (!formData.categoryId) {
      alert('Please select a category');
      return;
    }
    if (!formData.targetAmount || parseFloat(formData.targetAmount) <= 0) {
      alert('Please enter a valid target amount');
      return;
    }

    const payload = {
      ...formData,
      targetAmount: amountToCents(formData.targetAmount),
      currentAmount: amountToCents(formData.currentAmount || '0'),
      beneficiariesCount: formData.beneficiariesCount ? parseInt(formData.beneficiariesCount) : null
    };

    try {
      const url = isEdit 
        ? `${API_BASE_URL}/admin/campaigns/${id}`
        : `${API_BASE_URL}/admin/campaigns`;
      
      const method = isEdit ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        navigate('/admin');
      } else {
        alert('Failed to save campaign');
      }
    } catch (error) {
      console.error('Error saving campaign:', error);
      alert('Failed to save campaign');
    }
  };

  return (
    <div className="admin-form-container">
      <div className="form-header">
        <h1>{isEdit ? 'Edit Campaign' : 'Create New Campaign'}</h1>
        <button onClick={() => navigate('/admin')} className="btn-back">← Back</button>
      </div>

      <form onSubmit={handleSubmit} className="admin-form">
        <div className="form-grid">
          <div className="form-group full-width">
            <label>Title *</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
            />
          </div>

          <div className="form-group full-width">
            <label>Short Description *</label>
            <textarea
              value={formData.shortDescription}
              onChange={(e) => setFormData({ ...formData, shortDescription: e.target.value })}
              rows={2}
              required
            />
          </div>

          <div className="form-group full-width">
            <label>Full Description *</label>
            <textarea
              value={formData.fullDescription}
              onChange={(e) => setFormData({ ...formData, fullDescription: e.target.value })}
              rows={5}
              required
            />
          </div>

          <div className="form-group">
            <label>Category *</label>
            <select
              value={formData.categoryId}
              onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
              required
            >
              <option value="">Select a category</option>
              {categories.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.icon} {cat.name}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Location</label>
            <input
              type="text"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              placeholder="City, Country"
            />
          </div>

          <div className="form-group">
            <label>Target Amount ($) *</label>
            <input
              type="number"
              value={formData.targetAmount}
              onChange={(e) => setFormData({ ...formData, targetAmount: e.target.value })}
              required
              min="0"
              step="0.01"
            />
          </div>

          <div className="form-group">
            <label>Current Amount ($)</label>
            <input
              type="number"
              value={formData.currentAmount}
              onChange={(e) => setFormData({ ...formData, currentAmount: e.target.value })}
              min="0"
              step="0.01"
            />
          </div>

          <div className="form-group">
            <label>Beneficiaries Count</label>
            <input
              type="number"
              value={formData.beneficiariesCount}
              onChange={(e) => setFormData({ ...formData, beneficiariesCount: e.target.value })}
              min="0"
            />
          </div>

          <div className="form-group full-width">
            <label>Campaign Image</label>
            <div className="image-upload-area">
              {formData.imageUrl && (
                <div className="image-preview">
                  <img src={formData.imageUrl} alt="Campaign" />
                </div>
              )}
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                disabled={uploading}
              />
              {uploading && <p className="upload-status">Uploading...</p>}
              <p className="help-text">Or enter image URL directly:</p>
              <input
                type="url"
                value={formData.imageUrl}
                onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                placeholder="https://example.com/image.jpg"
              />
            </div>
          </div>

          <div className="form-group full-width">
            <div className="checkbox-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={formData.featured}
                  onChange={(e) => setFormData({ ...formData, featured: e.target.checked })}
                />
                ⭐ Featured Campaign
              </label>

              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={formData.urgent}
                  onChange={(e) => setFormData({ ...formData, urgent: e.target.checked })}
                />
                🚨 Urgent Campaign
              </label>

              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={formData.active}
                  onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                />
                ✓ Active
              </label>
            </div>
          </div>
        </div>

        <div className="form-actions">
          <button type="button" onClick={() => navigate('/admin')} className="btn-cancel">
            Cancel
          </button>
          <button type="submit" className="btn-submit">
            {isEdit ? 'Update Campaign' : 'Create Campaign'}
          </button>
        </div>
      </form>
    </div>
  );
}
