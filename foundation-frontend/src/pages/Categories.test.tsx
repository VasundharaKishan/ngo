import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Categories from './Categories';
import { API_BASE_URL } from '../api';

vi.mock('../contexts/ConfigContext', () => ({
  useSiteName: () => 'Test Foundation',
  useConfig: () => ({ config: {}, loading: false, refetch: vi.fn() }),
}));

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

  it('opens edit modal when Edit button is clicked', async () => {
    mockAuthFetch.mockResolvedValueOnce({
      ok: true,
      json: () =>
        Promise.resolve([
          { id: 'cat3', name: 'Environment', slug: 'environment', icon: '🌿', displayOrder: 3, active: true },
        ]),
    });

    render(
      <MemoryRouter>
        <Categories />
      </MemoryRouter>
    );

    const editButton = await screen.findByRole('button', { name: /Edit/i });
    fireEvent.click(editButton);

    expect(screen.getByTestId('edit-category-modal')).toBeInTheDocument();
    expect(screen.getByText(/Edit Category: Environment/i)).toBeInTheDocument();
  });

  it('updates category name in modal input', async () => {
    mockAuthFetch.mockResolvedValueOnce({
      ok: true,
      json: () =>
        Promise.resolve([
          { id: 'cat4', name: 'Arts', slug: 'arts', icon: '🎨', displayOrder: 4, active: true },
        ]),
    });

    render(
      <MemoryRouter>
        <Categories />
      </MemoryRouter>
    );

    const editButton = await screen.findByRole('button', { name: /Edit/i });
    fireEvent.click(editButton);

    const nameInput = screen.getByTestId('cat-edit-name');
    fireEvent.change(nameInput, { target: { value: 'Art & Craft' } });

    expect((nameInput as HTMLInputElement).value).toBe('Art & Craft');
  });

  it('calls saveCategory (PATCH) when Save Changes is clicked', async () => {
    mockAuthFetch
      .mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve([
            { id: 'cat5', name: 'Sports', slug: 'sports', icon: '⚽', displayOrder: 5, active: true },
          ]),
      })
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({}) }) // PATCH
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve([]) }); // reload

    render(
      <MemoryRouter>
        <Categories />
      </MemoryRouter>
    );

    const editButton = await screen.findByRole('button', { name: /Edit/i });
    fireEvent.click(editButton);

    const saveButton = screen.getByTestId('cat-edit-save');
    fireEvent.click(saveButton);

    await waitFor(() =>
      expect(mockAuthFetch).toHaveBeenCalledWith(
        `${API_BASE_URL}/admin/categories/cat5`,
        expect.objectContaining({ method: 'PATCH' })
      )
    );
  });

  it('closes edit modal when Cancel is clicked', async () => {
    mockAuthFetch.mockResolvedValueOnce({
      ok: true,
      json: () =>
        Promise.resolve([
          { id: 'cat6', name: 'Music', slug: 'music', icon: '🎵', displayOrder: 6, active: true },
        ]),
    });

    render(
      <MemoryRouter>
        <Categories />
      </MemoryRouter>
    );

    const editButton = await screen.findByRole('button', { name: /Edit/i });
    fireEvent.click(editButton);

    expect(screen.getByTestId('edit-category-modal')).toBeInTheDocument();

    const cancelButton = screen.getByRole('button', { name: /Cancel/i });
    fireEvent.click(cancelButton);

    await waitFor(() =>
      expect(screen.queryByTestId('edit-category-modal')).not.toBeInTheDocument()
    );
  });
});
