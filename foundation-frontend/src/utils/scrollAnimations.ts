// Scroll animation observer utility
// Automatically animates elements when they enter the viewport

import logger from './logger';

export function initScrollAnimations() {
  // Check if Intersection Observer is supported
  if (!('IntersectionObserver' in window)) {
    logger.warn('scrollAnimations', 'Intersection Observer not supported');
    return;
  }

  // Create observer
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('in-view');
          // Optional: stop observing after animation
          // observer.unobserve(entry.target);
        }
      });
    },
    {
      threshold: 0.1, // Trigger when 10% of element is visible
      rootMargin: '0px 0px -50px 0px', // Start animation slightly before element enters
    }
  );

  // Observe all elements with scroll-animate class
  const animatedElements = document.querySelectorAll('.scroll-animate, .scroll-animate-stagger');
  animatedElements.forEach((el) => observer.observe(el));

  return observer;
}

// Initialize on DOM content loaded
if (typeof window !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initScrollAnimations);
  } else {
    initScrollAnimations();
  }
}

// Re-initialize when new content is added — only observes elements not yet animated
export function refreshScrollAnimations() {
  if (!('IntersectionObserver' in window)) return;

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('in-view');
        }
      });
    },
    { threshold: 0.1, rootMargin: '0px 0px -50px 0px' }
  );

  // Only observe elements that haven't animated yet — avoids duplicate observers on already-visible items
  const newElements = document.querySelectorAll(
    '.scroll-animate:not(.in-view), .scroll-animate-stagger:not(.in-view)'
  );
  newElements.forEach((el) => observer.observe(el));
  return observer;
}
