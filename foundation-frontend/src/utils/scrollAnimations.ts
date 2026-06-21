import logger from './logger';

let sharedObserver: IntersectionObserver | null = null;

function getObserver(): IntersectionObserver | null {
  if (!('IntersectionObserver' in window)) {
    logger.warn('scrollAnimations', 'Intersection Observer not supported');
    return null;
  }

  if (!sharedObserver) {
    sharedObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('in-view');
            sharedObserver?.unobserve(entry.target);
          }
        });
      },
      {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px',
      }
    );
  }

  return sharedObserver;
}

export function initScrollAnimations() {
  const observer = getObserver();
  if (!observer) return;

  const elements = document.querySelectorAll('.scroll-animate, .scroll-animate-stagger');
  elements.forEach((el) => observer.observe(el));

  return observer;
}

if (typeof window !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initScrollAnimations);
  } else {
    initScrollAnimations();
  }
}

export function refreshScrollAnimations() {
  const observer = getObserver();
  if (!observer) return;

  const newElements = document.querySelectorAll(
    '.scroll-animate:not(.in-view), .scroll-animate-stagger:not(.in-view)'
  );
  newElements.forEach((el) => {
    const rect = el.getBoundingClientRect();
    if (rect.top < window.innerHeight && rect.bottom > 0) {
      el.classList.add('in-view');
    } else {
      observer.observe(el);
    }
  });

  return observer;
}
