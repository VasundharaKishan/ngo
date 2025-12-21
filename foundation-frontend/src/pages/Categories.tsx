import { useState, useEffect } from 'react';
import { API_BASE_URL } from '../api';

interface Category {
  id: string;
  name: string;
  slug: string;
  icon: string;
  displayOrder: number;
  active: boolean;
}

export default function Categories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/admin/categories`);
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
      await fetch(`${API_BASE_URL}/admin/categories/${id}`, {
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
        <h2>📂 Categories</h2>
        <p>Manage campaign categories</p>
      </div>

      <div className="content-body">
        <button onClick={() => alert('Category creation coming soon')} className="btn-add-new">
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
                      <button onClick={() => alert('Edit coming soon')} className="btn-edit">Edit</button>
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
