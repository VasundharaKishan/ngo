import '@testing-library/jest-dom/vitest';
import { vi } from 'vitest';
import enTranslations from './i18n/locales/en.json';

// Mock react-helmet-async globally so tests don't need HelmetProvider
vi.mock('react-helmet-async', () => ({
  Helmet: ({ children }: { children: React.ReactNode }) => children,
  HelmetProvider: ({ children }: { children: React.ReactNode }) => children,
}));

// Mock react-i18next globally so tests don't need i18n setup.
// We resolve keys against en.json so tests see actual English strings.
function resolveTranslationKey(obj: Record<string, unknown>, key: string): string {
  const parts = key.split('.');
  let current: unknown = obj;
  for (const part of parts) {
    if (current != null && typeof current === 'object') {
      current = (current as Record<string, unknown>)[part];
    } else {
      return key;
    }
  }
  return typeof current === 'string' ? current : key;
}

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, opts?: Record<string, unknown>) => {
      let value = resolveTranslationKey(
        enTranslations as unknown as Record<string, unknown>,
        key
      );
      if (opts && typeof opts === 'object') {
        value = Object.entries(opts).reduce(
          (s, [k, v]) => s.replace(new RegExp(`\\{\\{${k}\\}\\}`, 'g'), String(v)),
          value
        );
      }
      return value;
    },
    i18n: {
      language: 'en',
      changeLanguage: vi.fn(),
    },
  }),
  Trans: ({ i18nKey }: { i18nKey: string }) =>
    resolveTranslationKey(enTranslations as unknown as Record<string, unknown>, i18nKey),
  initReactI18next: { type: '3rdParty', init: vi.fn() },
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
