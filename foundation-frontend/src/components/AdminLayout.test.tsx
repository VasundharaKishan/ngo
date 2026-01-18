import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import AdminLayout from './AdminLayout';
import { API_BASE_URL } from '../api';
import { STORAGE_KEYS } from '../config/constants';

const mockNavigate = vi.fn();
const originalFetch = global.fetch;

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe('AdminLayout', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mockNavigate.mockReset();
    localStorage.clear();
    sessionStorage.clear();
    global.fetch = vi.fn(() => Promise.resolve({ ok: true, json: async () => ({}) })) as any;
  });

  afterEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    global.fetch = originalFetch;
  });

  it('redirects to login when no admin user is found', async () => {
    render(
      <MemoryRouter>
        <AdminLayout />
      </MemoryRouter>
    );

    await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith('/admin/login'));
  });

  it('initializes session and performs logout', async () => {
    localStorage.setItem('adminUser', JSON.stringify({ fullName: 'Test Admin', role: 'ADMIN', email: 'a@b.com', username: 'admin' }));

    render(
      <MemoryRouter>
        <AdminLayout />
      </MemoryRouter>
    );

    expect(await screen.findByText(/Admin Portal/i)).toBeInTheDocument();
    expect(localStorage.getItem(STORAGE_KEYS.SESSION_ID)).toBeTruthy();
    expect(localStorage.getItem(STORAGE_KEYS.LAST_ACTIVITY)).toBeTruthy();

    const logoutButtons = screen.getAllByRole('button', { name: /logout/i });
    fireEvent.click(logoutButtons[0]);

    await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith('/admin/login'));
    expect(global.fetch).toHaveBeenCalledWith(`${API_BASE_URL}/auth/logout`, expect.objectContaining({ method: 'POST' }));
    expect(localStorage.getItem('adminUser')).toBeNull();

  });
});
