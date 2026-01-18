import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Categories from './Categories';
import { API_BASE_URL } from '../api';

const mockAuthFetch = vi.fn();
const mockToast = vi.fn();

vi.mock('../utils/auth', () => ({
  authFetch: (...args: unknown[]) => mockAuthFetch(...args),
}));

vi.mock('../components/ToastProvider', () => ({
  useToast: () => mockToast,
}));

describe('Categories page', () => {
  beforeEach(() => {
    mockAuthFetch.mockReset();
    mockToast.mockReset();
    vi.spyOn(window, 'confirm').mockReturnValue(true);
  });

  it('renders categories table after loading', async () => {
    mockAuthFetch.mockResolvedValueOnce({
      ok: true,
      json: () =>
        Promise.resolve([
          { id: 'cat1', name: 'Education', slug: 'education', icon: '📚', displayOrder: 1, active: true },
        ]),
    });

    render(
      <MemoryRouter>
        <Categories />
      </MemoryRouter>
    );

    expect(screen.getByText(/Loading categories/)).toBeInTheDocument();
    await waitFor(() => expect(mockAuthFetch).toHaveBeenCalledWith(`${API_BASE_URL}/admin/categories`));
    expect(await screen.findByText('Education')).toBeInTheDocument();
  });

  it('invokes delete and reloads categories when confirmed', async () => {
    mockAuthFetch
      .mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve([{ id: 'cat2', name: 'Health', slug: 'health', icon: '❤️', displayOrder: 2, active: true }]),
      })
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({}) })
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve([]) });

    render(
      <MemoryRouter>
        <Categories />
      </MemoryRouter>
    );

    const deleteButton = await screen.findByRole('button', { name: /Delete/i });
    deleteButton.click();

    await waitFor(() =>
      expect(mockAuthFetch).toHaveBeenCalledWith(`${API_BASE_URL}/admin/categories/cat2`, { method: 'DELETE' })
    );
  });
});
