import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import ForgotPassword from './ForgotPassword';
import { API_BASE_URL } from '../api';

function renderPage() {
  return render(
    <HelmetProvider>
      <MemoryRouter>
        <ForgotPassword />
      </MemoryRouter>
    </HelmetProvider>,
  );
}

describe('ForgotPassword', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders the forgot password form', () => {
    renderPage();
    expect(screen.getByTestId('forgot-password-page')).toBeInTheDocument();
    expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
    expect(screen.getByTestId('forgot-password-submit')).toHaveTextContent('Send Reset Link');
  });

  it('submits email and shows success message', async () => {
    (fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({ ok: true });

    renderPage();

    fireEvent.change(screen.getByTestId('forgot-password-email'), {
      target: { value: 'user@example.com' },
    });
    fireEvent.click(screen.getByTestId('forgot-password-submit'));

    await waitFor(() => {
      expect(screen.getByTestId('forgot-password-success')).toBeInTheDocument();
    });

    expect(fetch).toHaveBeenCalledWith(
      `${API_BASE_URL}/auth/forgot-password`,
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ email: 'user@example.com' }),
      }),
    );
  });

  it('shows error on non-ok response', async () => {
    (fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: false,
      json: () => Promise.resolve({ error: 'User not found' }),
    });

    renderPage();

    fireEvent.change(screen.getByTestId('forgot-password-email'), {
      target: { value: 'bad@example.com' },
    });
    fireEvent.click(screen.getByTestId('forgot-password-submit'));

    await waitFor(() => {
      expect(screen.getByTestId('forgot-password-error')).toHaveTextContent('User not found');
    });
  });

  it('shows connection error on network failure', async () => {
    (fetch as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new Error('Network error'));

    renderPage();

    fireEvent.change(screen.getByTestId('forgot-password-email'), {
      target: { value: 'user@example.com' },
    });
    fireEvent.click(screen.getByTestId('forgot-password-submit'));

    await waitFor(() => {
      expect(screen.getByTestId('forgot-password-error')).toHaveTextContent('Connection error');
    });
  });

  it('disables button while loading', async () => {
    let resolveRequest: (value: unknown) => void;
    (fetch as ReturnType<typeof vi.fn>).mockReturnValueOnce(
      new Promise((resolve) => { resolveRequest = resolve; }),
    );

    renderPage();

    fireEvent.change(screen.getByTestId('forgot-password-email'), {
      target: { value: 'user@example.com' },
    });
    fireEvent.click(screen.getByTestId('forgot-password-submit'));

    expect(screen.getByTestId('forgot-password-submit')).toBeDisabled();
    expect(screen.getByTestId('forgot-password-submit')).toHaveTextContent('Sending...');

    resolveRequest!({ ok: true });

    await waitFor(() => {
      expect(screen.getByTestId('forgot-password-success')).toBeInTheDocument();
    });
  });

  it('has a back to login link', () => {
    renderPage();
    const link = screen.getByText(/back to login/i);
    expect(link).toBeInTheDocument();
    expect(link.closest('a')).toHaveAttribute('href', '/admin/login');
  });
});
