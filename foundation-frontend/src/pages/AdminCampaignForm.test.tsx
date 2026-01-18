import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import AdminCampaignForm from './AdminCampaignForm';
import { API_BASE_URL } from '../api';

const mockAuthFetch = vi.fn();
const mockToast = vi.fn();
const mockNavigate = vi.fn();

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

const categories = [
  { id: 'cat-1', name: 'Health', icon: '💧' },
  { id: 'cat-2', name: 'Education', icon: '📚' },
];

const existingCampaign = {
  id: 'c-1',
  title: 'Existing Campaign',
  shortDescription: 'Help children',
  fullDescription: 'Detailed description',
  category: { id: 'cat-2', name: 'Education', icon: '📚' },
  targetAmount: 500000,
  currentAmount: 125000,
  imageUrl: 'http://example.com/image.jpg',
  location: 'City',
  beneficiariesCount: 10,
  featured: true,
  urgent: false,
  active: true,
};

const renderCreate = () =>
  render(
    <MemoryRouter initialEntries={['/admin/campaigns/new']}>
      <Routes>
        <Route path="/admin/campaigns/new" element={<AdminCampaignForm />} />
        <Route path="/admin/login" element={<div>Login Page</div>} />
        <Route path="/admin/campaigns" element={<div>Campaigns List</div>} />
      </Routes>
    </MemoryRouter>
  );

const renderEdit = () =>
  render(
    <MemoryRouter initialEntries={['/admin/campaigns/c-1']}>
      <Routes>
        <Route path="/admin/campaigns/:id" element={<AdminCampaignForm />} />
      </Routes>
    </MemoryRouter>
  );

describe('AdminCampaignForm', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    localStorage.clear();
  });

  it('redirects to login when admin token is missing', async () => {
    renderCreate();

    await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith('/admin/login'));
    expect(mockAuthFetch).not.toHaveBeenCalled();
  });

  it('submits a new campaign with required fields', async () => {
    localStorage.setItem('adminToken', 'token');

    mockAuthFetch
      .mockResolvedValueOnce({ ok: true, json: async () => categories }) // load categories
      .mockResolvedValueOnce({ ok: true, json: async () => ({}) }); // POST create

    renderCreate();

    const textboxes = await screen.findAllByRole('textbox');
    fireEvent.change(textboxes[0], { target: { value: 'Save the Planet' } }); // title
    fireEvent.change(textboxes[1], { target: { value: 'Short text' } }); // short description
    fireEvent.change(textboxes[2], { target: { value: 'Longer description' } }); // full description

    fireEvent.change(screen.getByRole('combobox'), { target: { value: categories[0].id } });

    const spinboxes = screen.getAllByRole('spinbutton');
    fireEvent.change(spinboxes[0], { target: { value: '123.45' } }); // target amount

    fireEvent.click(screen.getByRole('button', { name: /Create Campaign/i }));

    await waitFor(() =>
      expect(mockAuthFetch).toHaveBeenCalledWith(
        `${API_BASE_URL}/admin/campaigns`,
        expect.objectContaining({ method: 'POST' })
      )
    );

    const [, options] = mockAuthFetch.mock.calls[1];
    const body = JSON.parse((options as RequestInit).body as string);
    expect(body.title).toBe('Save the Planet');
    expect(body.categoryId).toBe('cat-1');
    expect(body.targetAmount).toBe(12345); // cents
    expect(mockNavigate).toHaveBeenCalledWith('/admin/campaigns');
  });

  it('prefills fields when editing an existing campaign', async () => {
    localStorage.setItem('adminToken', 'token');

    mockAuthFetch.mockImplementation((url: string) => {
      if (url === `${API_BASE_URL}/admin/categories`) {
        return Promise.resolve({ ok: true, json: async () => categories });
      }
      if (url === `${API_BASE_URL}/admin/campaigns/${existingCampaign.id}`) {
        return Promise.resolve({ ok: true, json: async () => existingCampaign });
      }
      return Promise.resolve({ ok: true, json: async () => ({}) });
    });

    renderEdit();

    expect(await screen.findByDisplayValue(existingCampaign.title)).toBeInTheDocument();
    expect(screen.getByDisplayValue(existingCampaign.shortDescription)).toBeInTheDocument();
    expect(screen.getByDisplayValue('5000.00')).toBeInTheDocument(); // target in dollars
    expect(screen.getByDisplayValue('1250.00')).toBeInTheDocument(); // current amount
    expect((screen.getByRole('combobox') as HTMLSelectElement).value).toBe('cat-2');
  });
});
