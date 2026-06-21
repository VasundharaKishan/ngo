import { describe, it, expect } from 'vitest';
import { footerDisclosureFor, is80GActive, type PublicRegistration } from './useRegistrationInfo';

describe('useRegistrationInfo utilities', () => {
  describe('footerDisclosureFor', () => {
    it('returns UNREGISTERED default when info is null', () => {
      expect(footerDisclosureFor(null)).toContain('Registration in progress');
    });

    it('returns override when present', () => {
      const info: PublicRegistration = {
        status: 'APPROVED',
        registrationNumber: 'REG-123',
        eightyGActive: true,
        fcraActive: false,
        disclosureOverride: 'Custom disclosure text',
      };
      expect(footerDisclosureFor(info)).toBe('Custom disclosure text');
    });

    it('ignores whitespace-only override', () => {
      const info: PublicRegistration = {
        status: 'APPROVED',
        registrationNumber: 'REG-123',
        eightyGActive: true,
        fcraActive: false,
        disclosureOverride: '   ',
      };
      expect(footerDisclosureFor(info)).toContain('Section 8');
    });

    it('returns APPLIED default for APPLIED status', () => {
      const info: PublicRegistration = {
        status: 'APPLIED',
        registrationNumber: null,
        eightyGActive: false,
        fcraActive: false,
        disclosureOverride: null,
      };
      expect(footerDisclosureFor(info)).toContain('awaiting approval');
    });

    it('returns APPROVED default for APPROVED status', () => {
      const info: PublicRegistration = {
        status: 'APPROVED',
        registrationNumber: 'REG-456',
        eightyGActive: true,
        fcraActive: true,
        disclosureOverride: null,
      };
      expect(footerDisclosureFor(info)).toContain('Companies Act');
    });
  });

  describe('is80GActive', () => {
    it('returns false when info is null', () => {
      expect(is80GActive(null)).toBe(false);
    });

    it('returns true when eightyGActive is true', () => {
      const info: PublicRegistration = {
        status: 'APPROVED',
        registrationNumber: 'REG-789',
        eightyGActive: true,
        fcraActive: false,
        disclosureOverride: null,
      };
      expect(is80GActive(info)).toBe(true);
    });

    it('returns false when eightyGActive is false', () => {
      const info: PublicRegistration = {
        status: 'APPROVED',
        registrationNumber: 'REG-789',
        eightyGActive: false,
        fcraActive: true,
        disclosureOverride: null,
      };
      expect(is80GActive(info)).toBe(false);
    });
  });
});
