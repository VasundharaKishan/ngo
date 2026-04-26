/**
 * Public donation-presets hook. Fetches `/api/public/donation-presets` once per page
 * session. Returns the enabled, ordered list of preset amounts plus which amount to
 * preselect on the donation form.
 *
 * Fails closed to `null` — consumers should fall back to the hardcoded
 * {@link DONATION.PRESET_AMOUNTS} / {@link DONATION.DEFAULT_AMOUNT} so the donation
 * form is never empty if the API briefly hiccups.
 */
import { useEffect, useState } from 'react';
import { API_BASE_URL } from '../api';
import logger from '../utils/logger';

export interface PublicDonationPreset {
  id: number;
  amountMinorUnits: number;
  label: string | null;
}

export interface PublicDonationPresets {
  presets: PublicDonationPreset[];
  defaultAmountMinorUnits: number | null;
}

type CacheState = PublicDonationPresets | null | undefined;

let cached: CacheState = undefined;
let inflight: Promise<PublicDonationPresets | null> | null = null;

async function fetchPresets(): Promise<PublicDonationPresets | null> {
  if (cached !== undefined) return cached;
  if (inflight) return inflight;
  inflight = (async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/public/donation-presets`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data: PublicDonationPresets = await res.json();
      cached = data;
      return data;
    } catch (error) {
      logger.error('useDonationPresets', 'Failed to fetch donation presets', error);
      cached = null;
      return null;
    } finally {
      inflight = null;
    }
  })();
  return inflight;
}

interface DonationPresetsState {
  loading: boolean;
  data: PublicDonationPresets | null;
}

export function useDonationPresets(): DonationPresetsState {
  const [state, setState] = useState<DonationPresetsState>(() =>
    cached === undefined ? { loading: true, data: null } : { loading: false, data: cached }
  );

  useEffect(() => {
    if (cached !== undefined) {
      setState({ loading: false, data: cached });
      return;
    }
    let mounted = true;
    fetchPresets().then((data) => {
      if (mounted) setState({ loading: false, data });
    });
    return () => {
      mounted = false;
    };
  }, []);

  return state;
}

/** Test-only: clear the module-level cache. Not exported from the package entry. */
export function __resetDonationPresetsCacheForTests(): void {
  cached = undefined;
  inflight = null;
}
