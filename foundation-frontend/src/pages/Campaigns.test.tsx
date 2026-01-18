import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Campaigns from './Campaigns';
import { API_BASE_URL } from '../api';

const mockAuthFetch = vi.fn();

vi.mock('../utils/auth', () => ({
  authFetch: (...args: unknown[]) => mockAuthFetch(...args),
}));

describe('Campaigns page', () => {
  beforeEach(() => {
    mockAuthFetch.mockReset();
    vi.spyOn(window, 'confirm').mockReturnValue(true);
  });

  it('loads and renders campaigns table', async () => {
    mockAuthFetch.mockResolvedValueOnce({
      ok: true,
      json: () =>
        Promise.resolve([
          {
            id: '1',
            title: 'Clean Water',
            targetAmount: 20000,
            currentAmount: 10000,
            active: true,
            category: { id: 'c1', name: 'Health', icon: '💧' },
          },
        ]),
    });

    render(
      <MemoryRouter>
        <Campaigns />
      </MemoryRouter>
    );

    expect(screen.getByText(/Loading campaigns/)).toBeInTheDocument();

    await waitFor(() => expect(mockAuthFetch).toHaveBeenCalledWith(`${API_BASE_URL}/admin/campaigns`));

    const row = await screen.findByText('Clean Water');
    expect(row).toBeInTheDocument();
    const tableRow = row.closest('tr');
    expect(within(tableRow as HTMLElement).getByText(/Health/)).toBeInTheDocument();
    expect(within(tableRow as HTMLElement).getByText(/Active/)).toBeInTheDocument();
  });

  it('deletes campaign after confirmation', async () => {
    mockAuthFetch
      .mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve([
            { id: '2', title: 'School Build', targetAmount: 5000, currentAmount: 0, active: false },
          ]),
      })
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({}) }) // delete call
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve([]) }); // reload

    render(
      <MemoryRouter>
        <Campaigns />
      </MemoryRouter>
    );

    const deleteButton = await screen.findByRole('button', { name: /Delete/i });
    deleteButton.click();

    await waitFor(() =>
      expect(mockAuthFetch).toHaveBeenCalledWith(`${API_BASE_URL}/admin/campaigns/2`, { method: 'DELETE' })
    );
  });
});
