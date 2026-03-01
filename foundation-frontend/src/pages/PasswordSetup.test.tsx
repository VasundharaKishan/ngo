import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import PasswordSetup from './PasswordSetup';
import { API_BASE_URL } from '../api';

const mockNavigate = vi.fn();
const mockShowToast = vi.fn();

vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useSearchParams: () => [new URLSearchParams('token=setup-token-abc')],
  };
});

vi.mock('../components/ToastProvider', () => ({
  useToast: () => mockShowToast,
}));

describe('PasswordSetup', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn();
  });

  it('loads token validation and security questions on mount', async () => {
    (global.fetch as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ valid: true, username: 'newuser', email: 'new@example.com', fullName: 'New User' }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => [
          { id: '1', question: 'What is your mother\'s maiden name?' },
          { id: '2', question: 'What city were you born in?' },
        ],
      });

    render(
      <MemoryRouter>
        <PasswordSetup />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/complete your account setup/i)).toBeInTheDocument();
      expect(screen.getByText('New User')).toBeInTheDocument();
    });

    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining(`/auth/validate-token/setup-token-abc`)
    );
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining(`/auth/security-questions`)
    );
  });

  it('shows error for invalid token', async () => {
    (global.fetch as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ valid: false, message: 'Token has expired' }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => [],
      });

    render(
      <MemoryRouter>
        <PasswordSetup />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/token has expired/i)).toBeInTheDocument();
    });
  });

  it('shows validation error when passwords do not match', async () => {
    (global.fetch as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ valid: true, username: 'user', email: 'u@example.com', fullName: 'User' }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => [{ id: '1', question: 'What city were you born in?' }],
      });

    render(
      <MemoryRouter>
        <PasswordSetup />
      </MemoryRouter>
    );

    await waitFor(() => screen.getByText(/complete your account setup/i));

    fireEvent.change(screen.getByPlaceholderText(/enter secure password/i), { target: { value: 'password123' } });
    fireEvent.change(screen.getByPlaceholderText(/re-enter your password/i), { target: { value: 'mismatch456' } });
    fireEvent.submit(document.querySelector('form') as HTMLElement);

    await waitFor(() => {
      expect(screen.getByText(/passwords do not match/i)).toBeInTheDocument();
    });
  });

  it('submits password setup successfully', async () => {
    (global.fetch as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ valid: true, username: 'user', email: 'u@example.com', fullName: 'User' }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => [
          { id: '1', question: 'What city were you born in?' },
          { id: '2', question: 'What is your mother\'s maiden name?' },
        ],
      })
      .mockResolvedValueOnce({ ok: true, json: async () => ({}) });

    render(
      <MemoryRouter>
        <PasswordSetup />
      </MemoryRouter>
    );

    await waitFor(() => screen.getByText(/complete your account setup/i));

    fireEvent.change(screen.getByPlaceholderText(/enter secure password/i), { target: { value: 'strongpassword1' } });
    fireEvent.change(screen.getByPlaceholderText(/re-enter your password/i), { target: { value: 'strongpassword1' } });

    const selects = screen.getAllByRole('combobox');
    fireEvent.change(selects[0], { target: { value: '1' } });
    fireEvent.change(selects[1], { target: { value: '2' } });
    const answerInputs = screen.getAllByPlaceholderText(/enter your answer/i);
    fireEvent.change(answerInputs[0], { target: { value: 'New York' } });
    fireEvent.change(answerInputs[1], { target: { value: 'Smith' } });

    fireEvent.submit(document.querySelector('form')!);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/auth/setup-password'),
        expect.objectContaining({ method: 'POST' })
      );
    }, { timeout: 3000 });
  });
});
