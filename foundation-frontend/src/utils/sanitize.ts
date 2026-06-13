/**
 * Client-side HTML sanitization for CMS content rendered via dangerouslySetInnerHTML.
 *
 * Uses DOMPurify with a strict allowlist: only formatting, links, tables,
 * and safe block elements. No script, no on* event handlers, no javascript: URIs.
 *
 * Always call this before passing content.body to dangerouslySetInnerHTML.
 */
import DOMPurify from 'dompurify';

const ALLOWED_TAGS = [
  'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
  'p', 'br', 'hr',
  'strong', 'b', 'em', 'i', 'u', 's', 'mark', 'small', 'sub', 'sup',
  'ul', 'ol', 'li',
  'blockquote', 'pre', 'code',
  'table', 'thead', 'tbody', 'tfoot', 'tr', 'th', 'td', 'caption',
  'a', 'img',
  'div', 'span', 'section', 'article', 'aside',
];

const ALLOWED_ATTR = [
  'href', 'title', 'target', 'rel',   // links
  'src', 'alt', 'width', 'height',     // images
  'class', 'id',                        // styling hooks
];

export function sanitizeHtml(dirty: string): string {
  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS,
    ALLOWED_ATTR,
    ALLOW_DATA_ATTR: false,
    FORCE_BODY: false,
  });
}
