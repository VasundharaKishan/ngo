/**
 * Public FAQs hook. Fetches `/api/public/faqs` once per page session.
 *
 * <p>Returns enabled FAQs only — the backend always returns 200 with an array (possibly
 * empty). Unlike {@code useStories}, there is no 204 path: FAQs are not registration-
 * gated and an empty list simply means no FAQs are enabled yet.</p>
 */
import { useEffect, useState } from 'react';
import { API_BASE_URL } from '../api';
import logger from '../utils/logger';

export interface PublicFaq {
  id: number;
  question: string;
  answer: string;
  category: string | null;
}

type CacheState = PublicFaq[] | null | undefined;

let cached: CacheState = undefined;
let inflight: Promise<PublicFaq[] | null> | null = null;

async function fetchFaqs(): Promise<PublicFaq[] | null> {
  if (cached !== undefined) return cached;
  if (inflight) return inflight;
  inflight = (async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/public/faqs`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data: PublicFaq[] = await res.json();
      cached = data;
      return data;
    } catch (error) {
      logger.error('useFaqs', 'Failed to fetch FAQs', error);
      cached = null;
      return null;
    } finally {
      inflight = null;
    }
  })();
  return inflight;
}

interface FaqsState {
  loading: boolean;
  faqs: PublicFaq[] | null;
}

export function useFaqs(): FaqsState {
  const [state, setState] = useState<FaqsState>(() =>
    cached === undefined ? { loading: true, faqs: null } : { loading: false, faqs: cached }
  );

  useEffect(() => {
    if (cached !== undefined) {
      setState({ loading: false, faqs: cached });
      return;
    }
    let mounted = true;
    fetchFaqs().then((faqs) => {
      if (mounted) setState({ loading: false, faqs });
    });
    return () => {
      mounted = false;
    };
  }, []);

  return state;
}

/** Test-only: clear the module-level cache. */
export function __resetFaqsCacheForTests(): void {
  cached = undefined;
  inflight = null;
}
