import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import ContactPage from './ContactPage';
import { API_BASE_URL } from '../api';

vi.mock('../contexts/ConfigContext', () => ({
  useSiteName: () => 'Test Foundation',
  useSiteLogo: () => 'https://example.com/logo.png',
}));

vi.mock('../utils/contactApi', () => ({
  fetchContactInfo: () =>
    Promise.resolve({
      email: 'info@foundation.org',
      locations: [
        { label: 'HQ', lines: ['123 Main St'], postalLabel: 'ZIP', postalCode: '10001', mobile: '+1-555-0100' },
      ],
    }),
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, fallback?: string) => fallback || key,
  }),
}));

function renderPage(searchParams = '') {
  return render(
    <HelmetProvider>
      <MemoryRouter initialEntries={[`/contact${searchParams}`]}>
        <ContactPage />
      </MemoryRouter>
    </HelmetProvider>,
  );
}

describe('ContactPage', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
    (fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ enabled: false }),
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders the contact form', async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByTestId('contact-form')).toBeInTheDocument();
    });
  });

  it('shows validation errors for empty required fields', async () => {
    renderPage();
    await waitFor(() => screen.getByTestId('contact-form'));

    fireEvent.click(screen.getByRole('button', { name: /contact\.send/i }));

    await waitFor(() => {
      expect(screen.getAllByRole('alert').length).toBeGreaterThanOrEqual(4);
    });
  });

  it('shows error for invalid email format', async () => {
    renderPage();
    await waitFor(() => screen.getByTestId('contact-form'));

    fireEvent.change(screen.getByLabelText(/contact\.name/i), { target: { value: 'Test User' } });
    fireEvent.change(screen.getByLabelText(/contact\.emailField/i), { target: { value: 'not-an-email' } });
    fireEvent.change(screen.getByLabelText(/contact\.subject/i), { target: { value: 'general' } });
    fireEvent.change(screen.getByLabelText(/contact\.message/i), {
      target: { value: 'This is a test message that is long enough.' },
    });

    fireEvent.click(screen.getByRole('button', { name: /contact\.send/i }));

    await waitFor(() => {
      expect(screen.getByText('contact.validation.emailInvalid')).toBeInTheDocument();
    });
  });

  it('shows error for message shorter than 20 chars', async () => {
    renderPage();
    await waitFor(() => screen.getByTestId('contact-form'));

    fireEvent.change(screen.getByLabelText(/contact\.name/i), { target: { value: 'Test' } });
    fireEvent.change(screen.getByLabelText(/contact\.emailField/i), { target: { value: 'a@b.com' } });
    fireEvent.change(screen.getByLabelText(/contact\.subject/i), { target: { value: 'general' } });
    fireEvent.change(screen.getByLabelText(/contact\.message/i), { target: { value: 'Short' } });

    fireEvent.click(screen.getByRole('button', { name: /contact\.send/i }));

    await waitFor(() => {
      expect(screen.getByText('contact.validation.messageTooShort')).toBeInTheDocument();
    });
  });

  it('submits successfully and shows success message', async () => {
    (fetch as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ enabled: false }) })
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ success: true }) });

    renderPage();
    await waitFor(() => screen.getByTestId('contact-form'));

    fireEvent.change(screen.getByLabelText(/contact\.name/i), { target: { value: 'Test User' } });
    fireEvent.change(screen.getByLabelText(/contact\.emailField/i), { target: { value: 'test@example.com' } });
    fireEvent.change(screen.getByLabelText(/contact\.subject/i), { target: { value: 'general' } });
    fireEvent.change(screen.getByLabelText(/contact\.message/i), {
      target: { value: 'This is a valid test message for submission.' },
    });

    fireEvent.click(screen.getByRole('button', { name: /contact\.send/i }));

    await waitFor(() => {
      expect(screen.getByTestId('contact-success')).toBeInTheDocument();
    });
  });

  it('shows error message on submission failure', async () => {
    (fetch as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ enabled: false }) })
      .mockResolvedValueOnce({ ok: false, status: 500, json: () => Promise.resolve({ message: 'Server error' }) });

    renderPage();
    await waitFor(() => screen.getByTestId('contact-form'));

    fireEvent.change(screen.getByLabelText(/contact\.name/i), { target: { value: 'Test' } });
    fireEvent.change(screen.getByLabelText(/contact\.emailField/i), { target: { value: 'test@example.com' } });
    fireEvent.change(screen.getByLabelText(/contact\.subject/i), { target: { value: 'general' } });
    fireEvent.change(screen.getByLabelText(/contact\.message/i), {
      target: { value: 'This is a valid test message for submission.' },
    });

    fireEvent.click(screen.getByRole('button', { name: /contact\.send/i }));

    await waitFor(() => {
      expect(screen.getByText('Server error')).toBeInTheDocument();
    });
  });

  it('displays contact info from API', async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByText('info@foundation.org')).toBeInTheDocument();
      expect(screen.getByText('HQ')).toBeInTheDocument();
    });
  });

  it('shows character count', async () => {
    renderPage();
    await waitFor(() => screen.getByTestId('contact-form'));
    expect(screen.getByText('0 / 8000')).toBeInTheDocument();
  });
});
