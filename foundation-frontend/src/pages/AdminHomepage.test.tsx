import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import AdminHomepage from './AdminHomepage';
import { API_BASE_URL } from '../api';

const mockAuthFetch = vi.fn();
const mockToast = vi.fn();

vi.mock('../utils/auth', () => ({
  authFetch: (...args: unknown[]) => mockAuthFetch(...args),
}));

vi.mock('../components/ToastProvider', () => ({
  useToast: () => mockToast,
}));

describe('AdminHomepage', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    localStorage.setItem('adminUser', JSON.stringify({ name: 'admin' }));
  });

  const slides = [
    {
      id: 'slide-1',
      imageUrl: 'https://example.com/slide.jpg',
      altText: 'Slide',
      focus: 'CENTER' as const,
      enabled: true,
      sortOrder: 10,
      createdAt: '',
      updatedAt: ''
    }
  ];

  const sections = [
    { id: 's1', type: 'hero', enabled: true, sortOrder: 10, configJson: '{}', createdAt: '', updatedAt: '' }
  ];

  const renderPage = () =>
    render(
      <MemoryRouter>
        <AdminHomepage />
      </MemoryRouter>
    );

  it('loads home config and renders sections table', async () => {
    mockAuthFetch.mockImplementation((url: string) => {
      if (url.endsWith('/admin/hero-slides')) {
        return { ok: true, json: () => Promise.resolve(slides) } as any;
      }
      if (url.endsWith('/admin/home/sections')) {
        return { ok: true, json: () => Promise.resolve(sections) } as any;
      }
      return { ok: true, json: () => Promise.resolve({}) } as any;
    });

    renderPage();
    await waitFor(() => expect(mockAuthFetch).toHaveBeenCalledWith(`${API_BASE_URL}/admin/hero-slides`));
    await waitFor(() => expect(mockAuthFetch).toHaveBeenCalledWith(`${API_BASE_URL}/admin/home/sections`));
    expect(screen.getByText(/Homepage Management/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Hero Carousel/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Content Sections/ })).toBeInTheDocument();
  });

  it('saves section updates from the sections tab', async () => {
    mockAuthFetch.mockImplementation((url: string, options?: any) => {
      if (url === `${API_BASE_URL}/admin/hero-slides`) {
        return { ok: true, json: () => Promise.resolve(slides) } as any;
      }
      if (url === `${API_BASE_URL}/admin/home/sections` && !options) {
        return { ok: true, json: () => Promise.resolve(sections) } as any;
      }
      if (url === `${API_BASE_URL}/admin/home/sections` && options?.method === 'PUT') {
        return { ok: true, json: () => Promise.resolve({}) } as any;
      }
      if (url.startsWith(`${API_BASE_URL}/admin/hero-slides/`)) {
        return { ok: true, json: () => Promise.resolve({}) } as any;
      }
      return { ok: true, json: () => Promise.resolve({}) } as any;
    });

    renderPage();
    await screen.findByText(/Homepage Management/i);

    fireEvent.click(screen.getByRole('button', { name: /Content Sections/ }));
    fireEvent.click(screen.getByRole('button', { name: /Save All Changes/i }));

    await waitFor(() =>
      expect(mockAuthFetch).toHaveBeenCalledWith(
        `${API_BASE_URL}/admin/home/sections`,
        expect.objectContaining({ method: 'PUT' })
      )
    );
  });
});
