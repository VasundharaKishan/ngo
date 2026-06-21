import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { useFaqs, __resetFaqsCacheForTests } from './useFaqs';

function TestConsumer() {
  const { loading, faqs } = useFaqs();
  if (loading) return <div>Loading...</div>;
  if (!faqs || faqs.length === 0) return <div data-testid="empty">No FAQs</div>;
  return <div data-testid="faqs">{faqs.map(f => f.question).join(', ')}</div>;
}

describe('useFaqs', () => {
  beforeEach(() => {
    __resetFaqsCacheForTests();
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('fetches and returns FAQ data', async () => {
    (fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve([
        { id: 1, question: 'How to donate?', answer: 'Via our website', category: null },
        { id: 2, question: 'Tax benefits?', answer: '80G eligible', category: 'Finance' },
      ]),
    });

    render(<TestConsumer />);

    await waitFor(() => {
      expect(screen.getByTestId('faqs')).toHaveTextContent('How to donate?, Tax benefits?');
    });
  });

  it('returns null on fetch error', async () => {
    (fetch as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new Error('fail'));

    render(<TestConsumer />);

    await waitFor(() => {
      expect(screen.getByTestId('empty')).toBeInTheDocument();
    });
  });

  it('caches results across mounts', async () => {
    (fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve([{ id: 1, question: 'Cached FAQ', answer: 'Yes', category: null }]),
    });

    const { unmount } = render(<TestConsumer />);
    await waitFor(() => screen.getByTestId('faqs'));
    unmount();

    render(<TestConsumer />);
    expect(screen.getByTestId('faqs')).toHaveTextContent('Cached FAQ');
    expect(fetch).toHaveBeenCalledTimes(1);
  });
});
