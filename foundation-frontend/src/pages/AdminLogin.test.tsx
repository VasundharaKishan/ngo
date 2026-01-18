import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import AdminLogin from './AdminLogin';
import { API_BASE_URL } from '../api';

const mockNavigate = vi.fn();

vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe('AdminLogin', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    sessionStorage.clear();
  });

  it('logs in successfully and stores user/session info', async () => {
    const csrfCall = vi.fn().mockResolvedValue({ ok: true, json: async () => ({}) });
    global.fetch = vi
      .fn()
      // login call
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          username: 'admin',
          email: 'admin@example.com',
          fullName: 'Admin User',
          role: 'ADMIN',
        }),
      } as Response)
      // csrf init call
      .mockImplementationOnce(csrfCall);

    render(
      <MemoryRouter>
        <AdminLogin />
      </MemoryRouter>
    );

    fireEvent.change(screen.getByPlaceholderText('Enter your username'), { target: { value: 'admin' } });
    fireEvent.change(screen.getByPlaceholderText('Enter your password'), { target: { value: 'secret' } });
    fireEvent.click(screen.getByRole('button', { name: /login/i }));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        `${API_BASE_URL}/auth/login`,
        expect.objectContaining({ method: 'POST' })
      );
      expect(mockNavigate).toHaveBeenCalledWith('/admin');
      expect(localStorage.getItem('adminUser')).toContain('admin@example.com');
      expect(sessionStorage.getItem('admin_session_id')).toBeTruthy();
    });
  });

  it('shows error message when login fails', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      json: async () => ({ error: 'Invalid credentials' }),
    } as Response);

    render(
      <MemoryRouter>
        <AdminLogin />
      </MemoryRouter>
    );

    fireEvent.change(screen.getByPlaceholderText('Enter your username'), { target: { value: 'admin' } });
    fireEvent.change(screen.getByPlaceholderText('Enter your password'), { target: { value: 'wrong' } });
    fireEvent.click(screen.getByRole('button', { name: /login/i }));

    await screen.findByText(/invalid credentials/i);
    expect(mockNavigate).not.toHaveBeenCalled();
  });
});
