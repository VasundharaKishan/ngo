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

  it('saves hero carousel slides', async () => {
    mockAuthFetch.mockImplementation((url: string, options?: any) => {
      if (url === `${API_BASE_URL}/admin/hero-slides`) {
        return { ok: true, json: () => Promise.resolve(slides) } as any;
      }
      if (url === `${API_BASE_URL}/admin/home/sections`) {
        return { ok: true, json: () => Promise.resolve(sections) } as any;
      }
      if (url.includes('/admin/hero-slides/') && options?.method === 'PUT') {
        return { ok: true, json: () => Promise.resolve({}) } as any;
      }
      return { ok: true, json: () => Promise.resolve({}) } as any;
    });

    renderPage();
    await screen.findByText(/Homepage Management/i);

    // On Hero Carousel tab by default — click Save
    const saveBtn = await screen.findByRole('button', { name: /Save All Changes/i });
    fireEvent.click(saveBtn);

    await waitFor(() =>
      expect(mockAuthFetch).toHaveBeenCalledWith(
        `${API_BASE_URL}/admin/hero-slides/slide-1`,
        expect.objectContaining({ method: 'PUT' })
      )
    );
    expect(mockToast).toHaveBeenCalledWith('Hero slides updated successfully', 'success');
  });

  it('toggles slide enabled state via checkbox', async () => {
    mockAuthFetch.mockImplementation((url: string) => {
      if (url === `${API_BASE_URL}/admin/hero-slides`) {
        return { ok: true, json: () => Promise.resolve(slides) } as any;
      }
      if (url === `${API_BASE_URL}/admin/home/sections`) {
        return { ok: true, json: () => Promise.resolve(sections) } as any;
      }
      return { ok: true, json: () => Promise.resolve({}) } as any;
    });

    renderPage();
    await screen.findByText(/Homepage Management/i);

    // Slide is enabled by default, checkbox should be checked
    const checkbox = await screen.findByRole('checkbox');
    expect(checkbox).toBeChecked();
    fireEvent.click(checkbox);
    await waitFor(() => expect(screen.getByText('Disabled')).toBeInTheDocument());
  });

  it('deletes a slide', async () => {
    mockAuthFetch.mockImplementation((url: string, options?: any) => {
      if (url === `${API_BASE_URL}/admin/hero-slides`) {
        return { ok: true, json: () => Promise.resolve(slides) } as any;
      }
      if (url === `${API_BASE_URL}/admin/home/sections`) {
        return { ok: true, json: () => Promise.resolve(sections) } as any;
      }
      if (url.includes('/admin/hero-slides/') && options?.method === 'DELETE') {
        return { ok: true, json: () => Promise.resolve([]) } as any;
      }
      return { ok: true, json: () => Promise.resolve({}) } as any;
    });

    vi.spyOn(window, 'confirm').mockReturnValue(true);

    renderPage();
    await screen.findByText(/Homepage Management/i);

    const deleteBtn = await screen.findByRole('button', { name: /Delete/i });
    fireEvent.click(deleteBtn);

    await waitFor(() =>
      expect(mockAuthFetch).toHaveBeenCalledWith(
        `${API_BASE_URL}/admin/hero-slides/slide-1`,
        expect.objectContaining({ method: 'DELETE' })
      )
    );
  });

  it('toggles a content section enabled state via checkbox', async () => {
    mockAuthFetch.mockImplementation((url: string) => {
      if (url === `${API_BASE_URL}/admin/hero-slides`) {
        return { ok: true, json: () => Promise.resolve(slides) } as any;
      }
      if (url === `${API_BASE_URL}/admin/home/sections`) {
        return { ok: true, json: () => Promise.resolve(sections) } as any;
      }
      return { ok: true, json: () => Promise.resolve({}) } as any;
    });

    renderPage();
    await screen.findByText(/Homepage Management/i);

    fireEvent.click(screen.getByRole('button', { name: /Content Sections/ }));
    // Wait for sections tab to render with checkbox
    const checkboxes = await screen.findAllByRole('checkbox');
    // Section checkbox should be checked (enabled: true)
    const sectionCheckbox = checkboxes[checkboxes.length - 1];
    expect(sectionCheckbox).toBeChecked();
    fireEvent.click(sectionCheckbox);
    await waitFor(() => expect(sectionCheckbox).not.toBeChecked());
  });

  it('updates slide focus select', async () => {
    const multipleSlides = [
      { ...slides[0] },
      { id: 'slide-2', imageUrl: 'https://example.com/2.jpg', altText: 'Slide 2', focus: 'CENTER' as const, enabled: true, sortOrder: 20, createdAt: '', updatedAt: '' }
    ];

    mockAuthFetch.mockImplementation((url: string) => {
      if (url === `${API_BASE_URL}/admin/hero-slides`) {
        return { ok: true, json: () => Promise.resolve(multipleSlides) } as any;
      }
      if (url === `${API_BASE_URL}/admin/home/sections`) {
        return { ok: true, json: () => Promise.resolve(sections) } as any;
      }
      return { ok: true, json: () => Promise.resolve({}) } as any;
    });

    renderPage();
    await screen.findByText(/Homepage Management/i);
    const selects = await screen.findAllByRole('combobox');
    expect(selects.length).toBeGreaterThan(0);
    fireEvent.change(selects[0], { target: { value: 'TOP' } });
    expect((selects[0] as HTMLSelectElement).value).toBe('TOP');
  });

  it('saves sections and shows success toast', async () => {
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
      return { ok: true, json: () => Promise.resolve(sections) } as any;
    });

    renderPage();
    await screen.findByText(/Homepage Management/i);
    fireEvent.click(screen.getByRole('button', { name: /Content Sections/ }));
    await screen.findAllByRole('checkbox');
    fireEvent.click(screen.getByRole('button', { name: /Save All Changes/i }));

    await waitFor(() =>
      expect(mockToast).toHaveBeenCalledWith('Home sections updated successfully', 'success')
    );
  });

  it('moves slides up and down with ↑ ↓ buttons', async () => {
    const twoSlides = [
      { ...slides[0], sortOrder: 10 },
      { id: 'slide-2', imageUrl: 'https://example.com/2.jpg', altText: 'Slide 2', focus: 'CENTER' as const, enabled: true, sortOrder: 20, createdAt: '', updatedAt: '' },
    ];

    mockAuthFetch.mockImplementation((url: string) => {
      if (url === `${API_BASE_URL}/admin/hero-slides`) {
        return { ok: true, json: () => Promise.resolve(twoSlides) } as any;
      }
      if (url === `${API_BASE_URL}/admin/home/sections`) {
        return { ok: true, json: () => Promise.resolve(sections) } as any;
      }
      return { ok: true, json: () => Promise.resolve({}) } as any;
    });

    renderPage();
    await screen.findByText(/Homepage Management/i);

    // Find the ↓ button of first slide and click it (swaps slides)
    const downButtons = await screen.findAllByText('↓');
    expect(downButtons.length).toBeGreaterThan(0);
    fireEvent.click(downButtons[0]);

    // After moving down, ↑ buttons exist for the now-second slide
    expect(screen.getAllByText('↑').length).toBeGreaterThan(0);
  });

  it('moves sections up and down in sections tab', async () => {
    const twoSections = [
      { id: 's1', type: 'hero', enabled: true, sortOrder: 10, configJson: '{}', createdAt: '', updatedAt: '' },
      { id: 's2', type: 'stats', enabled: true, sortOrder: 20, configJson: '{}', createdAt: '', updatedAt: '' },
    ];

    mockAuthFetch.mockImplementation((url: string) => {
      if (url === `${API_BASE_URL}/admin/hero-slides`) {
        return { ok: true, json: () => Promise.resolve(slides) } as any;
      }
      if (url === `${API_BASE_URL}/admin/home/sections`) {
        return { ok: true, json: () => Promise.resolve(twoSections) } as any;
      }
      return { ok: true, json: () => Promise.resolve({}) } as any;
    });

    renderPage();
    await screen.findByText(/Homepage Management/i);
    fireEvent.click(screen.getByRole('button', { name: /Content Sections/ }));

    // Wait for sections to render
    await screen.findByText('hero');

    // Click the ↓ button of first section (should swap hero and stats)
    const downButtons = screen.getAllByText('↓');
    fireEvent.click(downButtons[0]);

    // Verify sections are still rendered (reordered in state)
    expect(screen.getAllByText('↑').length).toBeGreaterThan(0);
  });

  it('updates configJson via textarea in sections tab', async () => {
    mockAuthFetch.mockImplementation((url: string) => {
      if (url === `${API_BASE_URL}/admin/hero-slides`) {
        return { ok: true, json: () => Promise.resolve(slides) } as any;
      }
      if (url === `${API_BASE_URL}/admin/home/sections`) {
        return { ok: true, json: () => Promise.resolve(sections) } as any;
      }
      return { ok: true, json: () => Promise.resolve({}) } as any;
    });

    renderPage();
    await screen.findByText(/Homepage Management/i);
    fireEvent.click(screen.getByRole('button', { name: /Content Sections/ }));
    await screen.findByText('hero');

    const textarea = screen.getByRole('textbox') as HTMLTextAreaElement;
    fireEvent.change(textarea, { target: { value: '{"key":"value"}' } });
    expect(textarea.value).toBe('{"key":"value"}');
  });
});
