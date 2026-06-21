import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import ResetPassword from './ResetPassword';
import { API_BASE_URL } from '../api';

const mockNavigate = vi.fn();

vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useSearchParams: () => [new URLSearchParams('token=valid-reset-token')],
  };
});

function renderPage() {
  return render(
    <HelmetProvider>
      <MemoryRouter>
        <ResetPassword />
      </MemoryRouter>
    </HelmetProvider>,
  );
}

describe('ResetPassword', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('shows loading state while validating token', () => {
    (fetch as ReturnType<typeof vi.fn>).mockReturnValueOnce(new Promise(() => {}));
    renderPage();
    expect(screen.getByText('Validating reset link...')).toBeInTheDocument();
  });

  it('shows reset form when token is valid', async () => {
    (fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ valid: true }),
    });

    renderPage();

    await waitFor(() => {
      expect(screen.getByTestId('reset-password-password')).toBeInTheDocument();
      expect(screen.getByTestId('reset-password-confirm')).toBeInTheDocument();
      expect(screen.getByTestId('reset-password-submit')).toBeInTheDocument();
    });
  });

  it('shows error for invalid token', async () => {
    (fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ valid: false, message: 'Token expired' }),
    });

    renderPage();

    await waitFor(() => {
      expect(screen.getByTestId('reset-password-error')).toHaveTextContent('Token expired');
    });
  });

  it('shows password requirements', async () => {
    (fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ valid: true }),
    });

    renderPage();

    await waitFor(() => {
      expect(screen.getByText('At least 8 characters')).toBeInTheDocument();
      expect(screen.getByText('At least 1 uppercase letter')).toBeInTheDocument();
      expect(screen.getByText('At least 1 lowercase letter')).toBeInTheDocument();
      expect(screen.getByText('At least 1 digit')).toBeInTheDocument();
      expect(screen.getByText('Passwords match')).toBeInTheDocument();
    });
  });

  it('disables submit when requirements not met', async () => {
    (fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ valid: true }),
    });

    renderPage();

    await waitFor(() => {
      expect(screen.getByTestId('reset-password-submit')).toBeDisabled();
    });
  });

  it('enables submit when all requirements met', async () => {
    (fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ valid: true }),
    });

    renderPage();

    await waitFor(() => screen.getByTestId('reset-password-password'));

    fireEvent.change(screen.getByTestId('reset-password-password'), {
      target: { value: 'ValidPass1' },
    });
    fireEvent.change(screen.getByTestId('reset-password-confirm'), {
      target: { value: 'ValidPass1' },
    });

    expect(screen.getByTestId('reset-password-submit')).not.toBeDisabled();
  });

  it('submits successfully and shows success message', async () => {
    (fetch as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ valid: true }) })
      .mockResolvedValueOnce({ ok: true });

    renderPage();

    await waitFor(() => screen.getByTestId('reset-password-password'));

    fireEvent.change(screen.getByTestId('reset-password-password'), {
      target: { value: 'NewPass123' },
    });
    fireEvent.change(screen.getByTestId('reset-password-confirm'), {
      target: { value: 'NewPass123' },
    });
    fireEvent.click(screen.getByTestId('reset-password-submit'));

    await waitFor(() => {
      expect(screen.getByTestId('reset-password-success')).toBeInTheDocument();
    });

    expect(fetch).toHaveBeenCalledWith(
      `${API_BASE_URL}/auth/reset-password/valid-reset-token`,
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ password: 'NewPass123' }),
      }),
    );
  });

  it('shows error on failed reset', async () => {
    (fetch as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ valid: true }) })
      .mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve({ error: 'Token already used' }),
      });

    renderPage();

    await waitFor(() => screen.getByTestId('reset-password-password'));

    fireEvent.change(screen.getByTestId('reset-password-password'), {
      target: { value: 'NewPass123' },
    });
    fireEvent.change(screen.getByTestId('reset-password-confirm'), {
      target: { value: 'NewPass123' },
    });
    fireEvent.click(screen.getByTestId('reset-password-submit'));

    await waitFor(() => {
      expect(screen.getByTestId('reset-password-error')).toHaveTextContent('Token already used');
    });
  });

  it('shows error when token validation fails due to network', async () => {
    (fetch as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new Error('Network error'));

    renderPage();

    await waitFor(() => {
      expect(screen.getByTestId('reset-password-error')).toHaveTextContent('Failed to validate reset link');
    });
  });
});
