import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import AdminSettings from './AdminSettings';
import { API_BASE_URL } from '../api';

const mockAuthFetch = vi.fn();
const mockNavigate = vi.fn();
const mockToast = vi.fn();

vi.mock('../utils/auth', () => ({
  authFetch: (...args: unknown[]) => mockAuthFetch(...args),
}));

vi.mock('../components/ToastProvider', () => ({
  useToast: () => mockToast,
}));

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

const settingsResponse = [
  {
    key: 'site.name',
    value: 'Yugal Savitri Seva',
    type: 'STRING',
    isPublic: true,
    description: '',
    createdAt: '',
    updatedAt: new Date().toISOString(),
    updatedBy: 'admin',
  },
  {
    key: 'theme.primary_color',
    value: '#2563eb',
    type: 'STRING',
    isPublic: true,
    description: '',
    createdAt: '',
    updatedAt: new Date().toISOString(),
    updatedBy: 'admin',
  },
];

describe('AdminSettings', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mockNavigate.mockReset();
    localStorage.clear();
  });

  it('redirects to login when no token exists', async () => {
    render(
      <MemoryRouter>
        <AdminSettings />
      </MemoryRouter>
    );

    await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith('/admin/login'));
  });

  it('loads settings and saves updated values', async () => {
    localStorage.setItem('adminToken', 'token');

    mockAuthFetch
      .mockResolvedValueOnce({ ok: true, json: async () => settingsResponse }) // initial load
      .mockResolvedValueOnce({ ok: true, json: async () => ({ 'site.name': 'UPDATED', 'theme.primary_color': 'UPDATED' }) }) // save
      .mockResolvedValueOnce({ ok: true, json: async () => settingsResponse }); // reload

    render(
      <MemoryRouter>
        <AdminSettings />
      </MemoryRouter>
    );

    expect(await screen.findByDisplayValue('Yugal Savitri Seva')).toBeInTheDocument();

    fireEvent.change(screen.getByPlaceholderText('Yugal Savitri Seva'), {
      target: { value: 'New Name' },
    });

    fireEvent.click(screen.getByRole('button', { name: /Save All Changes/i }));

    await waitFor(() =>
      expect(mockAuthFetch).toHaveBeenCalledWith(
        `${API_BASE_URL}/admin/settings`,
        expect.objectContaining({ method: 'PUT' })
      )
    );
    expect(mockToast).toHaveBeenCalled();
  });
});
