// Scroll animation observer utility
// Automatically animates elements when they enter the viewport

export function initScrollAnimations() {
  // Check if Intersection Observer is supported
  if (!('IntersectionObserver' in window)) {
    console.warn('Intersection Observer not supported');
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

// Re-initialize when new content is added
export function refreshScrollAnimations() {
  const existingObserver = initScrollAnimations();
  return existingObserver;
}
