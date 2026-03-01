import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { api, authFetch, fetchDonationsPaginated, getDonatePopupSettings, updateDonatePopupSettings } from './api';

describe('api.ts public functions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('api.getPublicConfig', () => {
    it('returns parsed JSON on success', async () => {
      const config = { featuredCampaignsCount: 5, itemsPerPage: 10 };
      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(config),
      } as Response);

      const result = await api.getPublicConfig();
      expect(result).toEqual(config);
    });

    it('returns defaults when fetch fails', async () => {
      global.fetch = vi.fn().mockResolvedValueOnce({ ok: false } as Response);

      const result = await api.getPublicConfig();
      expect(result).toEqual({ featuredCampaignsCount: 3, itemsPerPage: 12 });
    });
  });

  describe('api.getCategories', () => {
    it('returns categories on success', async () => {
      const categories = [{ id: '1', name: 'Education' }];
      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(categories),
      } as Response);

      const result = await api.getCategories();
      expect(result).toEqual(categories);
    });

    it('throws on failure', async () => {
      global.fetch = vi.fn().mockResolvedValueOnce({ ok: false } as Response);

      await expect(api.getCategories()).rejects.toThrow('Failed to fetch categories');
    });
  });

  describe('api.getCampaigns', () => {
    it('fetches campaigns without filters', async () => {
      const campaigns = [{ id: '1', title: 'Campaign 1' }];
      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(campaigns),
      } as Response);

      const result = await api.getCampaigns();
      expect(result).toEqual(campaigns);
      expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining('/campaigns'));
    });

    it('fetches campaigns with filters', async () => {
      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve([]),
      } as Response);

      await api.getCampaigns({ featured: true, categoryId: 'cat1', urgent: false, limit: 5 });
      expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining('featured=true'));
      expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining('categoryId=cat1'));
    });

    it('throws on failure', async () => {
      global.fetch = vi.fn().mockResolvedValueOnce({ ok: false } as Response);
      await expect(api.getCampaigns()).rejects.toThrow('Failed to fetch campaigns');
    });
  });

  describe('api.getCampaignsPaginated', () => {
    it('fetches paginated campaigns with params', async () => {
      const pageResponse = { items: [], totalPages: 0, totalItems: 0, currentPage: 0 };
      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(pageResponse),
      } as Response);

      const result = await api.getCampaignsPaginated({ page: 0, size: 12, featured: true });
      expect(result).toEqual(pageResponse);
      expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining('page=0'));
      expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining('featured=true'));
    });

    it('throws on failure', async () => {
      global.fetch = vi.fn().mockResolvedValueOnce({ ok: false } as Response);
      await expect(api.getCampaignsPaginated({ page: 0, size: 12 })).rejects.toThrow();
    });
  });

  describe('api.getCampaign', () => {
    it('fetches a single campaign by id', async () => {
      const campaign = { id: 'camp1', title: 'Test' };
      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(campaign),
      } as Response);

      const result = await api.getCampaign('camp1');
      expect(result).toEqual(campaign);
      expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining('/campaigns/camp1'));
    });

    it('throws on failure', async () => {
      global.fetch = vi.fn().mockResolvedValueOnce({ ok: false } as Response);
      await expect(api.getCampaign('bad-id')).rejects.toThrow('Failed to fetch campaign');
    });
  });

  describe('api.createStripeSession', () => {
    it('posts donation request and returns checkout session', async () => {
      const sessionResponse = { sessionUrl: 'https://checkout.stripe.com/pay/cs_test_123' };
      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(sessionResponse),
      } as Response);

      const request = { amount: 1000, currency: 'usd', campaignId: 'camp1', donorName: 'Alice', donorEmail: 'a@b.com' };
      const result = await api.createStripeSession(request);
      expect(result).toEqual(sessionResponse);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/donations/stripe/create'),
        expect.objectContaining({ method: 'POST' })
      );
    });

    it('throws on failure', async () => {
      global.fetch = vi.fn().mockResolvedValueOnce({ ok: false } as Response);
      await expect(
        api.createStripeSession({ amount: 500, currency: 'usd', campaignId: 'c1' })
      ).rejects.toThrow('Failed to create checkout session');
    });
  });

  describe('api.getDonatePopup', () => {
    it('fetches donate popup campaign', async () => {
      const popup = { campaign: { id: 'c1', title: 'Spotlight' }, mode: 'SPOTLIGHT' };
      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(popup),
      } as Response);

      const result = await api.getDonatePopup();
      expect(result).toEqual(popup);
      expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining('/config/public/donate-popup'));
    });

    it('throws on failure', async () => {
      global.fetch = vi.fn().mockResolvedValueOnce({ ok: false } as Response);
      await expect(api.getDonatePopup()).rejects.toThrow('Failed to fetch donate popup campaign');
    });
  });
});

