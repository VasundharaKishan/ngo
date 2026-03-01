import { useState, useEffect } from 'react';
import { API_BASE_URL } from '../config/constants';

/**
 * Hook to load CMS content for a given section.
 * Returns a map of contentKey → contentValue.
 * If the CMS has no content for the section, returns an empty map.
 */
export function useCMSContent(section: string) {
  const [content, setContent] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const response = await fetch(`${API_BASE_URL}/cms/content/${section}`);
        if (response.ok) {
          const data: Record<string, string> = await response.json();
          if (!cancelled) setContent(data);
        }
      } catch {
        // CMS unavailable — keep empty map so fallback content renders
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, [section]);

  return { content, loading, hasCMSContent: Object.keys(content).length > 0 };
}
