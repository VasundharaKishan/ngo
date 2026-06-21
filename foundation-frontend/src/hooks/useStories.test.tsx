import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { useStories, __resetStoriesCacheForTests } from './useStories';

function TestConsumer() {
  const { loading, stories } = useStories();
  if (loading) return <div>Loading...</div>;
  if (!stories || stories.length === 0) return <div data-testid="empty">No stories</div>;
  return <div data-testid="stories">{stories[0].title}</div>;
}

describe('useStories', () => {
  beforeEach(() => {
    __resetStoriesCacheForTests();
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('fetches and returns stories', async () => {
    (fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: () => Promise.resolve([
        { id: 1, title: 'Ravi\'s Journey', quote: 'Changed my life', attribution: 'Ravi', imageUrl: null, programTag: null, location: 'Delhi' },
      ]),
    });

    render(<TestConsumer />);

    await waitFor(() => {
      expect(screen.getByTestId('stories')).toHaveTextContent("Ravi's Journey");
    });
  });

  it('returns empty array on 204', async () => {
    (fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      status: 204,
    });

    render(<TestConsumer />);

    await waitFor(() => {
      expect(screen.getByTestId('empty')).toBeInTheDocument();
    });
  });

  it('returns null on network error', async () => {
    (fetch as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new Error('offline'));

    render(<TestConsumer />);

    await waitFor(() => {
      expect(screen.getByTestId('empty')).toBeInTheDocument();
    });
  });
});
