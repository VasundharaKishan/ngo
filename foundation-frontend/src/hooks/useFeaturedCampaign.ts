/**
 * Hook to fetch a single featured campaign for the hero card.
 *
 * Tries `/api/campaigns/featured` first; falls back to the first active campaign.
 * Module-level cache prevents duplicate requests.
 */
import { useEffect, useState } from 'react';
import { API_BASE_URL } from '../api';
import logger from '../utils/logger';

export interface FeaturedCampaign {
  id: string;
  title: string;
  category?: string;
  location?: string;
  imageUrl?: string;
  targetAmount: number;
  currentAmount: number;
  currency: string;
  daysLeft?: number;
}

type CacheState = FeaturedCampaign | null | undefined;

// 5-minute TTL — stale after this many milliseconds
const CACHE_TTL_MS = 5 * 60 * 1000;
let cached: CacheState = undefined;
let cachedAt: number | null = null;
let inflight: Promise<FeaturedCampaign | null> | null = null;

function isCacheStale(): boolean {
  return cachedAt === null || Date.now() - cachedAt > CACHE_TTL_MS;
}

function daysUntil(dateStr?: string | null): number | undefined {
  if (!dateStr) return undefined;
  const ms = new Date(dateStr).getTime() - Date.now();
  return ms > 0 ? Math.ceil(ms / 86_400_000) : 0;
}

async function fetchFeatured(): Promise<FeaturedCampaign | null> {
  if (cached !== undefined && !isCacheStale()) return cached;
  if (inflight) return inflight;

  inflight = (async () => {
    try {
      // Try featured endpoint first
      let res = await fetch(`${API_BASE_URL}/campaigns/featured`);
      if (!res.ok) {
        // Fall back to first active campaign
        res = await fetch(`${API_BASE_URL}/campaigns?active=true&limit=1`);
      }
      if (!res.ok) {
        cached = null;
        return null;
      }
      const data = await res.json();

      // API may return an array or a single object
      const raw = Array.isArray(data) ? data[0] : data;
      if (!raw) {
        cached = null;
        return null;
      }

      const campaign: FeaturedCampaign = {
        id: String(raw.id),
        title: raw.title,
        category: raw.categoryName || raw.category || undefined,
        location: raw.location || undefined,
        imageUrl: raw.imageUrl || undefined,
        targetAmount: raw.targetAmount ?? 0,
        currentAmount: raw.currentAmount ?? 0,
        currency: raw.currency || 'inr',
        daysLeft: daysUntil(raw.endDate),
      };

      cached = campaign;
      cachedAt = Date.now();
      return campaign;
    } catch (error) {
      logger.error('useFeaturedCampaign', 'Failed to fetch featured campaign', error);
      cached = null;
      cachedAt = null;
      return null;
    } finally {
      inflight = null;
    }
  })();

  return inflight;
}

interface FeaturedCampaignState {
  loading: boolean;
  campaign: FeaturedCampaign | null;
}

export function useFeaturedCampaign(): FeaturedCampaignState {
  const [state, setState] = useState<FeaturedCampaignState>(() =>
    cached === undefined ? { loading: true, campaign: null } : { loading: false, campaign: cached }
  );

  useEffect(() => {
    if (cached !== undefined && !isCacheStale()) {
      setState({ loading: false, campaign: cached });
      return;
    }
    let mounted = true;
    fetchFeatured().then((campaign) => {
      if (mounted) setState({ loading: false, campaign });
    });
    return () => { mounted = false; };
  }, []);

  return state;
}
