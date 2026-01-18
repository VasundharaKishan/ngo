import '@testing-library/jest-dom/vitest';

// Provide a minimal IntersectionObserver mock for components/tests that rely on it
class MockIntersectionObserver {
  constructor() {}
  observe() {}
  unobserve() {}
  disconnect() {}
  takeRecords() { return []; }
}

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
global.IntersectionObserver = MockIntersectionObserver;
