import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import AdminUsersList from './AdminUsersList';
import { API_BASE_URL } from '../api';

const mockAuthFetch = vi.fn();
const mockNavigate = vi.fn();

vi.mock('../utils/auth', () => ({
  authFetch: (...args: unknown[]) => mockAuthFetch(...args),
}));

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe('AdminUsersList', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mockNavigate.mockReset();
    localStorage.clear();
    (global.fetch as any) = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({}),
    });
  });

  it('redirects non-admin users to dashboard', async () => {
    localStorage.setItem('adminToken', 'token');
    localStorage.setItem('adminUser', JSON.stringify({ role: 'OPERATOR' }));

    render(
      <MemoryRouter>
        <AdminUsersList />
      </MemoryRouter>
    );

    await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith('/admin'));
  });

  it('loads and renders users, opens password modal', async () => {
    localStorage.setItem('adminToken', 'token');
    localStorage.setItem('adminUser', JSON.stringify({ role: 'ADMIN', id: 'admin-id' }));

    const users = [
      {
        id: 'u1',
        username: 'operator1',
        email: 'op@example.com',
        fullName: 'Operator One',
        role: 'OPERATOR',
        active: true,
        createdAt: '2024-01-01T00:00:00Z',
        lastLoginAt: '2024-01-02T12:00:00Z',
      },
    ];

    mockAuthFetch.mockResolvedValue({
      ok: true,
      json: async () => users,
    });

    render(
      <MemoryRouter>
        <AdminUsersList />
      </MemoryRouter>
    );

    expect(await screen.findByText('Operator One')).toBeInTheDocument();
    expect(mockAuthFetch).toHaveBeenCalledWith(`${API_BASE_URL}/admin/users`);

    fireEvent.click(screen.getByRole('button', { name: /Password/i }));
    expect(await screen.findByText(/Change Password for operator1/i)).toBeInTheDocument();
  });
});
