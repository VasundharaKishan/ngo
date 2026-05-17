/**
 * Public registration status hook.
 *
 * Fetches the minimal registration disclosure payload from `/api/public/registration`
 * and exposes helpers for rendering conditional public content (footer disclosure,
 * 80G claims, FCRA-gated flows).
 *
 * The response is cached in-memory across components for the lifetime of the page —
 * the backend also sets a 30s Cache-Control so deployments propagate quickly.
 */
import { useEffect, useState } from 'react';
import { API_BASE_URL } from '../api';
import logger from '../utils/logger';

export type PublicRegistrationStatus = 'UNREGISTERED' | 'APPLIED' | 'APPROVED';

export interface PublicRegistration {
  status: PublicRegistrationStatus;
  registrationNumber: string | null;
  eightyGActive: boolean;
  fcraActive: boolean;
  disclosureOverride: string | null;
}

const DEFAULT_DISCLOSURES: Record<PublicRegistrationStatus, string> = {
  UNREGISTERED: 'Community-led foundation · Registration in progress.',
  APPLIED: 'Section 8 registration filed · awaiting approval.',
  APPROVED: 'Registered under Section 8 of the Companies Act, 2013.',
};

// Page-level memo so repeated mounts don't re-fetch.
let cached: PublicRegistration | null = null;
let inflight: Promise<PublicRegistration> | null = null;

async function fetchRegistration(): Promise<PublicRegistration> {
  if (cached) return cached;
  if (inflight) return inflight;
  inflight = (async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/public/registration`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data: PublicRegistration = await res.json();
      cached = data;
      return data;
    } catch (error) {
      logger.error('useRegistrationInfo', 'Failed to fetch public registration', error);
      // Fail closed: assume UNREGISTERED so public site never accidentally claims
      // status it cannot prove.
      const fallback: PublicRegistration = {
        status: 'UNREGISTERED',
        registrationNumber: null,
        eightyGActive: false,
        fcraActive: false,
        disclosureOverride: null,
      };
      cached = fallback;
      return fallback;
    } finally {
      inflight = null;
    }
  })();
  return inflight;
}

export function useRegistrationInfo(): PublicRegistration | null {
  const [data, setData] = useState<PublicRegistration | null>(cached);

  useEffect(() => {
    if (cached) return;
    let mounted = true;
    fetchRegistration().then((d) => {
      if (mounted) setData(d);
    });
    return () => {
      mounted = false;
    };
  }, []);

  return data;
}

/** Returns the disclosure line to render in the public footer. Never returns an empty string. */
export function footerDisclosureFor(info: PublicRegistration | null): string {
  if (!info) return DEFAULT_DISCLOSURES.UNREGISTERED;
  if (info.disclosureOverride && info.disclosureOverride.trim().length > 0) {
    return info.disclosureOverride.trim();
  }
  return DEFAULT_DISCLOSURES[info.status];
}

/** True when the public site may surface 80G tax-deduction claims. */
export function is80GActive(info: PublicRegistration | null): boolean {
  return !!info && info.eightyGActive;
}
