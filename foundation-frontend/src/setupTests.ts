import '@testing-library/jest-dom/vitest';
import { vi } from 'vitest';

// Mock react-helmet-async globally so tests don't need HelmetProvider
vi.mock('react-helmet-async', () => ({
  Helmet: ({ children }: { children: React.ReactNode }) => children,
  HelmetProvider: ({ children }: { children: React.ReactNode }) => children,
}));

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
