import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import AdminHeroSlides from './AdminHeroSlides';
import { API_BASE_URL } from '../api';

const mockAuthFetch = vi.fn();
const mockToast = vi.fn();

vi.mock('../utils/auth', () => ({
  authFetch: (...args: unknown[]) => mockAuthFetch(...args),
}));

vi.mock('../components/ToastProvider', () => ({
  useToast: () => mockToast,
}));

describe('AdminHeroSlides', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  const renderPage = () =>
    render(
      <MemoryRouter>
        <AdminHeroSlides />
      </MemoryRouter>
    );

  const heroSlidesResponse = {
    ok: true,
    json: () =>
      Promise.resolve([
        { id: 'h1', imageUrl: '/img.jpg', altText: 'Alt', focus: 'CENTER', enabled: true, sortOrder: 10, createdAt: '', updatedAt: '' },
      ]),
  };

  it('loads and displays slides', async () => {
    mockAuthFetch.mockResolvedValueOnce(heroSlidesResponse);

    renderPage();
    await waitFor(() => expect(mockAuthFetch).toHaveBeenCalledWith(`${API_BASE_URL}/admin/hero-slides`));
    expect(screen.getByText(/Hero Slides/i)).toBeInTheDocument();
    expect(screen.getByText(/Alt/)).toBeInTheDocument();
  });

  it('saves slide updates', async () => {
    mockAuthFetch
      .mockResolvedValueOnce(heroSlidesResponse)
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({}) })
      .mockResolvedValueOnce(heroSlidesResponse);

    renderPage();
    await screen.findByText(/Alt/);

    fireEvent.click(screen.getByRole('button', { name: /Save Changes/i }));

    await waitFor(() =>
      expect(mockAuthFetch).toHaveBeenCalledWith(
        `${API_BASE_URL}/admin/hero-slides/h1`,
        expect.objectContaining({ method: 'PUT' })
      )
    );
  });
});
