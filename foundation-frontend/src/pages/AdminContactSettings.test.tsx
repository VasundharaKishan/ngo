import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import AdminContactSettings from './AdminContactSettings';
import { API_BASE_URL } from '../api';

const mockAuthFetch = vi.fn();
const mockToast = vi.fn();

vi.mock('../utils/auth', () => ({
  authFetch: (...args: unknown[]) => mockAuthFetch(...args),
}));

vi.mock('../components/ToastProvider', () => ({
  useToast: () => mockToast,
}));

const sampleContact = {
  email: 'admin@example.com',
  locations: [
    {
      label: 'Ireland',
      lines: ['Street 1', 'City'],
      postalLabel: 'Eircode',
      postalCode: 'W91PR6F',
      mobile: '+353 899540707',
    },
  ],
};

const renderWithRouter = () =>
  render(
    <MemoryRouter initialEntries={['/admin/contact']}>
      <Routes>
        <Route path="/admin/contact" element={<AdminContactSettings />} />
        <Route path="/admin/login" element={<div>Login Page</div>} />
      </Routes>
    </MemoryRouter>
  );

describe('AdminContactSettings', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    localStorage.clear();
  });

  it('redirects to login when no token is present', async () => {
    renderWithRouter();

    expect(await screen.findByText('Login Page')).toBeInTheDocument();
    expect(mockAuthFetch).not.toHaveBeenCalled();
  });

  it('loads and saves contact information through the admin endpoint', async () => {
    localStorage.setItem('adminToken', 'test-token');

    const updatedEmail = 'new@example.com';

    mockAuthFetch
      .mockResolvedValueOnce({ json: async () => sampleContact }) // Initial GET
      .mockResolvedValueOnce({ json: async () => ({}) }) // PUT
      .mockResolvedValueOnce({ json: async () => ({ ...sampleContact, email: updatedEmail }) }); // Refresh GET

    renderWithRouter();

    expect(await screen.findByDisplayValue(sampleContact.email)).toBeInTheDocument();
    expect(mockAuthFetch).toHaveBeenCalledWith(`${API_BASE_URL}/admin/config/contact`);

    const emailInput = screen.getByPlaceholderText('contact@example.com');
    fireEvent.change(emailInput, { target: { value: updatedEmail } });

    fireEvent.click(screen.getByRole('button', { name: 'Save Contact Information' }));

    await waitFor(() =>
      expect(mockToast).toHaveBeenCalledWith('Contact information saved successfully', 'success')
    );

    expect(mockAuthFetch).toHaveBeenCalledTimes(3);

    const [, putCallOptions] = mockAuthFetch.mock.calls[1];
    const requestBody = JSON.parse((putCallOptions as RequestInit).body as string);
    expect(requestBody.email).toBe(updatedEmail);
    expect(requestBody.locations[0].label).toBe(sampleContact.locations[0].label);

    expect(mockAuthFetch.mock.calls[2][0]).toBe(`${API_BASE_URL}/admin/config/contact`);
  });
});
