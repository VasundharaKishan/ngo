import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { useAnnouncementBar, __resetAnnouncementBarCacheForTests } from './useAnnouncementBar';

function TestConsumer() {
  const { loading, bar } = useAnnouncementBar();
  if (loading) return <div>Loading...</div>;
  if (!bar) return <div data-testid="empty">No bar</div>;
  return <div data-testid="bar">{bar.message}</div>;
}

describe('useAnnouncementBar', () => {
  beforeEach(() => {
    __resetAnnouncementBarCacheForTests();
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('fetches and returns announcement bar data', async () => {
    (fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: () => Promise.resolve({ message: 'Welcome!', style: 'INFO', dismissible: true, iconEmoji: null, linkUrl: null, linkLabel: null, updatedAt: '2024-01-01' }),
    });

    render(<TestConsumer />);
    expect(screen.getByText('Loading...')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByTestId('bar')).toHaveTextContent('Welcome!');
    });
  });

  it('returns null on 204 No Content', async () => {
    (fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      status: 204,
    });

    render(<TestConsumer />);

    await waitFor(() => {
      expect(screen.getByTestId('empty')).toHaveTextContent('No bar');
    });
  });

  it('returns null on fetch error', async () => {
    (fetch as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new Error('Network error'));

    render(<TestConsumer />);

    await waitFor(() => {
      expect(screen.getByTestId('empty')).toHaveTextContent('No bar');
    });
  });

  it('uses cache on subsequent renders', async () => {
    (fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: () => Promise.resolve({ message: 'Cached!', style: 'INFO', dismissible: false, iconEmoji: null, linkUrl: null, linkLabel: null, updatedAt: '2024-01-01' }),
    });

    const { unmount } = render(<TestConsumer />);
    await waitFor(() => screen.getByTestId('bar'));
    unmount();

    render(<TestConsumer />);
    expect(screen.getByTestId('bar')).toHaveTextContent('Cached!');
    expect(fetch).toHaveBeenCalledTimes(1);
  });
});
