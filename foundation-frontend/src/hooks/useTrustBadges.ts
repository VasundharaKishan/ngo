/**
 * Public trust-badges hook. Fetches `/api/public/trust-badges` once per page session.
 * The backend filters out disabled rows and registration-gated rows (unless approved),
 * so the caller can render whatever this returns as-is.
 *
 * Fails closed to `null` — the public TrustBadges component then renders its static
 * i18n'd fallback so visitors always see something.
 */
import { useEffect, useState } from 'react';
import { API_BASE_URL } from '../api';
import logger from '../utils/logger';

export interface PublicTrustBadge {
  slotKey: string;
  iconEmoji: string;
  title: string;
  description: string;
  showInStrip: boolean;
  showInGrid: boolean;
  sortOrder: number;
}

type CacheState = PublicTrustBadge[] | null | undefined;

let cached: CacheState = undefined;
let inflight: Promise<PublicTrustBadge[] | null> | null = null;

async function fetchBadges(): Promise<PublicTrustBadge[] | null> {
  if (cached !== undefined) return cached;
  if (inflight) return inflight;
  inflight = (async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/public/trust-badges`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data: PublicTrustBadge[] = await res.json();
      cached = data;
      return data;
    } catch (error) {
      logger.error('useTrustBadges', 'Failed to fetch trust badges', error);
      cached = null;
      return null;
    } finally {
      inflight = null;
    }
  })();
  return inflight;
}

interface TrustBadgesState {
  loading: boolean;
  badges: PublicTrustBadge[] | null;
}

export function useTrustBadges(): TrustBadgesState {
  const [state, setState] = useState<TrustBadgesState>(() =>
    cached === undefined ? { loading: true, badges: null } : { loading: false, badges: cached }
  );

  useEffect(() => {
    if (cached !== undefined) {
      setState({ loading: false, badges: cached });
      return;
    }
    let mounted = true;
    fetchBadges().then((badges) => {
      if (mounted) setState({ loading: false, badges });
    });
    return () => {
      mounted = false;
    };
  }, []);

  return state;
}

/** Test-only: clear the module-level cache. Not exported from the package entry. */
export function __resetTrustBadgesCacheForTests(): void {
  cached = undefined;
  inflight = null;
}
