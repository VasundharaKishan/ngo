/**
 * Public money-allocations hook. Fetches `/api/public/money-allocations` once per
 * page session.
 *
 * <p>The endpoint returns {@code 204 No Content} whenever the foundation is not in
 * APPROVED registration status — in that case this hook resolves to an empty array
 * and the {@link MoneyAllocation} component renders nothing. There is intentionally
 * NO static fallback: the whole point of the block is that visitors only see it
 * once the NGO is registered.</p>
 */
import { useEffect, useState } from 'react';
import { API_BASE_URL } from '../api';
import logger from '../utils/logger';

export interface PublicMoneyAllocation {
  id: number;
  iconEmoji: string;
  label: string;
  percentage: number;
  description: string | null;
  colorHex: string;
}

type CacheState = PublicMoneyAllocation[] | null | undefined;

let cached: CacheState = undefined;
let inflight: Promise<PublicMoneyAllocation[] | null> | null = null;

async function fetchAllocations(): Promise<PublicMoneyAllocation[] | null> {
  if (cached !== undefined) return cached;
  if (inflight) return inflight;
  inflight = (async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/public/money-allocations`);
      if (res.status === 204) {
        cached = [];
        return [];
      }
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data: PublicMoneyAllocation[] = await res.json();
      cached = data;
      return data;
    } catch (error) {
      logger.error('useMoneyAllocations', 'Failed to fetch money allocations', error);
      cached = null;
      return null;
    } finally {
      inflight = null;
    }
  })();
  return inflight;
}

interface MoneyAllocationsState {
  loading: boolean;
  allocations: PublicMoneyAllocation[] | null;
}

export function useMoneyAllocations(): MoneyAllocationsState {
  const [state, setState] = useState<MoneyAllocationsState>(() =>
    cached === undefined ? { loading: true, allocations: null } : { loading: false, allocations: cached }
  );

  useEffect(() => {
    if (cached !== undefined) {
      setState({ loading: false, allocations: cached });
      return;
    }
    let mounted = true;
    fetchAllocations().then((allocations) => {
      if (mounted) setState({ loading: false, allocations });
    });
    return () => {
      mounted = false;
    };
  }, []);

  return state;
}

/** Test-only: clear the module-level cache. Not exported from the package entry. */
export function __resetMoneyAllocationsCacheForTests(): void {
  cached = undefined;
  inflight = null;
}
