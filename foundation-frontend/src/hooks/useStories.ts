/**
 * Public stories hook. Fetches `/api/public/stories` once per page session.
 *
 * <p>The endpoint returns {@code 204 No Content} whenever the foundation is not in
 * APPROVED registration status — in that case this hook resolves to an empty array
 * and the {@code StoriesSection} component renders nothing. There is intentionally
 * no static fallback: stories that imply outcomes should not appear pre-registration.</p>
 */
import { useEffect, useState } from 'react';
import { API_BASE_URL } from '../api';
import logger from '../utils/logger';

export interface PublicStory {
  id: number;
  title: string;
  quote: string;
  attribution: string;
  imageUrl: string | null;
  programTag: string | null;
  location: string | null;
}

type CacheState = PublicStory[] | null | undefined;

let cached: CacheState = undefined;
let inflight: Promise<PublicStory[] | null> | null = null;

async function fetchStories(): Promise<PublicStory[] | null> {
  if (cached !== undefined) return cached;
  if (inflight) return inflight;
  inflight = (async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/public/stories`);
      if (res.status === 204) {
        cached = [];
        return [];
      }
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data: PublicStory[] = await res.json();
      cached = data;
      return data;
    } catch (error) {
      logger.error('useStories', 'Failed to fetch stories', error);
      cached = null;
      return null;
    } finally {
      inflight = null;
    }
  })();
  return inflight;
}

interface StoriesState {
  loading: boolean;
  stories: PublicStory[] | null;
}

export function useStories(): StoriesState {
  const [state, setState] = useState<StoriesState>(() =>
    cached === undefined ? { loading: true, stories: null } : { loading: false, stories: cached }
  );

  useEffect(() => {
    if (cached !== undefined) {
      setState({ loading: false, stories: cached });
      return;
    }
    let mounted = true;
    fetchStories().then((stories) => {
      if (mounted) setState({ loading: false, stories });
    });
    return () => {
      mounted = false;
    };
  }, []);

  return state;
}

/** Test-only: clear the module-level cache. */
export function __resetStoriesCacheForTests(): void {
  cached = undefined;
  inflight = null;
}
