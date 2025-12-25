import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_BASE_URL } from '../api';
import { authFetch } from '../utils/auth';
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
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordUserId, setPasswordUserId] = useState('');
  const [passwordUsername, setPasswordUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');

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
      const res = await authFetch(`${API_BASE_URL}/admin/users`);
      
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
      const res = await fetch(`${API_BASE_URL}/admin/users`, {
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
      const res = await authFetch(`${API_BASE_URL}/auth/users/${userId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
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
    const target = users.find(u => u.id === userId);
    const currentUser = JSON.parse(localStorage.getItem('adminUser') || '{}');
    const isSuperAdmin = currentUser?.username?.toLowerCase() === 'admin';

    if (target?.username?.toLowerCase() === 'admin') {
      setErrorMessage('Default admin cannot be deleted.');
      setTimeout(() => setErrorMessage(''), 4000);
      return;
    }
    if (target?.role === 'ADMIN' && !isSuperAdmin) {
      setErrorMessage('Only the default admin can delete other admins.');
      setTimeout(() => setErrorMessage(''), 4000);
      return;
    }

    if (!window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) return;
    try {
      const res = await authFetch(`${API_BASE_URL}/auth/users/${userId}`, {
        method: 'DELETE',
        headers: {}
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

  const handleOpenPasswordModal = (userId: string, username: string) => {
    setPasswordUserId(userId);
    setPasswordUsername(username);
    setNewPassword('');
    setShowPasswordModal(true);
  };

  const handleChangePassword = async () => {
    if (newPassword.length < 8) {
      setErrorMessage('Password must be at least 8 characters');
      setTimeout(() => setErrorMessage(''), 4000);
      return;
    }

    try {
      const token = localStorage.getItem('adminToken');
      const res = await fetch(`${API_BASE_URL}/admin/users/${passwordUserId}/password`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ newPassword })
      });

      if (res.ok) {
        setSuccessMessage(`Password changed successfully for ${passwordUsername}`);
        setShowPasswordModal(false);
        setNewPassword('');
        setTimeout(() => setSuccessMessage(''), 4000);
      } else {
        const errorData = await res.json();
        setErrorMessage(errorData.error || 'Failed to change password');
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

      {errorMessage && (
        <div className="error-banner">
          {errorMessage}
        </div>
      )}

      {/* Password Change Modal */}
      {showPasswordModal && (
        <div className="modal-overlay" onClick={() => setShowPasswordModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>Change Password for {passwordUsername}</h2>
            <div className="form-group">
              <label>New Password</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new password (min 8 characters)"
                minLength={8}
              />
            </div>
            <div className="modal-actions">
              <button className="btn-cancel" onClick={() => setShowPasswordModal(false)}>
                Cancel
              </button>
              <button className="btn-submit" onClick={handleChangePassword}>
                Change Password
              </button>
            </div>
          </div>
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
                        <>
                          <button
                            className="btn-toggle-status"
                            onClick={() => handleOpenPasswordModal(user.id, user.username)}
                            title="Change password"
                          >
                            🔑 Change Password
                          </button>
                          <span className="btn-disabled" style={{ marginLeft: '0.5rem' }} title="Super user cannot be deleted">
                            🔒 Super User
                          </span>
                        </>
                      ) : user.role === 'ADMIN' ? (
                        <>
                          <button
                            className="btn-toggle-status"
                            onClick={() => handleOpenPasswordModal(user.id, user.username)}
                            title="Change password"
                          >
                            🔑 Change Password
                          </button>
                          <span className="btn-disabled" style={{ marginLeft: '0.5rem' }} title="Admin users cannot be deactivated or deleted">
                            🔒 Protected
                          </span>
                        </>
                      ) : user.id === currentUser.id ? (
                        <span className="btn-disabled" title="You cannot change your own status">
                          👤 Current User
                        </span>
                      ) : (
                        <>
                          <button
                            className="btn-toggle-status"
                            onClick={() => handleOpenPasswordModal(user.id, user.username)}
                            title="Change password"
                          >
                            🔑 Password
                          </button>
                          <button
                            className="btn-toggle-status"
                            style={{ marginLeft: '0.5rem' }}
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
