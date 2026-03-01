import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import CookieConsent from './CookieConsent';

const CONSENT_KEY = 'cookie_consent';

describe('CookieConsent', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    localStorage.clear();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('does not show banner if consent already accepted', () => {
    localStorage.setItem(CONSENT_KEY, 'accepted');
    const { container } = render(<MemoryRouter><CookieConsent /></MemoryRouter>);
    act(() => { vi.advanceTimersByTime(2000); });
    expect(container.querySelector('[role="dialog"]')).toBeNull();
  });

  it('does not show banner if consent already declined', () => {
    localStorage.setItem(CONSENT_KEY, 'declined');
    const { container } = render(<MemoryRouter><CookieConsent /></MemoryRouter>);
    act(() => { vi.advanceTimersByTime(2000); });
    expect(container.querySelector('[role="dialog"]')).toBeNull();
  });

  it('shows banner after 1 second delay when no consent stored', async () => {
    const { container } = render(<MemoryRouter><CookieConsent /></MemoryRouter>);
    expect(container.querySelector('[role="dialog"]')).toBeNull();
    act(() => { vi.advanceTimersByTime(1000); });
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('accepts cookies and hides banner', () => {
    const { container } = render(<MemoryRouter><CookieConsent /></MemoryRouter>);
    act(() => { vi.advanceTimersByTime(1000); });
    fireEvent.click(screen.getByText('Accept'));
    expect(container.querySelector('[role="dialog"]')).toBeNull();
    expect(localStorage.getItem(CONSENT_KEY)).toBe('accepted');
  });

  it('declines cookies and hides banner', () => {
    const { container } = render(<MemoryRouter><CookieConsent /></MemoryRouter>);
    act(() => { vi.advanceTimersByTime(1000); });
    fireEvent.click(screen.getByText('Decline'));
    expect(container.querySelector('[role="dialog"]')).toBeNull();
    expect(localStorage.getItem(CONSENT_KEY)).toBe('declined');
  });

  it('renders cookie policy link', () => {
    render(<MemoryRouter><CookieConsent /></MemoryRouter>);
    act(() => { vi.advanceTimersByTime(1000); });
    const link = screen.getByText('Cookie Policy');
    expect(link).toBeInTheDocument();
  });
});
