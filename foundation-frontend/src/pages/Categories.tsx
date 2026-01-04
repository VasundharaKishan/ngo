import { useState, useEffect } from 'react';
import { RiFolderLine } from 'react-icons/ri';
import { API_BASE_URL } from '../api';
import { authFetch } from '../utils/auth';
import { useToast } from '../components/ToastProvider';

interface Category {
  id: string;
  name: string;
  slug: string;
  icon: string;
  displayOrder: number;
  active: boolean;
}

export default function Categories() {
  const showToast = useToast();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

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

  const deleteCategory = async (id: string) => {
    if (!confirm('Are you sure you want to delete this category?')) return;
    
    try {
      await authFetch(`${API_BASE_URL}/admin/categories/${id}`, {
        method: 'DELETE'
      });
      loadCategories();
    } catch (error) {
      console.error('Error deleting category:', error);
    }
  };

  return (
    <>
      <div className="content-header">
        <h2><RiFolderLine style={{verticalAlign: 'middle', marginRight: '0.5rem'}} /> Categories</h2>
        <p>Manage campaign categories</p>
      </div>

      <div className="content-body">
        <button onClick={() => showToast('Category creation coming soon', 'info')} className="btn-add-new">
          + Add New Category
        </button>
        
        {loading ? (
          <p>Loading categories...</p>
        ) : (
          <table className="data-table">
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
                <tr key={category.id}>
                  <td><span style={{fontSize: '1.5rem'}}>{category.icon}</span></td>
                  <td><strong>{category.name}</strong></td>
                  <td>{category.slug}</td>
                  <td>{category.displayOrder}</td>
                  <td>{category.active ? '✓ Active' : '✗ Inactive'}</td>
                  <td>
                    <div className="table-actions">
                      <button onClick={() => showToast('Edit coming soon', 'info')} className="btn-edit">Edit</button>
                      <button onClick={() => deleteCategory(category.id)} className="btn-delete">Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}
