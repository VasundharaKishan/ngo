import { describe, it, expect, vi, beforeEach } from 'vitest';
import { initScrollAnimations, refreshScrollAnimations } from './scrollAnimations';

describe('scrollAnimations', () => {
  beforeEach(() => {
    document.body.innerHTML = `
      <div class="scroll-animate" id="a"></div>
      <div class="scroll-animate-stagger" id="b"></div>
    `;
  });

  it('returns early when IntersectionObserver is missing', () => {
    const original = (window as any).IntersectionObserver;
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    delete (window as any).IntersectionObserver;
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});

    const observer = initScrollAnimations();
    expect(observer).toBeUndefined();
    expect(warn).toHaveBeenCalled();

    (window as any).IntersectionObserver = original;
    warn.mockRestore();
  });

  it('observes elements when supported', () => {
    const observe = vi.fn();
    const disconnect = vi.fn();
    (window as any).IntersectionObserver = vi.fn().mockImplementation((cb) => {
      // Simulate immediate intersection for first element
      const entries = [
        { isIntersecting: true, target: document.getElementById('a')! },
        { isIntersecting: false, target: document.getElementById('b')! },
      ];
      cb(entries, {} as IntersectionObserver);
      return { observe, disconnect };
    });

    const observer = initScrollAnimations();
    expect(observer?.observe).toBeDefined();
    expect(document.getElementById('a')?.classList.contains('in-view')).toBe(true);
    expect(document.getElementById('b')?.classList.contains('in-view')).toBe(false);
    observer?.disconnect();
  });

  it('refreshScrollAnimations safely re-initializes', () => {
    const observer = refreshScrollAnimations();
    // returns observer or undefined; should not throw
    expect(observer).toBeDefined();
  });
});
