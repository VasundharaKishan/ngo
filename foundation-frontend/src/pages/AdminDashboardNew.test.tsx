import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import AdminDashboardNew from './AdminDashboardNew';
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

const donations = [
  {
    id: 'd1',
    donorName: 'Alice',
    amount: 2000,
    currency: 'usd',
    status: 'SUCCESS',
    campaignId: 'c1',
    campaignTitle: 'Water',
    createdAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 'd2',
    donorName: 'Bob',
    amount: 500,
    currency: 'usd',
    status: 'PENDING',
    campaignId: 'c2',
    campaignTitle: 'Food',
    createdAt: '2024-01-02T00:00:00Z',
  },
];

const campaigns = [
  {
    id: 'c1',
    title: 'Water',
    shortDescription: 'Water help',
    targetAmount: 10000,
    currentAmount: 2000,
    imageUrl: '',
    active: true,
    featured: true,
    urgent: false,
    category: { name: 'Health', icon: '💧' },
  },
];

const categories = [
  { id: 'cat1', name: 'Health', slug: 'health', icon: '💧', color: '#000', active: true, displayOrder: 1 },
];

describe('AdminDashboardNew', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mockNavigate.mockReset();
    localStorage.clear();
    sessionStorage.clear();
  });

  it('redirects to login when no token is present', async () => {
    render(
      <MemoryRouter>
        <AdminDashboardNew />
      </MemoryRouter>
    );

    await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith('/admin/login'));
  });

  it('renders dashboard metrics and loads categories when menu changes', async () => {
    localStorage.setItem('adminToken', 'token');
    localStorage.setItem('adminUser', JSON.stringify({ role: 'ADMIN', fullName: 'Admin' }));

    mockAuthFetch
      .mockResolvedValueOnce({ ok: true, json: async () => donations }) // donations
      .mockResolvedValueOnce({ ok: true, json: async () => campaigns }) // campaigns
      .mockResolvedValueOnce({ ok: true, json: async () => categories }); // categories when switching tab

    render(
      <MemoryRouter>
        <AdminDashboardNew />
      </MemoryRouter>
    );

    expect(await screen.findByText(/Total Donations/i)).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument(); // total donations count
    expect(screen.getByText(/Active Campaigns/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Categories/i }));
    await waitFor(() =>
      expect(mockAuthFetch).toHaveBeenCalledWith(`${API_BASE_URL}/admin/categories`)
    );
    expect(screen.getByText('Health')).toBeInTheDocument();
  });
});
