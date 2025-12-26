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
    password: '',
    fullName: '',
    role: 'OPERATOR' as 'ADMIN' | 'OPERATOR',
    active: true
  });

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      const res = await authFetch(`${API_BASE_URL}/auth/users`);
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
      ? `${API_BASE_URL}/auth/users/${editingUser.id}`
      : `${API_BASE_URL}/auth/users`;
    
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
      password: '', // Don't populate password
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
      await authFetch(`${API_BASE_URL}/auth/users/${id}`, {
        method: 'DELETE'
      });
      loadUsers();
    } catch (error) {
      console.error('Error deleting user:', error);
    }
  };

  const resetForm = () => {
    setShowForm(false);
    setEditingUser(null);
    setFormData({
      username: '',
      email: '',
      password: '',
      fullName: '',
      role: 'OPERATOR',
      active: true
    });
  };

  if (loading) {
    return <div className="admin-users"><p>Loading...</p></div>;
  }

  return (
    <div className="admin-users">
      <div className="users-container">
        <div className="users-actions">
          <button onClick={() => setShowForm(!showForm)} className="btn-add-user">
            {showForm ? '✕ Cancel' : '+ Add New User'}
          </button>
        </div>

        {showForm && (
          <div className="user-form-container">
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
                  />
                </div>
                <div className="form-group">
                  <label>Email *</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    required
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
                  />
                </div>
                <div className="form-group">
                  <label>Password {editingUser ? '(leave empty to keep current)' : '*'}</label>
                  <input
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({...formData, password: e.target.value})}
                    required={!editingUser}
                    minLength={6}
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Role *</label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({...formData, role: e.target.value as 'ADMIN' | 'OPERATOR'})}
                    required
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
                    />
                    Active Account
                  </label>
                </div>
              </div>

              <div className="form-actions">
                <button type="button" onClick={resetForm} className="btn-cancel">Cancel</button>
                <button type="submit" className="btn-save">{editingUser ? 'Update User' : 'Create User'}</button>
              </div>
            </form>
          </div>
        )}

        <div className="users-table">
          <table>
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
                <tr key={user.id}>
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
                      <button onClick={() => handleEdit(user)} className="btn-edit">Edit</button>
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
