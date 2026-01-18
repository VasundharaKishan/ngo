import { describe, it, expect, vi, beforeEach } from 'vitest';
import { authFetch, getAuthToken, withAuthHeaders } from './auth';
import { API_BASE_URL } from '../config/constants';

const okResponse = {
  status: 200,
  ok: true,
  json: async () => ({}),
} as Response;

describe('auth utilities', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    document.cookie = '';
  });

  it('getAuthToken returns null and withAuthHeaders passes through', () => {
    expect(getAuthToken()).toBeNull();
    const headers = { foo: 'bar' } as HeadersInit;
    expect(withAuthHeaders(headers)).toBe(headers);
  });

  it('authFetch adds JSON content-type and CSRF header when cookie exists', async () => {
    document.cookie = 'XSRF-TOKEN=csrf-token';
    const fetchMock = vi.fn().mockResolvedValue(okResponse);
    global.fetch = fetchMock as any;

    await authFetch('/secure', { method: 'POST', body: JSON.stringify({ hello: 'world' }) });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [, options] = fetchMock.mock.calls[0];
    const headers = options?.headers as Headers;
    expect(headers.get('Content-Type')).toBe('application/json');
    expect(headers.get('X-XSRF-TOKEN')).toBe('csrf-token');
    expect(options?.credentials).toBe('include');
  });

  it('authFetch retries once on CSRF 403 and uses refreshed token', async () => {
    document.cookie = 'XSRF-TOKEN=old-token';

    const csrfError = {
      status: 403,
      ok: false,
      clone: () => ({ json: async () => ({ message: 'CSRF token invalid' }) }),
      json: async () => ({ message: 'CSRF token invalid' }),
    } as Response;

    const refreshOk = { ...okResponse };
    const success = { ...okResponse, json: async () => ({ success: true }) } as Response;

    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(csrfError) // initial request
      .mockImplementationOnce((url: string) => { // csrf refresh
        expect(url).toBe(`${API_BASE_URL}/auth/csrf`);
        document.cookie = 'XSRF-TOKEN=new-token';
        return Promise.resolve(refreshOk);
      })
      .mockResolvedValueOnce(success); // retry
    global.fetch = fetchMock as any;

    const response = await authFetch('/secure', { method: 'POST', body: JSON.stringify({}) });
    expect(response).toBe(success);
    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(fetchMock).toHaveBeenNthCalledWith(2, `${API_BASE_URL}/auth/csrf`, expect.any(Object));

    const [, retryOptions] = fetchMock.mock.calls[2];
    const retryHeaders = retryOptions?.headers as Headers;
    expect(retryHeaders.get('X-XSRF-TOKEN')).toBe('new-token');
  });
});
