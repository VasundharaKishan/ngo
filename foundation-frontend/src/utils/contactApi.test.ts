import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fetchContactInfo } from './contactApi';

// Mock fetch globally
global.fetch = vi.fn();

describe('contactApi', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  describe('fetchContactInfo', () => {
    it('should fetch and return contact information successfully', async () => {
      const mockContactData = {
        email: 'yugalsavitriseva@gmail.com',
        locations: [
          {
            label: 'Ireland',
            lines: ['4 Sorrel Green', 'Sorrel Woods', 'Blessington', 'Ireland'],
            postalLabel: 'Eircode',
            postalCode: 'W91PR6F',
            mobile: '+353 899540707'
          },
          {
            label: 'India',
            lines: ['Yugal Savitri Bhavan', 'Building Number 88', 'Hazaribagh', 'Jharkhand', 'India'],
            postalLabel: 'Pincode',
            postalCode: '829301',
            mobile: '+91 9987379321'
          }
        ]
      };

      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: async () => mockContactData,
      } as Response);

      const result = await fetchContactInfo();

      expect(result).toEqual(mockContactData);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/config/public/contact')
      );
    });

    it('should throw error when API request fails', async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: false,
        statusText: 'Not Found',
      } as Response);

      await expect(fetchContactInfo()).rejects.toThrow('Failed to fetch contact info: Not Found');
    });

    it('should throw error when network request fails', async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new Error('Network error'));

      await expect(fetchContactInfo()).rejects.toThrow('Network error');
    });
  });
});
