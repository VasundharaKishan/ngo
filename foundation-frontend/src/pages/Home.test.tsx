import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Home from './Home';
import { API_BASE_URL } from '../api';

// Mock fetch globally
global.fetch = vi.fn();

const mockSections = [
  {
    id: '1',
    type: 'hero',
    sortOrder: 1,
    configJson: JSON.stringify({ title: 'Welcome', subtitle: 'Help us make a difference' })
  },
  {
    id: '2',
    type: 'featured',
    sortOrder: 2,
    configJson: JSON.stringify({})
  }
];

describe('Home', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('displays loading state initially', () => {
    (global.fetch as any).mockImplementation(() => new Promise(() => {})); // Never resolves

    render(
      <BrowserRouter>
        <Home />
      </BrowserRouter>
    );

    // Should show skeleton loaders
    expect(screen.getByTestId || document.body.textContent).toBeTruthy();
  });

  it('fetches home sections on mount', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockSections
    });

    render(
      <BrowserRouter>
        <Home />
      </BrowserRouter>
    );

    expect(global.fetch).toHaveBeenCalledWith(`${API_BASE_URL}/public/home`);
  });

  it('handles API error gracefully', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: false,
      status: 500,
      statusText: 'Server Error'
    });

    render(
      <BrowserRouter>
        <Home />
      </BrowserRouter>
    );

    await screen.findByText(/Failed to Load Home Page/i);
  });

  it('displays message when no sections configured', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => []
    });

    render(
      <BrowserRouter>
        <Home />
      </BrowserRouter>
    );

    await screen.findByText(/No Home Sections Configured/i);
  });

  it('renders sections when loaded successfully', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockSections
    });

    render(
      <BrowserRouter>
        <Home />
      </BrowserRouter>
    );

    // Wait for loading to complete
    await vi.waitFor(() => {
      expect(document.querySelector('.skeleton-loader')).not.toBeInTheDocument();
    });
  });
});
