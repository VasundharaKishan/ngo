import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import AdminHomeSections from './AdminHomeSections';
import { API_BASE_URL } from '../api';

const mockAuthFetch = vi.fn();
const mockToast = vi.fn();

vi.mock('../utils/auth', () => ({
  authFetch: (...args: unknown[]) => mockAuthFetch(...args),
}));

vi.mock('../components/ToastProvider', () => ({
  useToast: () => mockToast,
}));

describe('AdminHomeSections', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  const renderPage = () =>
    render(
      <MemoryRouter>
        <AdminHomeSections />
      </MemoryRouter>
    );

  it('loads and renders sections table', async () => {
    mockAuthFetch.mockResolvedValueOnce({
      ok: true,
      json: () =>
        Promise.resolve([
          { id: 's1', type: 'hero', enabled: true, sortOrder: 10, configJson: '{}', createdAt: '', updatedAt: '' },
        ]),
    });

    renderPage();

    expect(screen.getByText(/Loading/)).toBeInTheDocument();
    await waitFor(() => expect(mockAuthFetch).toHaveBeenCalledWith(`${API_BASE_URL}/admin/home/sections`));
    expect(screen.getByText(/hero/i)).toBeInTheDocument();
  });

  it('toggles enabled and saves updates', async () => {
    mockAuthFetch
      .mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve([
            { id: 's1', type: 'featured', enabled: true, sortOrder: 10, configJson: '{}', createdAt: '', updatedAt: '' },
          ]),
      })
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({}) }) // PUT save
      .mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve([
            { id: 's1', type: 'featured', enabled: true, sortOrder: 10, configJson: '{}', createdAt: '', updatedAt: '' },
          ]),
      }); // Reload after save

    renderPage();
    await screen.findByText(/featured/i);

    fireEvent.click(screen.getByRole('button', { name: /Save All Changes/i }));

    await waitFor(() =>
      expect(mockAuthFetch).toHaveBeenCalledWith(
        `${API_BASE_URL}/admin/home/sections`,
        expect.objectContaining({ method: 'PUT' })
      )
    );
  });
});
