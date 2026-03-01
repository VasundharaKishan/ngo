import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import AdminCMS from './AdminCMS';
import { API_BASE_URL } from '../config/constants';

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

const testimonialData = [
  { id: 't1', authorName: 'Alice', authorTitle: 'Donor', testimonialText: 'Great work', displayOrder: 1, active: true },
];

const statsData = [
  { id: 's1', statLabel: 'Impact', statValue: '1000+', icon: '⭐', displayOrder: 1, active: true },
];

describe('AdminCMS', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mockNavigate.mockReset();
    localStorage.clear();
  });

  it('redirects to login when no admin user is present', async () => {
    render(
      <MemoryRouter>
        <AdminCMS />
      </MemoryRouter>
    );

    await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith('/admin/login'));
  });

  it('loads testimonials by default and fetches stats when tab changes', async () => {
    localStorage.setItem('adminUser', JSON.stringify({ username: 'admin' }));

    mockAuthFetch
      .mockResolvedValueOnce({ ok: true, json: async () => testimonialData })
      .mockResolvedValueOnce({ ok: true, json: async () => statsData });

    render(
      <MemoryRouter>
        <AdminCMS />
      </MemoryRouter>
    );

    expect(await screen.findByText('Alice')).toBeInTheDocument();
    expect(mockAuthFetch).toHaveBeenCalledWith(`${API_BASE_URL}/admin/cms/testimonials`);

    fireEvent.click(screen.getByRole('button', { name: /Statistics/i }));

    await waitFor(() => expect(mockAuthFetch).toHaveBeenCalledWith(`${API_BASE_URL}/admin/cms/stats`));
    expect(screen.getByText('Impact')).toBeInTheDocument();
    expect(screen.getByText('1000+')).toBeInTheDocument();
  });

  it('clicking Delete on a testimonial calls handleDelete with confirmation', async () => {
    localStorage.setItem('adminUser', JSON.stringify({ username: 'admin' }));
    vi.spyOn(window, 'confirm').mockReturnValue(true);

    mockAuthFetch
      .mockResolvedValueOnce({ ok: true, json: async () => testimonialData }) // initial load
      .mockResolvedValueOnce({ ok: true, json: async () => ({}) })             // DELETE
      .mockResolvedValueOnce({ ok: true, json: async () => [] });              // reload

    render(
      <MemoryRouter>
        <AdminCMS />
      </MemoryRouter>
    );

    const deleteBtn = await screen.findByRole('button', { name: /Delete/i });
    fireEvent.click(deleteBtn);

    await waitFor(() =>
      expect(mockAuthFetch).toHaveBeenCalledWith(
        `${API_BASE_URL}/admin/cms/testimonials/t1`,
        expect.objectContaining({ method: 'DELETE' })
      )
    );
  });

  it('clicking Add Testimonial shows the testimonial form', async () => {
    localStorage.setItem('adminUser', JSON.stringify({ username: 'admin' }));

    mockAuthFetch.mockResolvedValueOnce({ ok: true, json: async () => testimonialData });

    render(
      <MemoryRouter>
        <AdminCMS />
      </MemoryRouter>
    );

    await screen.findByText('Alice');
    fireEvent.click(screen.getByRole('button', { name: /\+ Add Testimonial/i }));

    expect(screen.getByPlaceholderText('Author Name')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Testimonial Text')).toBeInTheDocument();
  });

  it('submitting testimonial form calls handleSave (POST)', async () => {
    localStorage.setItem('adminUser', JSON.stringify({ username: 'admin' }));

    mockAuthFetch
      .mockResolvedValueOnce({ ok: true, json: async () => [] })              // initial load (empty)
      .mockResolvedValueOnce({ ok: true, json: async () => ({}) })             // POST
      .mockResolvedValueOnce({ ok: true, json: async () => [] });              // reload

    render(
      <MemoryRouter>
        <AdminCMS />
      </MemoryRouter>
    );

    await waitFor(() => expect(mockAuthFetch).toHaveBeenCalled());
    fireEvent.click(screen.getByRole('button', { name: /\+ Add Testimonial/i }));

    fireEvent.change(screen.getByPlaceholderText('Author Name'), {
      target: { value: 'New Author' },
    });
    fireEvent.change(screen.getByPlaceholderText('Testimonial Text'), {
      target: { value: 'Amazing foundation!' },
    });

    fireEvent.submit(screen.getByPlaceholderText('Author Name').closest('form')!);

    await waitFor(() =>
      expect(mockAuthFetch).toHaveBeenCalledWith(
        `${API_BASE_URL}/admin/cms/testimonials`,
        expect.objectContaining({ method: 'POST' })
      )
    );
  });

  it('switching to Social Media tab loads social-media content', async () => {
    localStorage.setItem('adminUser', JSON.stringify({ username: 'admin' }));
    const socialData = [
      { id: 'sm1', platform: 'Twitter', url: 'https://twitter.com', icon: '🐦', displayOrder: 1, active: true },
    ];

    mockAuthFetch
      .mockResolvedValueOnce({ ok: true, json: async () => testimonialData }) // initial testimonials
      .mockResolvedValueOnce({ ok: true, json: async () => socialData });     // social-media tab

    render(
      <MemoryRouter>
        <AdminCMS />
      </MemoryRouter>
    );

    await screen.findByText('Alice');
    fireEvent.click(screen.getByRole('button', { name: /Social Media/i }));

    await waitFor(() =>
      expect(mockAuthFetch).toHaveBeenCalledWith(`${API_BASE_URL}/admin/cms/social-media`)
    );
    expect(await screen.findByText('Twitter')).toBeInTheDocument();
  });

  it('switching to Carousel tab renders carousel content', async () => {
    localStorage.setItem('adminUser', JSON.stringify({ username: 'admin' }));
    const carouselData = [
      { id: 'c1', imageUrl: 'https://example.com/img.jpg', altText: 'Slide A', displayOrder: 1, active: true },
    ];

    mockAuthFetch
      .mockResolvedValueOnce({ ok: true, json: async () => testimonialData })
      .mockResolvedValueOnce({ ok: true, json: async () => carouselData });

    render(
      <MemoryRouter>
        <AdminCMS />
      </MemoryRouter>
    );

    await screen.findByText('Alice');
    fireEvent.click(screen.getByRole('button', { name: /Carousel/i }));

    await waitFor(() =>
      expect(mockAuthFetch).toHaveBeenCalledWith(`${API_BASE_URL}/admin/cms/carousel`)
    );
    expect(await screen.findByText('Slide A')).toBeInTheDocument();
  });

  it('clicking Add Stat in Statistics tab shows StatForm', async () => {
    localStorage.setItem('adminUser', JSON.stringify({ username: 'admin' }));

    mockAuthFetch
      .mockResolvedValueOnce({ ok: true, json: async () => testimonialData }) // testimonials
      .mockResolvedValueOnce({ ok: true, json: async () => statsData });      // stats

    render(
      <MemoryRouter>
        <AdminCMS />
      </MemoryRouter>
    );

    await screen.findByText('Alice');
    fireEvent.click(screen.getByRole('button', { name: /Statistics/i }));
    await screen.findByText('Impact');

    fireEvent.click(screen.getByRole('button', { name: /\+ Add Stat/i }));

    expect(screen.getByPlaceholderText('Stat Label')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Stat Value')).toBeInTheDocument();
  });

  it('clicking Add Link in Social Media tab shows SocialMediaForm', async () => {
    localStorage.setItem('adminUser', JSON.stringify({ username: 'admin' }));
    const socialData = [
      { id: 'sm2', platform: 'Facebook', url: 'https://facebook.com', icon: '📘', displayOrder: 1, active: true },
    ];

    mockAuthFetch
      .mockResolvedValueOnce({ ok: true, json: async () => testimonialData })
      .mockResolvedValueOnce({ ok: true, json: async () => socialData });

    render(
      <MemoryRouter>
        <AdminCMS />
      </MemoryRouter>
    );

    await screen.findByText('Alice');
    fireEvent.click(screen.getByRole('button', { name: /Social Media/i }));
    await screen.findByText('Facebook');

    fireEvent.click(screen.getByRole('button', { name: /\+ Add Link/i }));

    expect(screen.getByPlaceholderText('Platform (e.g., Facebook, Twitter)')).toBeInTheDocument();
  });

  it('clicking Add Image in Carousel tab shows CarouselForm', async () => {
    localStorage.setItem('adminUser', JSON.stringify({ username: 'admin' }));
    const carouselData2 = [
      { id: 'c2', imageUrl: 'https://example.com/b.jpg', altText: 'Slide B', displayOrder: 2, active: true },
    ];

    mockAuthFetch
      .mockResolvedValueOnce({ ok: true, json: async () => testimonialData })
      .mockResolvedValueOnce({ ok: true, json: async () => carouselData2 });

    render(
      <MemoryRouter>
        <AdminCMS />
      </MemoryRouter>
    );

    await screen.findByText('Alice');
    fireEvent.click(screen.getByRole('button', { name: /Carousel/i }));
    await screen.findByText('Slide B');

    fireEvent.click(screen.getByRole('button', { name: /\+ Add Image/i }));

    expect(screen.getByPlaceholderText('Image URL')).toBeInTheDocument();
  });

  it('triggers all StatForm onChange handlers', async () => {
    localStorage.setItem('adminUser', JSON.stringify({ username: 'admin' }));

    mockAuthFetch
      .mockResolvedValueOnce({ ok: true, json: async () => testimonialData })
      .mockResolvedValueOnce({ ok: true, json: async () => statsData });

    render(
      <MemoryRouter>
        <AdminCMS />
      </MemoryRouter>
    );

    await screen.findByText('Alice');
    fireEvent.click(screen.getByRole('button', { name: /Statistics/i }));
    await screen.findByText('Impact');
    fireEvent.click(screen.getByRole('button', { name: /\+ Add Stat/i }));

    // Fire all onChange handlers in StatForm
    fireEvent.change(screen.getByPlaceholderText('Stat Label'), { target: { value: 'Kids Helped' } });
    fireEvent.change(screen.getByPlaceholderText('Stat Value'), { target: { value: '500+' } });
    fireEvent.change(screen.getByPlaceholderText('Icon (emoji or text)'), { target: { value: '🌟' } });
    fireEvent.change(screen.getByPlaceholderText('Display Order'), { target: { value: '3' } });
    const activeCheckbox = screen.getAllByRole('checkbox')[0];
    fireEvent.change(activeCheckbox, { target: { checked: false } });

    expect((screen.getByPlaceholderText('Stat Label') as HTMLInputElement).value).toBe('Kids Helped');
  });

  it('triggers all SocialMediaForm onChange handlers', async () => {
    localStorage.setItem('adminUser', JSON.stringify({ username: 'admin' }));
    const socialData = [
      { id: 'sm3', platform: 'Instagram', url: 'https://instagram.com', icon: '📷', displayOrder: 1, active: true },
    ];

    mockAuthFetch
      .mockResolvedValueOnce({ ok: true, json: async () => testimonialData })
      .mockResolvedValueOnce({ ok: true, json: async () => socialData });

    render(
      <MemoryRouter>
        <AdminCMS />
      </MemoryRouter>
    );

    await screen.findByText('Alice');
    fireEvent.click(screen.getByRole('button', { name: /Social Media/i }));
    await screen.findByText('Instagram');
    fireEvent.click(screen.getByRole('button', { name: /\+ Add Link/i }));

    // Fire all onChange handlers in SocialMediaForm
    fireEvent.change(screen.getByPlaceholderText('Platform (e.g., Facebook, Twitter)'), { target: { value: 'YouTube' } });
    fireEvent.change(screen.getByPlaceholderText('URL'), { target: { value: 'https://youtube.com' } });
    fireEvent.change(screen.getByPlaceholderText('Icon (emoji or symbol)'), { target: { value: '▶' } });
    fireEvent.change(screen.getByPlaceholderText('Display Order'), { target: { value: '2' } });
    const activeCheckbox = screen.getAllByRole('checkbox')[0];
    fireEvent.change(activeCheckbox, { target: { checked: false } });

    expect((screen.getByPlaceholderText('Platform (e.g., Facebook, Twitter)') as HTMLInputElement).value).toBe('YouTube');
  });

  it('triggers all CarouselForm onChange handlers', async () => {
    localStorage.setItem('adminUser', JSON.stringify({ username: 'admin' }));
    const carouselData3 = [
      { id: 'c3', imageUrl: 'https://example.com/c.jpg', altText: 'Slide C', displayOrder: 3, active: true },
    ];

    mockAuthFetch
      .mockResolvedValueOnce({ ok: true, json: async () => testimonialData })
      .mockResolvedValueOnce({ ok: true, json: async () => carouselData3 });

    render(
      <MemoryRouter>
        <AdminCMS />
      </MemoryRouter>
    );

    await screen.findByText('Alice');
    fireEvent.click(screen.getByRole('button', { name: /Carousel/i }));
    await screen.findByText('Slide C');
    fireEvent.click(screen.getByRole('button', { name: /\+ Add Image/i }));

    // Fire all onChange handlers in CarouselForm
    fireEvent.change(screen.getByPlaceholderText('Image URL'), { target: { value: 'https://example.com/new.jpg' } });
    fireEvent.change(screen.getByPlaceholderText('Alt Text'), { target: { value: 'New slide' } });
    fireEvent.change(screen.getByPlaceholderText('Display Order'), { target: { value: '5' } });
    const activeCheckbox = screen.getAllByRole('checkbox')[0];
    fireEvent.change(activeCheckbox, { target: { checked: false } });

    expect((screen.getByPlaceholderText('Image URL') as HTMLInputElement).value).toBe('https://example.com/new.jpg');
  });

  it('triggers TestimonialForm onChange handlers', async () => {
    localStorage.setItem('adminUser', JSON.stringify({ username: 'admin' }));

    mockAuthFetch.mockResolvedValueOnce({ ok: true, json: async () => [] }); // empty testimonials

    render(
      <MemoryRouter>
        <AdminCMS />
      </MemoryRouter>
    );

    await waitFor(() => expect(mockAuthFetch).toHaveBeenCalled());
    fireEvent.click(screen.getByRole('button', { name: /\+ Add Testimonial/i }));

    // Fire all onChange handlers
    fireEvent.change(screen.getByPlaceholderText('Author Name'), { target: { value: 'Jane' } });
    fireEvent.change(screen.getByPlaceholderText('Author Title'), { target: { value: 'Volunteer' } });
    fireEvent.change(screen.getByPlaceholderText('Testimonial Text'), { target: { value: 'Wonderful!' } });
    fireEvent.change(screen.getByPlaceholderText('Display Order'), { target: { value: '2' } });
    const activeCheckbox = screen.getAllByRole('checkbox')[0];
    fireEvent.change(activeCheckbox, { target: { checked: false } });

    expect((screen.getByPlaceholderText('Author Name') as HTMLInputElement).value).toBe('Jane');
  });

  it('submits StatForm to call handleSave (POST)', async () => {
    localStorage.setItem('adminUser', JSON.stringify({ username: 'admin' }));

    mockAuthFetch
      .mockResolvedValueOnce({ ok: true, json: async () => testimonialData })
      .mockResolvedValueOnce({ ok: true, json: async () => [] })  // stats (empty)
      .mockResolvedValueOnce({ ok: true, json: async () => ({}) }) // POST
      .mockResolvedValueOnce({ ok: true, json: async () => [] }); // reload

    render(
      <MemoryRouter>
        <AdminCMS />
      </MemoryRouter>
    );

    await screen.findByText('Alice');
    fireEvent.click(screen.getByRole('button', { name: /Statistics/i }));
    await waitFor(() => expect(mockAuthFetch).toHaveBeenCalledWith(`${API_BASE_URL}/admin/cms/stats`));

    fireEvent.click(screen.getByRole('button', { name: /\+ Add Stat/i }));

    fireEvent.change(screen.getByPlaceholderText('Stat Label'), { target: { value: 'Schools Built' } });
    fireEvent.change(screen.getByPlaceholderText('Stat Value'), { target: { value: '42' } });

    fireEvent.submit(screen.getByPlaceholderText('Stat Label').closest('form')!);

    await waitFor(() =>
      expect(mockAuthFetch).toHaveBeenCalledWith(
        `${API_BASE_URL}/admin/cms/stats`,
        expect.objectContaining({ method: 'POST' })
      )
    );
  });

  it('submits SocialMediaForm to call handleSave (POST)', async () => {
    localStorage.setItem('adminUser', JSON.stringify({ username: 'admin' }));

    mockAuthFetch
      .mockResolvedValueOnce({ ok: true, json: async () => testimonialData })
      .mockResolvedValueOnce({ ok: true, json: async () => [] })  // social (empty)
      .mockResolvedValueOnce({ ok: true, json: async () => ({}) }) // POST
      .mockResolvedValueOnce({ ok: true, json: async () => [] }); // reload

    render(
      <MemoryRouter>
        <AdminCMS />
      </MemoryRouter>
    );

    await screen.findByText('Alice');
    fireEvent.click(screen.getByRole('button', { name: /Social Media/i }));
    await waitFor(() => expect(mockAuthFetch).toHaveBeenCalledWith(`${API_BASE_URL}/admin/cms/social-media`));

    fireEvent.click(screen.getByRole('button', { name: /\+ Add Link/i }));

    fireEvent.change(screen.getByPlaceholderText('Platform (e.g., Facebook, Twitter)'), { target: { value: 'LinkedIn' } });
    fireEvent.change(screen.getByPlaceholderText('URL'), { target: { value: 'https://linkedin.com' } });
    fireEvent.change(screen.getByPlaceholderText('Icon (emoji or symbol)'), { target: { value: '💼' } });

    fireEvent.submit(screen.getByPlaceholderText('Platform (e.g., Facebook, Twitter)').closest('form')!);

    await waitFor(() =>
      expect(mockAuthFetch).toHaveBeenCalledWith(
        `${API_BASE_URL}/admin/cms/social-media`,
        expect.objectContaining({ method: 'POST' })
      )
    );
  });

  it('submits CarouselForm to call handleSave (POST)', async () => {
    localStorage.setItem('adminUser', JSON.stringify({ username: 'admin' }));

    mockAuthFetch
      .mockResolvedValueOnce({ ok: true, json: async () => testimonialData })
      .mockResolvedValueOnce({ ok: true, json: async () => [] })  // carousel (empty)
      .mockResolvedValueOnce({ ok: true, json: async () => ({}) }) // POST
      .mockResolvedValueOnce({ ok: true, json: async () => [] }); // reload

    render(
      <MemoryRouter>
        <AdminCMS />
      </MemoryRouter>
    );

    await screen.findByText('Alice');
    fireEvent.click(screen.getByRole('button', { name: /Carousel/i }));
    await waitFor(() => expect(mockAuthFetch).toHaveBeenCalledWith(`${API_BASE_URL}/admin/cms/carousel`));

    fireEvent.click(screen.getByRole('button', { name: /\+ Add Image/i }));

    fireEvent.change(screen.getByPlaceholderText('Image URL'), { target: { value: 'https://example.com/slide.jpg' } });

    fireEvent.submit(screen.getByPlaceholderText('Image URL').closest('form')!);

    await waitFor(() =>
      expect(mockAuthFetch).toHaveBeenCalledWith(
        `${API_BASE_URL}/admin/cms/carousel`,
        expect.objectContaining({ method: 'POST' })
      )
    );
  });

  it('clicking Edit on a social media item puts it in edit mode (covers editingId functions)', async () => {
    localStorage.setItem('adminUser', JSON.stringify({ username: 'admin' }));
    const socialData = [
      { id: 'sm-edit', platform: 'YouTube', url: 'https://youtube.com', icon: '▶', displayOrder: 1, active: true },
    ];

    mockAuthFetch
      .mockResolvedValueOnce({ ok: true, json: async () => testimonialData })
      .mockResolvedValueOnce({ ok: true, json: async () => socialData });

    render(
      <MemoryRouter>
        <AdminCMS />
      </MemoryRouter>
    );

    await screen.findByText('Alice');
    fireEvent.click(screen.getByRole('button', { name: /Social Media/i }));
    await screen.findByText('YouTube');

    // Click the Edit button on the existing social media item to set editingId
    const editBtn = screen.getByRole('button', { name: /^Edit$/i });
    fireEvent.click(editBtn);

    // Now the SocialMediaForm should render in edit mode (editingId === social.id)
    // This covers the inline arrow functions: onSave={(data) => handleSave(data, social.id)} and onCancel={() => setEditingId(null)}
    expect(screen.getByPlaceholderText('Platform (e.g., Facebook, Twitter)')).toBeInTheDocument();

    // Click cancel to trigger onCancel={() => setEditingId(null)}
    fireEvent.click(screen.getByRole('button', { name: /Cancel/i }));
    await waitFor(() => expect(screen.getByText('YouTube')).toBeInTheDocument());
  });

  it('clicking Edit on a carousel item puts it in edit mode (covers editingId functions)', async () => {
    localStorage.setItem('adminUser', JSON.stringify({ username: 'admin' }));
    const carouselData = [
      { id: 'car-edit', imageUrl: 'https://example.com/edit.jpg', altText: 'Edit Slide', displayOrder: 1, active: true },
    ];

    mockAuthFetch
      .mockResolvedValueOnce({ ok: true, json: async () => testimonialData })
      .mockResolvedValueOnce({ ok: true, json: async () => carouselData });

    render(
      <MemoryRouter>
        <AdminCMS />
      </MemoryRouter>
    );

    await screen.findByText('Alice');
    fireEvent.click(screen.getByRole('button', { name: /Carousel/i }));
    await screen.findByText('Edit Slide');

    // Click Edit on the existing carousel item to set editingId
    const editBtn = screen.getByRole('button', { name: /^Edit$/i });
    fireEvent.click(editBtn);

    // CarouselForm renders in edit mode — covers onSave={(data) => handleSave(data, image.id)} and onCancel={() => setEditingId(null)}
    expect(screen.getByPlaceholderText('Image URL')).toBeInTheDocument();

    // Click cancel to trigger onCancel
    fireEvent.click(screen.getByRole('button', { name: /Cancel/i }));
    await waitFor(() => expect(screen.getByText('Edit Slide')).toBeInTheDocument());
  });
});
