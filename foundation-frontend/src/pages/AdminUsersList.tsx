import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './AdminUsersList.css';

interface AdminUser {
  id: string;
  username: string;
  email: string;
  fullName: string;
  role: 'ADMIN' | 'OPERATOR';
  active: boolean;
  createdAt: string;
  lastLoginAt?: string;
}

export default function AdminUsersList() {
  const navigate = useNavigate();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    fullName: '',
    role: 'OPERATOR' as 'ADMIN' | 'OPERATOR'
  });
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const currentUser = JSON.parse(localStorage.getItem('adminUser') || '{}');

  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    if (!token) {
      navigate('/admin/login');
      return;
    }

    // Check if user is admin
    if (currentUser.role !== 'ADMIN') {
      navigate('/admin');
      return;
    }

    loadUsers();
  }, []);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('adminToken');
      const res = await fetch('http://localhost:8080/api/admin/users', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (res.ok) {
        const data = await res.json();
        setUsers(data);
      } else {
        console.error('Failed to load users');
      }
    } catch (error) {
      console.error('Error loading users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMessage('');
    setErrorMessage('');
    setSubmitting(true);

    try {
      const token = localStorage.getItem('adminToken');
      const res = await fetch('http://localhost:8080/api/auth/users', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      if (res.ok) {
        setSuccessMessage('✅ User created successfully! Setup email sent to ' + formData.email);
        setFormData({
          username: '',
          email: '',
          fullName: '',
          role: 'OPERATOR'
        });
        setShowAddForm(false);
        loadUsers(); // Reload the list
        
        // Clear success message after 5 seconds
        setTimeout(() => setSuccessMessage(''), 5000);
      } else {
        const errorData = await res.json();
        let errorMsg = errorData.error || 'Failed to create user';
        
        // Handle duplicate errors
        if (errorMsg.includes('duplicate key') || errorMsg.includes('already exists')) {
          if (errorMsg.includes('email')) {
            errorMsg = '❌ This email address is already registered. Please use a different email.';
          } else if (errorMsg.includes('username')) {
            errorMsg = '❌ This username is already taken. Please choose a different username.';
          } else {
            errorMsg = '❌ A user with these details already exists. Please use different information.';
          }
        }
        
        setErrorMessage(errorMsg);
      }
    } catch (error) {
      console.error('Error creating user:', error);
      setErrorMessage('Connection error. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleActive = async (userId: string, currentActive: boolean) => {
    try {
      const token = localStorage.getItem('adminToken');
      const res = await fetch(`http://localhost:8080/api/admin/users/${userId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ active: !currentActive })
      });

      if (res.ok) {
        loadUsers();
      }
    } catch (error) {
      console.error('Error toggling user status:', error);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) return;
    try {
      const token = localStorage.getItem('adminToken');
      const res = await fetch(`http://localhost:8080/api/auth/users/${userId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (res.ok) {
        setSuccessMessage('User deleted successfully.');
        loadUsers();
        setTimeout(() => setSuccessMessage(''), 4000);
      } else {
        const errorData = await res.json();
        setErrorMessage(errorData.error || 'Failed to delete user.');
        setTimeout(() => setErrorMessage(''), 4000);
      }
    } catch (error) {
      setErrorMessage('Connection error. Please try again.');
      setTimeout(() => setErrorMessage(''), 4000);
    }
  };

  return (
    <div className="admin-users-list-page">
      <div className="page-header">
        <div>
          <h1>👥 User Management</h1>
          <p>Manage admin and operator accounts</p>
        </div>
        <button 
          className="btn-add-user"
          onClick={() => setShowAddForm(!showAddForm)}
        >
          {showAddForm ? '✕ Cancel' : '+ Add New User'}
        </button>
      </div>

      {successMessage && (
        <div className="success-banner">
          {successMessage}
        </div>
      )}

      {showAddForm && (
        <div className="add-user-form-container">
          <h2>Create New User</h2>
          
          <div className="info-box">
            <strong>📧 Email Setup Process</strong>
            <p>When you create a user, they will receive an email with a secure link to:</p>
            <ul>
              <li>Set their own password</li>
              <li>Choose and answer security questions</li>
            </ul>
            <p>The setup link expires in 24 hours.</p>
          </div>

          {errorMessage && (
            <div className="error-message">
              {errorMessage}
            </div>
          )}

          <form onSubmit={handleSubmit} className="user-form">
            <div className="form-row">
              <div className="form-group">
                <label>Username *</label>
                <input
                  type="text"
                  value={formData.username}
                  onChange={(e) => setFormData({...formData, username: e.target.value})}
                  placeholder="Enter username"
                  required
                  disabled={submitting}
                />
              </div>

              <div className="form-group">
                <label>Email *</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  placeholder="Enter email address"
                  required
                  disabled={submitting}
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
                  placeholder="Enter full name"
                  required
                  disabled={submitting}
                />
              </div>

              <div className="form-group">
                <label>Role *</label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({...formData, role: e.target.value as 'ADMIN' | 'OPERATOR'})}
                  required
                  disabled={submitting}
                >
                  <option value="OPERATOR">Operator (Limited Access)</option>
                  <option value="ADMIN">Admin (Full Access)</option>
                </select>
                <small className="field-hint">
                  {formData.role === 'OPERATOR' 
                    ? 'Can manage campaigns and categories only'
                    : 'Full access to all features including donations and users'}
                </small>
              </div>
            </div>

            <button type="submit" className="btn-submit" disabled={submitting}>
              {submitting ? 'Creating...' : 'Create User & Send Email'}
            </button>
          </form>
        </div>
      )}

      <div className="users-list-container">
        {loading ? (
          <div className="loading-state">Loading users...</div>
        ) : (
          <table className="users-table">
            <thead>
              <tr>
                <th>User</th>
                <th>Email</th>
                <th>Role</th>
                <th>Status</th>
                <th>Last Login</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '2rem' }}>
                    No users found
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr key={user.id}>
                    <td>
                      <div className="user-info">
                        <div className="user-avatar">
                          {user.fullName.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <strong>{user.fullName}</strong>
                          <div className="username">@{user.username}</div>
                        </div>
                      </div>
                    </td>
                    <td>{user.email}</td>
                    <td>
                      <span className={`role-badge ${user.role.toLowerCase()}`}>
                        {user.role === 'ADMIN' ? '👑 Admin' : '👤 Operator'}
                      </span>
                    </td>
                    <td>
                      <span className={`status-badge ${user.active ? 'active' : 'inactive'}`}>
                        {user.active ? '🟢 Active' : '🔴 Inactive'}
                      </span>
                    </td>
                    <td>
                      {user.lastLoginAt 
                        ? new Date(user.lastLoginAt).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })
                        : 'Never'}
                    </td>
                    <td>
                      {new Date(user.createdAt).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </td>
                    <td>
                      {/* Super user cannot be deactivated or deleted */}
                      {user.username === 'admin' ? (
                        <span className="btn-disabled" title="Super user cannot be changed or deleted">
                          🔒 Super User
                        </span>
                      ) : user.role === 'ADMIN' ? (
                        <span className="btn-disabled" title="Admin users cannot be deactivated or deleted">
                          🔒 Protected
                        </span>
                      ) : user.id === currentUser.id ? (
                        <span className="btn-disabled" title="You cannot change your own status">
                          👤 Current User
                        </span>
                      ) : (
                        <>
                          <button
                            className="btn-toggle-status"
                            onClick={() => handleToggleActive(user.id, user.active)}
                          >
                            {user.active ? 'Deactivate' : 'Activate'}
                          </button>
                          <button
                            className="btn-toggle-status"
                            style={{ marginLeft: '0.5rem', background: '#fee2e2', color: '#991b1b', borderColor: '#fecaca' }}
                            onClick={() => handleDeleteUser(user.id)}
                            title="Delete user"
                          >
                            Delete
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
