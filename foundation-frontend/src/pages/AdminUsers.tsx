import { useState, useEffect } from 'react';
import { API_BASE_URL } from '../api';
import { authFetch } from '../utils/auth';
import { useToast } from '../components/ToastProvider';
import './AdminUsers.css';

interface AdminUser {
  id: string;
  username: string;
  email: string;
  fullName: string;
  role: 'ADMIN' | 'OPERATOR';
  active: boolean;
  lastLoginAt?: string;
  createdAt: string;
}

export default function AdminUsers() {
  const showToast = useToast();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    fullName: '',
    role: 'OPERATOR' as 'ADMIN' | 'OPERATOR',
    active: true
  });

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      const res = await authFetch(`${API_BASE_URL}/admin/users`);
      const data = await res.json();
      setUsers(data);
      setLoading(false);
    } catch (error) {
      console.error('Error loading users:', error);
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const url = editingUser 
      ? `${API_BASE_URL}/admin/users/${editingUser.id}`
      : `${API_BASE_URL}/admin/users`;
    
    const method = editingUser ? 'PUT' : 'POST';

    try {
      const res = await authFetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (res.ok) {
        loadUsers();
        resetForm();
      } else {
        const errorData = await res.json();
        showToast(errorData.error || 'Operation failed', 'error');
      }
    } catch (error) {
      console.error('Error saving user:', error);
      showToast('Failed to save user', 'error');
    }
  };

  const handleEdit = (user: AdminUser) => {
    setEditingUser(user);
    setFormData({
      username: user.username,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
      active: user.active
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string, username: string, role: 'ADMIN' | 'OPERATOR') => {
    if (username.toLowerCase() === 'admin') {
      showToast('Default admin cannot be deleted', 'error');
      return;
    }
    if (role === 'ADMIN' && !isSuperAdmin) {
      showToast('Only the default admin can delete other admins', 'error');
      return;
    }

    if (!confirm(`Are you sure you want to delete user: ${username}?`)) return;

    try {
      const res = await authFetch(`${API_BASE_URL}/admin/users/${id}`, {
        method: 'DELETE'
      });
      
      if (res.ok) {
        showToast(`User ${username} deleted successfully`, 'success');
        loadUsers();
      } else {
        const errorData = await res.json();
        showToast(errorData.error || 'Failed to delete user', 'error');
      }
    } catch (error) {
      console.error('Error deleting user:', error);
      showToast('Failed to delete user', 'error');
    }
  };

  const resetForm = () => {
    setShowForm(false);
    setEditingUser(null);
    setFormData({
      username: '',
      email: '',
      fullName: '',
      role: 'OPERATOR',
      active: true
    });
  };

  if (loading) {
    return <div className="admin-users"><p>Loading...</p></div>;
  }

  return (
    <div className="admin-users" data-testid="admin-users-page">
      <div className="users-container">
        <div className="users-actions">
          <button onClick={() => setShowForm(!showForm)} className="btn-add-user" data-testid="admin-users-toggle-form">
            {showForm ? '✕ Cancel' : '+ Add New User'}
          </button>
        </div>

        {showForm && (
          <div className="user-form-container">
            <div data-testid="admin-users-form">
            <h2>{editingUser ? 'Edit User' : 'Create New User'}</h2>
            <form onSubmit={handleSubmit} className="user-form">
              <div className="form-row">
                <div className="form-group">
                  <label>Username *</label>
                  <input
                    type="text"
                    value={formData.username}
                    onChange={(e) => setFormData({...formData, username: e.target.value})}
                    required
                    data-testid="admin-users-input-username"
                  />
                </div>
                <div className="form-group">
                  <label>Email *</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    required
                    data-testid="admin-users-input-email"
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Full Name *</label>
                  <input
                    type="text"
                    value={formData.fullName}
                    onChange={(e) => setFormData({...formData, fullName: e.target.value})}
                    required
                    data-testid="admin-users-input-fullname"
                  />
                </div>
              </div>

              {!editingUser && (
                <div className="info-box">
                  <strong>📧 Email Setup Process</strong>
                  <p>The user will receive an email with a secure link to set their password and security questions. The link expires in 24 hours.</p>
                </div>
              )}

              <div className="form-row">
                <div className="form-group">
                  <label>Role *</label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({...formData, role: e.target.value as 'ADMIN' | 'OPERATOR'})}
                    required
                    data-testid="admin-users-input-role"
                  >
                    <option value="OPERATOR">Operator (Limited Access)</option>
                    <option value="ADMIN">Admin (Full Access)</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={formData.active}
                      onChange={(e) => setFormData({...formData, active: e.target.checked})}
                      data-testid="admin-users-input-active"
                    />
                    Active Account
                  </label>
                </div>
              </div>

              <div className="form-actions">
                <button type="button" onClick={resetForm} className="btn-cancel" data-testid="admin-users-cancel">
                  Cancel
                </button>
                <button type="submit" className="btn-save" data-testid="admin-users-submit">
                  {editingUser ? 'Update User' : 'Create User'}
                </button>
              </div>
            </form>
            </div>
          </div>
        )}

        <div className="users-table">
          <table data-testid="admin-users-table">
            <thead>
              <tr>
                <th>Username</th>
                <th>Full Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Status</th>
                <th>Last Login</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map(user => (
                <tr key={user.id} data-testid={`admin-user-row-${user.id}`}>
                  <td><strong>{user.username}</strong></td>
                  <td>{user.fullName}</td>
                  <td>{user.email}</td>
                  <td>
                    <span className={`role-badge ${user.role.toLowerCase()}`}>
                      {user.role === 'ADMIN' ? '👑 Admin' : '👤 Operator'}
                    </span>
                  </td>
                  <td>
                    <span className={`status-badge ${user.active ? 'active' : 'inactive'}`}>
                      {user.active ? '✓ Active' : '✗ Inactive'}
                    </span>
                  </td>
                  <td>
                    {user.lastLoginAt 
                      ? new Date(user.lastLoginAt).toLocaleDateString()
                      : 'Never'}
                  </td>
                  <td>
                    <div className="action-buttons">
                      <button onClick={() => handleEdit(user)} className="btn-edit" data-testid={`admin-users-edit-${user.id}`}>
                        Edit
                      </button>
                      {(user.username.toLowerCase() !== 'admin') && (
                        <button
                          onClick={() => handleDelete(user.id, user.username, user.role)}
                          className="btn-delete"
                          disabled={user.role === 'ADMIN' && !isSuperAdmin}
                          title={
                            user.role === 'ADMIN' && !isSuperAdmin
                              ? 'Only the default admin can delete admin users'
                              : undefined
                          }
                          data-testid={`admin-users-delete-${user.id}`}
                        >
                          Delete
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
  const currentUser = JSON.parse(localStorage.getItem('adminUser') || '{}');
  const isSuperAdmin = currentUser?.username?.toLowerCase() === 'admin';