describe('api.ts authFetch', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('throws when no adminUser in localStorage', async () => {
    await expect(authFetch('/some-url')).rejects.toThrow('No authentication token found');
  });

  it('makes authenticated request when adminUser exists', async () => {
    localStorage.setItem('adminUser', JSON.stringify({ username: 'admin' }));
    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: () => Promise.resolve({}),
    } as Response);

    const result = await authFetch('/api/admin/test');
    expect(result.ok).toBe(true);
    expect(global.fetch).toHaveBeenCalledWith('/api/admin/test', expect.objectContaining({
      credentials: 'include',
    }));
  });

  it('clears adminUser and redirects on 401 response', async () => {
    localStorage.setItem('adminUser', JSON.stringify({ username: 'admin' }));
    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: false,
      status: 401,
    } as Response);

    // Mock window.location.href setter
    const hrefSetter = vi.fn();
    Object.defineProperty(window, 'location', {
      value: { href: '' },
      writable: true,
    });
    Object.defineProperty(window.location, 'href', {
      set: hrefSetter,
      get: () => '',
    });

    await expect(authFetch('/api/admin/protected')).rejects.toThrow('Unauthorized');
    expect(localStorage.getItem('adminUser')).toBeNull();
  });
});

describe('api.ts fetchDonationsPaginated', () => {
  beforeEach(() => {
    localStorage.setItem('adminUser', JSON.stringify({ username: 'admin' }));
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('builds correct URL params and returns donations', async () => {
    const response = { items: [], totalItems: 0, totalPages: 0 };
    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: () => Promise.resolve(response),
    } as Response);

    const result = await fetchDonationsPaginated({ page: 0, size: 10, sort: 'createdAt,desc', q: 'Alice', status: 'SUCCESS' });
    expect(result).toEqual(response);
    const calledUrl = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0][0] as string;
    expect(calledUrl).toContain('q=Alice');
    expect(calledUrl).toContain('status=SUCCESS');
  });

  it('skips status param when status is ALL', async () => {
    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: () => Promise.resolve({ items: [], totalItems: 0, totalPages: 0 }),
    } as Response);

    await fetchDonationsPaginated({ status: 'ALL' });
    const calledUrl = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0][0] as string;
    expect(calledUrl).not.toContain('status=');
  });

  it('throws when fetch returns non-ok', async () => {
    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: false,
      status: 500,
    } as Response);

    await expect(fetchDonationsPaginated({})).rejects.toThrow('Failed to fetch donations');
  });
});

describe('api.ts getDonatePopupSettings and updateDonatePopupSettings', () => {
  beforeEach(() => {
    localStorage.setItem('adminUser', JSON.stringify({ username: 'admin' }));
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('getDonatePopupSettings returns settings', async () => {
    const settings = { spotlightCampaignId: 'camp1' };
    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: () => Promise.resolve(settings),
    } as Response);

    const result = await getDonatePopupSettings();
    expect(result).toEqual(settings);
    expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining('/admin/config/donate-popup'), expect.any(Object));
  });

  it('getDonatePopupSettings throws on failure', async () => {
    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: false,
      status: 500,
    } as Response);

    await expect(getDonatePopupSettings()).rejects.toThrow('Failed to fetch donate popup settings');
  });

  it('updateDonatePopupSettings sends PUT request', async () => {
    const updatedSettings = { spotlightCampaignId: 'camp2' };
    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: () => Promise.resolve(updatedSettings),
    } as Response);

    const result = await updateDonatePopupSettings({ campaignId: 'camp2' });
    expect(result).toEqual(updatedSettings);
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/admin/config/donate-popup'),
      expect.objectContaining({ method: 'PUT' })
    );
  });

  it('updateDonatePopupSettings throws on failure', async () => {
    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: false,
      status: 500,
    } as Response);

    await expect(updateDonatePopupSettings({})).rejects.toThrow('Failed to update donate popup settings');
  });
});
