import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import AdminDashboard from './AdminDashboard';
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

const campaigns = [
  {
    id: 'c1',
    title: 'Clean Water',
    shortDescription: 'Provide clean water',
    targetAmount: 50000,
    currentAmount: 10000,
    imageUrl: '',
    active: true,
    featured: true,
    urgent: false,
    category: {
      id: 'cat1',
      name: 'Health',
      icon: '💧',
    },
  },
];

const categories = [
  {
    id: 'cat1',
    name: 'Health',
    slug: 'health',
    icon: '💧',
    color: '#000',
    active: true,
    displayOrder: 1,
  },
];

const renderWithRouter = () =>
  render(
    <MemoryRouter initialEntries={['/admin']}>
      <Routes>
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/admin/login" element={<div>Login Page</div>} />
      </Routes>
    </MemoryRouter>
  );

describe('AdminDashboard', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    localStorage.clear();
    (window.confirm as any) = vi.fn(() => true);
  });

  it('redirects to login when admin token is missing', async () => {
    renderWithRouter();

    await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith('/admin/login'));
    expect(mockAuthFetch).not.toHaveBeenCalled();
  });

  it('loads campaigns and categories and toggles campaign status', async () => {
    localStorage.setItem('adminToken', 'token');

    mockAuthFetch
      .mockResolvedValueOnce({ ok: true, json: async () => campaigns }) // campaigns load
      .mockResolvedValueOnce({ ok: true, json: async () => categories }) // categories load
      .mockResolvedValueOnce({ ok: true, json: async () => ({}) }) // toggle PUT
      .mockResolvedValueOnce({ ok: true, json: async () => campaigns }) // reload campaigns
      .mockResolvedValueOnce({ ok: true, json: async () => categories }); // reload categories

    renderWithRouter();

    expect(await screen.findByText('Admin Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Campaigns (1)')).toBeInTheDocument();
    expect(screen.getByText('Clean Water')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /✓ Active/i }));

    await waitFor(() =>
      expect(mockAuthFetch).toHaveBeenCalledWith(
        `${API_BASE_URL}/admin/campaigns/${campaigns[0].id}`,
        expect.objectContaining({ method: 'PUT' })
      )
    );

    fireEvent.click(screen.getByText('Categories (1)'));
    expect(await screen.findByText('Health')).toBeInTheDocument();
  });
});
