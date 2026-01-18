import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import AdminUsers from './AdminUsers';

const mockAuthFetch = vi.fn();
const mockToast = vi.fn();

vi.mock('../utils/auth', () => ({
  authFetch: (...args: any[]) => mockAuthFetch(...args),
}));

vi.mock('../components/ToastProvider', () => ({
  useToast: () => mockToast,
}));

const userList = [
  { id: '1', username: 'admin', email: 'admin@example.com', fullName: 'Admin User', role: 'ADMIN', active: true, createdAt: '' },
  { id: '2', username: 'operator', email: 'op@example.com', fullName: 'Op User', role: 'OPERATOR', active: true, createdAt: '' },
];

describe('AdminUsers', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    localStorage.setItem('adminUser', JSON.stringify({ username: 'admin' }));
  });

  it('loads and renders users', async () => {
    mockAuthFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => userList,
    });

    render(<AdminUsers />);

    await waitFor(() => {
      expect(screen.getByText('Admin User')).toBeInTheDocument();
      expect(screen.getByText('Op User')).toBeInTheDocument();
    });
    expect(mockAuthFetch).toHaveBeenCalledWith(expect.stringMatching(/\/admin\/users$/));
  });

  it('creates a new user via form', async () => {
    mockAuthFetch
      // initial load
      .mockResolvedValueOnce({ ok: true, json: async () => userList })
      // create call
      .mockResolvedValueOnce({ ok: true, json: async () => ({}) })
      // reload after create
      .mockResolvedValueOnce({ ok: true, json: async () => userList });

    render(<AdminUsers />);

    await screen.findByText('Admin User');

    fireEvent.click(screen.getByRole('button', { name: /\+ Add New User/i }));
    const inputs = screen.getAllByRole('textbox');
    fireEvent.change(inputs[0], { target: { value: 'newuser' } });
    fireEvent.change(inputs[1], { target: { value: 'new@example.com' } });
    fireEvent.change(inputs[2], { target: { value: 'New User' } });
    fireEvent.click(screen.getByRole('checkbox', { name: /active account/i }));
    fireEvent.click(screen.getByRole('button', { name: /Create User/i }));

    await waitFor(() => {
      expect(mockAuthFetch).toHaveBeenCalledWith(expect.stringMatching(/\/admin\/users$/), expect.objectContaining({ method: 'POST' }));
    });
    expect(mockAuthFetch).toHaveBeenCalledTimes(3);
  });
});
