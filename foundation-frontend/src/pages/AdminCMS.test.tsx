import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import AdminCMS from './AdminCMS';
import { API_BASE_URL } from '../config/constants';

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

const testimonialData = [
  { id: 't1', authorName: 'Alice', authorTitle: 'Donor', testimonialText: 'Great work', displayOrder: 1, active: true },
];

const statsData = [
  { id: 's1', statLabel: 'Impact', statValue: '1000+', icon: '⭐', displayOrder: 1, active: true },
];

describe('AdminCMS', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mockNavigate.mockReset();
    localStorage.clear();
  });

  it('redirects to login when no admin user is present', async () => {
    render(
      <MemoryRouter>
        <AdminCMS />
      </MemoryRouter>
    );

    await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith('/admin/login'));
  });

  it('loads testimonials by default and fetches stats when tab changes', async () => {
    localStorage.setItem('adminUser', JSON.stringify({ username: 'admin' }));

    mockAuthFetch
      .mockResolvedValueOnce({ ok: true, json: async () => testimonialData })
      .mockResolvedValueOnce({ ok: true, json: async () => statsData });

    render(
      <MemoryRouter>
        <AdminCMS />
      </MemoryRouter>
    );

    expect(await screen.findByText('Alice')).toBeInTheDocument();
    expect(mockAuthFetch).toHaveBeenCalledWith(`${API_BASE_URL}/admin/cms/testimonials`);

    fireEvent.click(screen.getByRole('button', { name: /Statistics/i }));

    await waitFor(() => expect(mockAuthFetch).toHaveBeenCalledWith(`${API_BASE_URL}/admin/cms/stats`));
    expect(screen.getByText('Impact')).toBeInTheDocument();
    expect(screen.getByText('1000+')).toBeInTheDocument();
  });
});
