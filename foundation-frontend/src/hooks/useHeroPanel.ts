/**
 * Public hero-panel hook.
 *
 * Fetches `/api/public/hero-panel`. The backend returns:
 *   - 200 with the PublicHeroPanelResponse body when the panel is enabled
 *   - 204 No Content when the panel has been disabled by an admin
 *
 * When the panel is disabled or the request fails, this hook resolves to `null`, and
 * callers are expected to render a static fallback hero.
 *
 * The response is memoised in-module so sibling mounts share a single network call.
 */
import { useEffect, useState } from 'react';
import { API_BASE_URL } from '../api';
import logger from '../utils/logger';

export type BackgroundFocus = 'CENTER' | 'LEFT' | 'RIGHT' | 'TOP' | 'BOTTOM';

export interface PublicHeroPanel {
  eyebrow: string | null;
  headline: string;
  subtitle: string | null;
  primaryCtaLabel: string | null;
  primaryCtaHref: string | null;
  backgroundImageUrl: string | null;
  backgroundFocus: BackgroundFocus;
}

// State sentinel for the module-level cache:
//   undefined  → not fetched yet
//   null       → fetched, panel disabled or failed — render fallback
//   object     → fetched and enabled
type CacheState = PublicHeroPanel | null | undefined;

let cached: CacheState = undefined;
let inflight: Promise<PublicHeroPanel | null> | null = null;

async function fetchHeroPanel(): Promise<PublicHeroPanel | null> {
  if (cached !== undefined) return cached;
  if (inflight) return inflight;
  inflight = (async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/public/hero-panel`);
      if (res.status === 204) {
        cached = null;
        return null;
      }
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data: PublicHeroPanel = await res.json();
      cached = data;
      return data;
    } catch (error) {
      logger.error('useHeroPanel', 'Failed to fetch public hero panel', error);
      cached = null;
      return null;
    } finally {
      inflight = null;
    }
  })();
  return inflight;
}

interface HeroPanelState {
  loading: boolean;
  panel: PublicHeroPanel | null;
}

export function useHeroPanel(): HeroPanelState {
  const [state, setState] = useState<HeroPanelState>(() =>
    cached === undefined ? { loading: true, panel: null } : { loading: false, panel: cached }
  );

  useEffect(() => {
    if (cached !== undefined) {
      setState({ loading: false, panel: cached });
      return;
    }
    let mounted = true;
    fetchHeroPanel().then((panel) => {
      if (mounted) setState({ loading: false, panel });
    });
    return () => {
      mounted = false;
    };
  }, []);

  return state;
}

export const focusToObjectPosition: Record<BackgroundFocus, string> = {
  CENTER: 'center',
  LEFT: 'left center',
  RIGHT: 'right center',
  TOP: 'center top',
  BOTTOM: 'center bottom',
};
