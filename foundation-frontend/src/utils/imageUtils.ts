/**
 * Image URL helpers for requesting Unsplash images at the right size per context.
 * Local paths (e.g. /children_education.png) are returned unchanged — they are
 * already high-resolution 1536×1024 PNGs that work for every container.
 */

/**
 * Returns a URL sized for a small card thumbnail (~600×400, pre-cropped by Unsplash).
 * Unsplash's fit=crop parameter ensures the image is delivered at exactly 600×400 (3:2),
 * matching the card container's own 3:2 aspect-ratio — eliminating any subject cut-off.
 */
export function getThumbnailUrl(url: string): string {
  if (!url || !url.includes('unsplash.com')) return url;
  const base = url.split('?')[0];
  return `${base}?w=600&h=400&fit=crop&auto=format&q=75`;
}

/**
 * Returns a URL sized for the campaign detail page hero image (~1200px wide, high quality).
 * No forced height/crop so the full landscape composition is preserved;
 * the container's max-height + object-fit:cover in CSS handles any height capping.
 */
export function getDetailUrl(url: string): string {
  if (!url || !url.includes('unsplash.com')) return url;
  const base = url.split('?')[0];
  return `${base}?w=1200&auto=format&q=85`;
}
