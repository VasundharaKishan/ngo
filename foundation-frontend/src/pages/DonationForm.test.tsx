import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import DonationForm from './DonationForm';

const mockGetCampaign = vi.fn();
const mockCreateStripeSession = vi.fn();

vi.mock('../api', async () => {
  const actual = await vi.importActual('../api');
  return {
    ...actual,
    api: {
      ...actual.api,
      getCampaign: (...args: unknown[]) => mockGetCampaign(...args),
      createStripeSession: (...args: unknown[]) => mockCreateStripeSession(...args),
    },
  };
});

describe('DonationForm', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    delete (window as any).location;
    (window as any).location = { href: '' };
  });

  const renderWithRoute = () =>
    render(
      <MemoryRouter initialEntries={['/donate/123']}>
        <Routes>
          <Route path="/donate/:campaignId" element={<DonationForm />} />
        </Routes>
      </MemoryRouter>
    );

  it('walks through steps and submits payment', async () => {
    mockGetCampaign.mockResolvedValueOnce({
      id: '123',
      title: 'Clean Water',
      active: true,
      categoryIcon: '💧',
    });
    mockCreateStripeSession.mockResolvedValueOnce({ url: 'http://checkout.test' });

    renderWithRoute();

    expect(await screen.findByText(/Make a Donation/)).toBeInTheDocument();

    // Step 1 -> Step 2
    fireEvent.click(screen.getByRole('button', { name: /Continue to Your Information/ }));

    // Fill personal info
    fireEvent.change(screen.getByPlaceholderText(/John Doe/i), { target: { value: 'Alice' } });
    fireEvent.change(screen.getByPlaceholderText(/john@example.com/i), { target: { value: 'alice@example.com' } });
    fireEvent.click(screen.getByRole('button', { name: /Continue to Payment/ }));

    // Submit payment
    fireEvent.click(screen.getByRole('button', { name: /Proceed to Secure Payment/ }));

    await waitFor(() => expect(mockCreateStripeSession).toHaveBeenCalled());
    expect((window as any).location.href).toBe('http://checkout.test');
  });

  it('shows validation errors when amount or info missing', async () => {
    mockGetCampaign.mockResolvedValueOnce({ id: 'c', title: 'Test', active: true });
    renderWithRoute();

    // Try to advance with default amount 500 (valid) but skip name/email; should error
    fireEvent.click(await screen.findByRole('button', { name: /Continue to Your Information/ }));
    fireEvent.click(screen.getByRole('button', { name: /Continue to Payment/ }));

    expect(await screen.findByText(/Please provide your name and email/)).toBeInTheDocument();
  });
});
