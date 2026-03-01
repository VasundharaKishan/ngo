import { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { RiFolderLine } from 'react-icons/ri';
import { API_BASE_URL } from '../api';
import { authFetch } from '../utils/auth';
import { useToast } from '../components/ToastProvider';
import { useSiteName } from '../contexts/ConfigContext';

interface Category {
  id: string;
  name: string;
  slug: string;
  icon: string;
  imageUrl?: string;
  displayOrder: number;
  active: boolean;
}

export default function Categories() {
  const showToast = useToast();
  const siteName = useSiteName();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [imageUploading, setImageUploading] = useState(false);

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    setLoading(true);
    try {
      const res = await authFetch(`${API_BASE_URL}/admin/categories`);
      const data = await res.json();
      setCategories(data);
    } catch (error) {
      console.error('Error loading categories:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCategoryImageUpload = async (file: File) => {
    if (!editingCategory) return;
    if (file.size > 5 * 1024 * 1024) {
      showToast('Image must be under 5 MB', 'error');
      return;
    }
    setImageUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await authFetch(`${API_BASE_URL}/admin/upload/image`, {
        method: 'POST',
        body: formData,
      });
      if (!res.ok) throw new Error('Upload failed');
      const data = await res.json();
      setEditingCategory(prev => prev ? { ...prev, imageUrl: data.url } : prev);
      showToast('Image uploaded', 'success');
    } catch {
      showToast('Failed to upload image', 'error');
    } finally {
      setImageUploading(false);
    }
  };

  const saveCategory = async () => {
    if (!editingCategory) return;
    try {
      await authFetch(`${API_BASE_URL}/admin/categories/${editingCategory.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editingCategory.name,
          icon: editingCategory.icon,
          imageUrl: editingCategory.imageUrl,
          displayOrder: editingCategory.displayOrder,
          active: editingCategory.active,
        }),
      });
      showToast('Category updated', 'success');
      setEditingCategory(null);
      loadCategories();
    } catch {
      showToast('Failed to save category', 'error');
    }
  };

  const deleteCategory = async (id: string) => {
    if (!confirm('Are you sure you want to delete this category?')) return;
    
    try {
      await authFetch(`${API_BASE_URL}/admin/categories/${id}`, {
        method: 'DELETE'
      });
      showToast('Category deleted', 'success');
      loadCategories();
    } catch (error) {
      console.error('Error deleting category:', error);
      showToast('Failed to delete category', 'error');
    }
  };

  return (
    <>
      <Helmet>
        <title>Categories | Admin | {siteName}</title>
        <meta name="robots" content="noindex" />
      </Helmet>
      <div className="content-header" data-testid="categories-header">
        <h2><RiFolderLine style={{verticalAlign: 'middle', marginRight: '0.5rem'}} /> Categories</h2>
        <p>Manage campaign categories</p>
      </div>

      <div className="content-body">
        <button
          onClick={() => showToast('Category creation coming soon', 'info')}
          className="btn-add-new"
          data-testid="categories-add-new"
        >
          + Add New Category
        </button>
        
        {loading ? (
          <p>Loading categories...</p>
        ) : (
          <table className="data-table" data-testid="categories-table">
            <thead>
              <tr>
                <th>Icon</th>
                <th>Name</th>
                <th>Slug</th>
                <th>Order</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {categories.map(category => (
                <tr key={category.id} data-testid={`category-row-${category.id}`}>
                  <td><span style={{fontSize: '1.5rem'}}>{category.icon}</span></td>
                  <td><strong>{category.name}</strong></td>
                  <td>{category.slug}</td>
                  <td>{category.displayOrder}</td>
                  <td>{category.active ? '✓ Active' : '✗ Inactive'}</td>
                  <td>
                    <div className="table-actions">
                      <button
                        onClick={() => setEditingCategory({ ...category })}
                        className="btn-edit"
                        data-testid={`category-edit-${category.id}`}
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => deleteCategory(category.id)}
                        className="btn-delete"
                        data-testid={`category-delete-${category.id}`}
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Edit Category Modal */}
      {editingCategory && (
        <div
          className="modal-overlay"
          role="dialog"
          aria-modal="true"
          aria-label="Edit Category"
          data-testid="edit-category-modal"
          onClick={(e) => { if (e.target === e.currentTarget) setEditingCategory(null); }}
        >
          <div className="modal-content" style={{ maxWidth: '480px' }}>
            <h3 style={{ marginTop: 0 }}>Edit Category: {editingCategory.name}</h3>

            <div className="form-group">
              <label htmlFor="cat-name">Name</label>
              <input
                id="cat-name"
                type="text"
                value={editingCategory.name}
                onChange={(e) => setEditingCategory(prev => prev ? { ...prev, name: e.target.value } : prev)}
                data-testid="cat-edit-name"
              />
            </div>

            <div className="form-group">
              <label htmlFor="cat-icon">Icon (emoji)</label>
              <input
                id="cat-icon"
                type="text"
                value={editingCategory.icon}
                onChange={(e) => setEditingCategory(prev => prev ? { ...prev, icon: e.target.value } : prev)}
                data-testid="cat-edit-icon"
              />
            </div>

            <div className="form-group">
              <label htmlFor="cat-order">Display Order</label>
              <input
                id="cat-order"
                type="number"
                value={editingCategory.displayOrder}
                onChange={(e) => setEditingCategory(prev => prev ? { ...prev, displayOrder: Number(e.target.value) } : prev)}
                data-testid="cat-edit-order"
              />
            </div>

            <div className="form-group">
              <label>Category Image</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                {editingCategory.imageUrl && (
                  <img
                    src={editingCategory.imageUrl}
                    alt="Category"
                    style={{ width: '64px', height: '64px', objectFit: 'cover', borderRadius: '4px', border: '1px solid #ddd' }}
                    data-testid="cat-image-preview"
                    onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                  />
                )}
                <label
                  htmlFor="cat-image-upload"
                  className="btn-upload"
                  style={{ cursor: imageUploading ? 'not-allowed' : 'pointer', opacity: imageUploading ? 0.6 : 1 }}
                >
                  {imageUploading ? 'Uploading…' : '📁 Upload Image'}
                </label>
                <input
                  id="cat-image-upload"
                  type="file"
                  accept="image/*"
                  style={{ display: 'none' }}
                  disabled={imageUploading}
                  data-testid="cat-image-input"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleCategoryImageUpload(file);
                    e.target.value = '';
                  }}
                />
              </div>
            </div>

            <div className="form-group">
              <label>
                <input
                  type="checkbox"
                  checked={editingCategory.active}
                  onChange={(e) => setEditingCategory(prev => prev ? { ...prev, active: e.target.checked } : prev)}
                  data-testid="cat-edit-active"
                />
                {' '}Active
              </label>
            </div>

            <div className="modal-actions" style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
              <button onClick={() => setEditingCategory(null)} className="btn-cancel">
                Cancel
              </button>
              <button onClick={saveCategory} className="btn-save" data-testid="cat-edit-save">
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
