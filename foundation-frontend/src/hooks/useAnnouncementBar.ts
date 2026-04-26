/**
 * Public announcement-bar hook.
 *
 * Fetches `/api/public/announcement-bar`. The backend returns:
 *   - 200 with the PublicAnnouncementBar body when the bar is enabled AND within its
 *     optional starts_at/ends_at window
 *   - 204 No Content when disabled or outside the window
 *
 * When the bar is not live or the request fails, this hook resolves to `null` and the
 * calling component renders nothing. The response is memoised in-module so the request
 * fires once per tab even if Layout re-mounts.
 */
import { useEffect, useState } from 'react';
import { API_BASE_URL } from '../api';
import logger from '../utils/logger';

export type AnnouncementStyle = 'INFO' | 'SUCCESS' | 'WARNING' | 'CRITICAL';

export interface PublicAnnouncementBar {
  iconEmoji: string | null;
  message: string;
  linkUrl: string | null;
  linkLabel: string | null;
  style: AnnouncementStyle;
  dismissible: boolean;
  /** ISO-8601 publish timestamp — used as the dismissal key so a fresh edit re-appears. */
  updatedAt: string;
}

// State sentinel:
//   undefined  → not fetched yet
//   null       → fetched, not live or failed — render nothing
//   object     → fetched and live
type CacheState = PublicAnnouncementBar | null | undefined;

let cached: CacheState = undefined;
let inflight: Promise<PublicAnnouncementBar | null> | null = null;

async function fetchAnnouncementBar(): Promise<PublicAnnouncementBar | null> {
  if (cached !== undefined) return cached;
  if (inflight) return inflight;
  inflight = (async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/public/announcement-bar`);
      if (res.status === 204) {
        cached = null;
        return null;
      }
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data: PublicAnnouncementBar = await res.json();
      cached = data;
      return data;
    } catch (error) {
      logger.error('useAnnouncementBar', 'Failed to fetch public announcement bar', error);
      cached = null;
      return null;
    } finally {
      inflight = null;
    }
  })();
  return inflight;
}

interface AnnouncementBarState {
  loading: boolean;
  bar: PublicAnnouncementBar | null;
}

export function useAnnouncementBar(): AnnouncementBarState {
  const [state, setState] = useState<AnnouncementBarState>(() =>
    cached === undefined ? { loading: true, bar: null } : { loading: false, bar: cached }
  );

  useEffect(() => {
    if (cached !== undefined) {
      setState({ loading: false, bar: cached });
      return;
    }
    let mounted = true;
    fetchAnnouncementBar().then((bar) => {
      if (mounted) setState({ loading: false, bar });
    });
    return () => {
      mounted = false;
    };
  }, []);

  return state;
}

/** Test helper — only intended for vitest. */
export function __resetAnnouncementBarCacheForTests(): void {
  cached = undefined;
  inflight = null;
}
