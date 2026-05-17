/**
 * Public transparency-documents hook. Fetches `/api/public/transparency-documents`
 * once per page session.
 *
 * <p>Returns enabled rows only — the backend always returns 200 with an array
 * (possibly empty). No 204 path: documents are not registration-gated and an
 * empty list simply means nothing has been published yet. The Transparency page
 * remains meaningful in that state (it shows registration status + an honesty
 * note about what isn't available yet).</p>
 */
import { useEffect, useState } from 'react';
import { API_BASE_URL } from '../api';
import logger from '../utils/logger';

export interface PublicTransparencyDocument {
  id: number;
  title: string;
  description: string | null;
  category: string | null;
  linkUrl: string;
  issuedDate: string | null; // ISO date (YYYY-MM-DD) or null
  periodLabel: string | null;
}

type CacheState = PublicTransparencyDocument[] | null | undefined;

let cached: CacheState = undefined;
let inflight: Promise<PublicTransparencyDocument[] | null> | null = null;

async function fetchDocuments(): Promise<PublicTransparencyDocument[] | null> {
  if (cached !== undefined) return cached;
  if (inflight) return inflight;
  inflight = (async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/public/transparency-documents`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data: PublicTransparencyDocument[] = await res.json();
      cached = data;
      return data;
    } catch (error) {
      logger.error('useTransparencyDocuments', 'Failed to fetch transparency documents', error);
      cached = null;
      return null;
    } finally {
      inflight = null;
    }
  })();
  return inflight;
}

interface DocumentsState {
  loading: boolean;
  documents: PublicTransparencyDocument[] | null;
}

export function useTransparencyDocuments(): DocumentsState {
  const [state, setState] = useState<DocumentsState>(() =>
    cached === undefined ? { loading: true, documents: null } : { loading: false, documents: cached }
  );

  useEffect(() => {
    if (cached !== undefined) {
      setState({ loading: false, documents: cached });
      return;
    }
    let mounted = true;
    fetchDocuments().then((documents) => {
      if (mounted) setState({ loading: false, documents });
    });
    return () => {
      mounted = false;
    };
  }, []);

  return state;
}

/** Test-only: clear the module-level cache. */
export function __resetTransparencyDocumentsCacheForTests(): void {
  cached = undefined;
  inflight = null;
}
