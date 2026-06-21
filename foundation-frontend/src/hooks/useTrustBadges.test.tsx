import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { useTrustBadges, __resetTrustBadgesCacheForTests } from './useTrustBadges';

function TestConsumer() {
  const { loading, badges } = useTrustBadges();
  if (loading) return <div>Loading...</div>;
  if (!badges || badges.length === 0) return <div data-testid="empty">No badges</div>;
  return <div data-testid="badges">{badges.map(b => b.title).join(', ')}</div>;
}

describe('useTrustBadges', () => {
  beforeEach(() => {
    __resetTrustBadgesCacheForTests();
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('fetches and returns badges', async () => {
    (fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve([
        { slotKey: 'audit', iconEmoji: '✅', title: 'Audited', description: 'Annually audited', showInStrip: true, showInGrid: true, sortOrder: 1 },
      ]),
    });

    render(<TestConsumer />);

    await waitFor(() => {
      expect(screen.getByTestId('badges')).toHaveTextContent('Audited');
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
