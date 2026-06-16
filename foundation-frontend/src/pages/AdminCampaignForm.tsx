import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { amountToCents, formatAmountForInput } from '../utils/currency';
import { getThumbnailUrl } from '../utils/imageUtils';
import { API_BASE_URL } from '../api';
import { authFetch } from '../utils/auth';
import { useToast } from '../components/ToastProvider';
import ConfirmDialog from '../components/ConfirmDialog';
import Spinner from '../components/Spinner';
import logger from '../utils/logger';
import './AdminCampaignForm.css';

interface Category {
  id: string;
  name: string;
  icon: string;
}

const CURRENCY_OPTIONS = [
  { code: 'INR', symbol: '₹', label: 'INR (₹)' },
  { code: 'USD', symbol: '$', label: 'USD ($)' },
  { code: 'EUR', symbol: '€', label: 'EUR (€)' },
  { code: 'GBP', symbol: '£', label: 'GBP (£)' },
];

function getCurrencySymbol(code: string): string {
  return CURRENCY_OPTIONS.find(c => c.code === code)?.symbol || '$';
}

export default function AdminCampaignForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = !!id;
  const showToast = useToast();

  const [categories, setCategories] = useState<Category[]>([]);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [confirmAction, setConfirmAction] = useState<{
    title: string; message: string; onConfirm: () => void;
  } | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    shortDescription: '',
    fullDescription: '',
    categoryId: '',
    targetAmount: '',
    currency: 'INR',
    imageUrl: '',
    imageFilename: '',
    location: '',
    beneficiariesCount: '',
    featured: false,
    urgent: false,
    active: true
  });

  useEffect(() => {
    // Auth is enforced server-side via JWT httpOnly cookie.
    // The adminUser localStorage key is not a reliable auth indicator —
    // it may be stale. We rely on authFetch returning 401 and the
    // admin layout's session guard to redirect unauthenticated users.
    loadCategories();
    if (isEdit) {
      loadCampaign();
    }
  }, [id, navigate]);

  const loadCategories = async () => {
    try {
      const res = await authFetch(`${API_BASE_URL}/admin/categories`);
      const data = await res.json();
      setCategories(data);
    } catch (error) {
      logger.error('AdminCampaignForm', 'Error loading categories:', error);
    }
  };

  const extractFilename = (url: string): string => {
    if (!url) return '';
    const parts = url.split('/');
    const name = parts[parts.length - 1];
    return name?.includes('.') ? name : '';
  };

  const loadCampaign = async () => {
    try {
      const res = await authFetch(`${API_BASE_URL}/admin/campaigns/${id}`);
      if (!res.ok) {
        showToast('Failed to load campaign', 'error');
        navigate('/admin/campaigns');
        return;
      }
      const data = await res.json();
      
      // Validate required fields
      if (!data || !data.title) {
        showToast('Invalid campaign data received', 'error');
        navigate('/admin/campaigns');
        return;
      }
      
      setFormData({
        title: data.title || '',
        shortDescription: data.shortDescription || '',
        fullDescription: data.fullDescription || '',
        categoryId: data.categoryId || '',
        targetAmount: formatAmountForInput(data.targetAmount || 0),
        currency: data.currency || 'INR',
        imageUrl: data.imageUrl || '',
        imageFilename: extractFilename(data.imageUrl || ''),
        location: data.location || '',
        beneficiariesCount: data.beneficiariesCount ? String(data.beneficiariesCount) : '',
        featured: data.featured ?? false,
        urgent: data.urgent ?? false,
        active: data.active ?? true
      });
    } catch (error) {
      logger.error('AdminCampaignForm', 'Error loading campaign:', error);
      showToast('Failed to load campaign. Please try again.', 'error');
      navigate('/admin/campaigns');
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Client-side size guard — matches backend MAX_FILE_BYTES (5 MB)
    if (file.size > 5 * 1024 * 1024) {
      showToast('Image must be under 5 MB', 'error');
      return;
    }

    const formData = new FormData();
    formData.append('file', file);

    setUploading(true);
    try {
      const res = await authFetch(`${API_BASE_URL}/admin/upload/image`, {
        method: 'POST',
        body: formData
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        showToast((data as { error?: string }).error || 'Failed to upload image', 'error');
        return;
      }
      setFormData(prev => ({ ...prev, imageUrl: (data as { url?: string }).url ?? '', imageFilename: (data as { filename?: string }).filename || '' }));
    } catch (error) {
      logger.error('AdminCampaignForm', 'Error uploading image:', error);
      showToast('Failed to upload image', 'error');
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveImage = () => {
    if (!formData.imageFilename) {
      setFormData(prev => ({ ...prev, imageUrl: '', imageFilename: '' }));
      return;
    }

    setConfirmAction({
      title: 'Remove image',
      message: 'Remove this image from storage?',
      onConfirm: async () => {
        setConfirmAction(null);
        try {
          const res = await authFetch(`${API_BASE_URL}/admin/upload/image/${encodeURIComponent(formData.imageFilename)}`, {
            method: 'DELETE'
          });
          if (!res.ok) {
            const data = await res.json().catch(() => ({}));
            const msg = data.error || 'Failed to delete image';
            showToast(msg, 'error');
            return;
          }
          setFormData(prev => ({ ...prev, imageUrl: '', imageFilename: '' }));
        } catch (error) {
          logger.error('AdminCampaignForm', 'Error deleting image:', error);
          showToast('Failed to delete image', 'error');
        }
      },
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const { imageFilename, ...cleanForm } = formData;

    // Validate required fields
    if (!cleanForm.title?.trim()) {
      showToast('Title is required', 'error');
      return;
    }
    if (!cleanForm.categoryId) {
      showToast('Please select a category', 'error');
      return;
    }
    if (!cleanForm.targetAmount || parseFloat(cleanForm.targetAmount) <= 0) {
      showToast('Please enter a valid target amount', 'error');
      return;
    }

    const payload = {
      ...cleanForm,
      targetAmount: amountToCents(cleanForm.targetAmount),
      // currentAmount is intentionally omitted — it is calculated from donations server-side
      beneficiariesCount: cleanForm.beneficiariesCount ? parseInt(cleanForm.beneficiariesCount) : null
    };

    setSaving(true);
    try {
      const url = isEdit 
        ? `${API_BASE_URL}/admin/campaigns/${id}`
        : `${API_BASE_URL}/admin/campaigns`;
      
      const method = isEdit ? 'PUT' : 'POST';

      const res = await authFetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        showToast(isEdit ? 'Campaign updated' : 'Campaign created', 'success');
        navigate('/admin/campaigns');
      } else {
        const data = await res.json().catch(() => ({}));
        const fieldErrors = (data as { errors?: Record<string, string> }).errors;
        if (fieldErrors) {
          const first = Object.entries(fieldErrors)[0];
          showToast(first ? `${first[0]}: ${first[1]}` : 'Validation failed', 'error');
        } else {
          const msg = (data as { message?: string }).message || 'Failed to save campaign';
          showToast(msg, 'error');
        }
      }
    } catch (error) {
      logger.error('AdminCampaignForm', 'Error saving campaign:', error);
      showToast('Failed to save campaign', 'error');
    } finally {
      setSaving(false);
    }
  };

  const charCounterClass = (current: number, max: number) => {
    const ratio = current / max;
    if (ratio >= 1) return 'char-counter char-counter--limit';
    if (ratio > 0.9) return 'char-counter char-counter--warn';
    return 'char-counter';
  };

  return (
    <div className="admin-form-container" data-testid="campaign-form-page">
      <div className="form-header">
        <h1>{isEdit ? 'Edit Campaign' : 'Create New Campaign'}</h1>
        <button onClick={() => navigate('/admin/campaigns')} className="btn-back">← Back</button>
      </div>

      <form onSubmit={handleSubmit} className="admin-form" data-testid="campaign-form">
        <div className="form-grid">
          <div className="form-group full-width">
            <label>Title *</label>
            <input
              type="text"
              value={formData.title}
              data-testid="campaign-title"
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              maxLength={200}
              required
            />
            <span className={charCounterClass(formData.title.length, 200)}>
              {formData.title.length} / 200
            </span>
          </div>

          <div className="form-group full-width">
            <label>Short Description *</label>
              <textarea
                value={formData.shortDescription}
                data-testid="campaign-short-description"
                onChange={(e) => setFormData({ ...formData, shortDescription: e.target.value })}
                rows={2}
                maxLength={200}
                required
              />
            <span className={charCounterClass(formData.shortDescription.length, 200)}>
              {formData.shortDescription.length} / 200
            </span>
          </div>

          <div className="form-group full-width">
            <label>Full Description *</label>
              <textarea
                value={formData.fullDescription}
                data-testid="campaign-full-description"
                onChange={(e) => setFormData({ ...formData, fullDescription: e.target.value })}
                rows={5}
                maxLength={8000}
                required
              />
            <span className={charCounterClass(formData.fullDescription.length, 8000)}>
              {formData.fullDescription.length} / 8000
            </span>
          </div>

          <div className="form-group">
            <label>Category *</label>
            <select
              value={formData.categoryId}
              data-testid="campaign-category"
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
              data-testid="campaign-location"
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              placeholder="City, Country"
            />
          </div>

          <div className="form-group">
            <label>Currency *</label>
            <select
              value={formData.currency}
              data-testid="campaign-currency"
              onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
            >
              {CURRENCY_OPTIONS.map(opt => (
                <option key={opt.code} value={opt.code}>{opt.label}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Target Amount ({getCurrencySymbol(formData.currency)}) *</label>
            <input
              type="number"
              value={formData.targetAmount}
              data-testid="campaign-target-amount"
              onChange={(e) => setFormData({ ...formData, targetAmount: e.target.value })}
              required
              min="0"
              step="0.01"
            />
          </div>

          <div className="form-group">
            <label>Beneficiaries Count</label>
            <input
              type="number"
              value={formData.beneficiariesCount}
              data-testid="campaign-beneficiaries-count"
              onChange={(e) => setFormData({ ...formData, beneficiariesCount: e.target.value })}
              min="0"
            />
          </div>

          <div className="form-group full-width">
              <label>Campaign Image</label>
              <div className="image-upload-area">
                {formData.imageUrl && (
                  <div className="image-preview">
                    <img
                      src={getThumbnailUrl(formData.imageUrl)}
                      alt="Campaign"
                      onError={(e) => { e.currentTarget.style.display = 'none'; }}
                    />
                    <button type="button" className="btn-cancel small" onClick={handleRemoveImage} disabled={uploading}>
                      Remove image
                    </button>
                  </div>
                )}
            <input
              type="file"
              accept=".jpg,.jpeg,.png,.gif,.webp,image/jpeg,image/png,image/gif,image/webp"
              data-testid="campaign-image-upload"
              onChange={handleImageUpload}
              disabled={uploading}
            />
              {uploading && (
                <div className="upload-status">
                  <Spinner size="sm" color="primary" className="spinner-inline" />
                  Uploading...
                </div>
              )}
              <p className="help-text">Or enter image URL directly:</p>
              <input
                type="text"
                value={formData.imageUrl}
                data-testid="campaign-image-url"
                onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                placeholder="https://example.com/image.jpg or /local-image.png"
              />
            </div>
          </div>

          <div className="form-group full-width">
            <div className="checkbox-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={formData.featured}
                  data-testid="campaign-featured-toggle"
                  onChange={(e) => setFormData({ ...formData, featured: e.target.checked })}
                />
                ⭐ Featured Campaign
              </label>

              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={formData.urgent}
                  data-testid="campaign-urgent-toggle"
                  onChange={(e) => setFormData({ ...formData, urgent: e.target.checked })}
                />
                🚨 Urgent Campaign
              </label>

              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={formData.active}
                  data-testid="campaign-active-toggle"
                  onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                />
                ✓ Active
              </label>
            </div>
          </div>
        </div>

        <div className="form-actions">
          <button type="button" onClick={() => navigate('/admin/campaigns')} className="btn-cancel" disabled={saving}>
            <span data-testid="campaign-cancel">Cancel</span>
          </button>
          <button type="submit" className="btn-submit" disabled={saving || uploading}>
            <span data-testid="campaign-submit">
            {saving ? (
              <><Spinner size="sm" color="white" className="spinner-inline" /> Saving...</>
            ) : (
              isEdit ? 'Update Campaign' : 'Create Campaign'
            )}
            </span>
          </button>
        </div>
      </form>
      <ConfirmDialog
        isOpen={!!confirmAction}
        title={confirmAction?.title ?? ''}
        message={confirmAction?.message ?? ''}
        confirmLabel="Remove"
        variant="warning"
        onConfirm={() => confirmAction?.onConfirm()}
        onCancel={() => setConfirmAction(null)}
      />
    </div>
  );
}
