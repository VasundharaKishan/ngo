import { describe, it, expect } from 'vitest';
import { sanitizeHtml } from './sanitize';

describe('sanitizeHtml', () => {
  it('preserves allowed formatting tags', () => {
    const input = '<p>Hello <strong>world</strong> and <em>italic</em></p>';
    expect(sanitizeHtml(input)).toBe(input);
  });

  it('strips script tags', () => {
    const input = '<p>Safe</p><script>alert("xss")</script>';
    expect(sanitizeHtml(input)).toBe('<p>Safe</p>');
  });

  it('strips event handler attributes', () => {
    const input = '<img src="pic.jpg" onerror="alert(1)" alt="photo">';
    const result = sanitizeHtml(input);
    expect(result).not.toContain('onerror');
    expect(result).toContain('src="pic.jpg"');
    expect(result).toContain('alt="photo"');
  });

  it('strips javascript: URIs from links', () => {
    const input = '<a href="javascript:alert(1)">click</a>';
    const result = sanitizeHtml(input);
    expect(result).not.toContain('javascript:');
  });

  it('allows safe link attributes', () => {
    const input = '<a href="https://example.com" title="Example" target="_blank" rel="noopener">link</a>';
    expect(sanitizeHtml(input)).toBe(input);
  });

  it('strips data attributes', () => {
    const input = '<div data-custom="value">text</div>';
    const result = sanitizeHtml(input);
    expect(result).not.toContain('data-custom');
    expect(result).toContain('text');
  });

  it('allows table elements', () => {
    const input = '<table><thead><tr><th>Header</th></tr></thead><tbody><tr><td>Cell</td></tr></tbody></table>';
    expect(sanitizeHtml(input)).toBe(input);
  });

  it('strips disallowed tags like iframe', () => {
    const input = '<p>Text</p><iframe src="https://evil.com"></iframe>';
    expect(sanitizeHtml(input)).toBe('<p>Text</p>');
  });

  it('strips style tags', () => {
    const input = '<style>body { display: none }</style><p>Content</p>';
    expect(sanitizeHtml(input)).toBe('<p>Content</p>');
  });

  it('handles empty string', () => {
    expect(sanitizeHtml('')).toBe('');
  });

  it('allows class and id attributes', () => {
    const input = '<div class="highlight" id="section1">text</div>';
    expect(sanitizeHtml(input)).toBe(input);
  });
});
