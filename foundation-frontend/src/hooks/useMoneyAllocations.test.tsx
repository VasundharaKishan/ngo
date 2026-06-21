import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { useMoneyAllocations, __resetMoneyAllocationsCacheForTests } from './useMoneyAllocations';

function TestConsumer() {
  const { loading, allocations } = useMoneyAllocations();
  if (loading) return <div>Loading...</div>;
  if (!allocations || allocations.length === 0) return <div data-testid="empty">No allocations</div>;
  return <div data-testid="alloc">{allocations[0].label} {allocations[0].percentage}%</div>;
}

describe('useMoneyAllocations', () => {
  beforeEach(() => {
    __resetMoneyAllocationsCacheForTests();
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('fetches and returns allocations', async () => {
    (fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: () => Promise.resolve([
        { id: 1, iconEmoji: '📚', label: 'Education', percentage: 70, description: null, colorHex: '#ff0000' },
      ]),
    });

    render(<TestConsumer />);

    await waitFor(() => {
      expect(screen.getByTestId('alloc')).toHaveTextContent('Education 70%');
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

  it('returns null on error', async () => {
    (fetch as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new Error('fail'));

    render(<TestConsumer />);

    await waitFor(() => {
      expect(screen.getByTestId('empty')).toBeInTheDocument();
    });
  });
});
