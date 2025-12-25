export const getAuthToken = (): string | null => {
  return localStorage.getItem('adminToken');
};

export const withAuthHeaders = (headers: HeadersInit = {}): HeadersInit => {
  const token = getAuthToken();
  if (!token) return headers;
  return {
    ...headers,
    Authorization: `Bearer ${token}`
  };
};

export const authFetch = (url: string, options: RequestInit = {}) => {
  const token = getAuthToken();
  const headers = new Headers(options.headers || {});

  if (options.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  return fetch(url, { ...options, headers });
};
