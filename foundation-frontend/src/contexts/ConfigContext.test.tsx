import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, act } from '@testing-library/react';
import { ConfigProvider, useConfig, useSiteName, useSiteTagline, useSiteLogo, useFeaturedCampaignsCount, useCampaignsPerPage } from './ConfigContext';

const mockConfig = {
  'site.name': 'Test Foundation',
  'site.tagline': 'Helping the world',
  'site.logo_url': 'https://cdn.example.com/logo.png',
  'theme.primary_color': '#ff0000',
  'theme.secondary_color': '#00ff00',
  'theme.header_height': '80px',
  'homepage.featured_campaigns_count': '5',
  'campaigns_page.items_per_page': '20',
  'contact.email': 'info@test.org',
  'contact.phone': '+1234567890',
};

function TestConsumer() {
  const { config, loading, error } = useConfig();
  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;
  return <div data-testid="config">{config['site.name']}</div>;
}

function HelperHookConsumer() {
  const name = useSiteName();
  const tagline = useSiteTagline();
  const logo = useSiteLogo();
  const count = useFeaturedCampaignsCount();
  const perPage = useCampaignsPerPage();
  return (
    <div>
      <span data-testid="name">{name}</span>
      <span data-testid="tagline">{tagline}</span>
      <span data-testid="logo">{logo}</span>
      <span data-testid="count">{count}</span>
      <span data-testid="perPage">{perPage}</span>
    </div>
  );
}

describe('ConfigContext', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('fetches config and provides values to consumers', async () => {
    (fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockConfig),
    });

    render(
      <ConfigProvider>
        <TestConsumer />
      </ConfigProvider>
    );

    expect(screen.getByText('Loading...')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByTestId('config')).toHaveTextContent('Test Foundation');
    });
  });

  it('falls back to defaults on API failure', async () => {
    (fetch as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new Error('Network error'));

    function DefaultsConsumer() {
      const { config, loading, error } = useConfig();
      if (loading) return <div>Loading...</div>;
      return (
        <div>
          {error && <span data-testid="error">{error.message}</span>}
          <span data-testid="name">{config['site.name']}</span>
        </div>
      );
    }

    render(
      <ConfigProvider>
        <DefaultsConsumer />
      </ConfigProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('error')).toHaveTextContent('Network error');
      expect(screen.getByTestId('name')).toHaveTextContent('Your Organisation');
    });
  });

  it('falls back to defaults on non-ok response', async () => {
    (fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: false,
      status: 500,
    });

    render(
      <ConfigProvider>
        <TestConsumer />
      </ConfigProvider>
    );

    await waitFor(() => {
      expect(screen.getByText(/Error:/)).toBeInTheDocument();
    });
  });

  it('merges API response with defaults', async () => {
    (fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ 'site.name': 'Partial Config' }),
    });

    render(
      <ConfigProvider>
        <HelperHookConsumer />
      </ConfigProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('name')).toHaveTextContent('Partial Config');
      expect(screen.getByTestId('tagline')).toHaveTextContent('Empowering communities worldwide');
    });
  });

  it('throws when useConfig is used outside ConfigProvider', () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => render(<TestConsumer />)).toThrow('useConfig must be used within a ConfigProvider');
    consoleError.mockRestore();
  });

  it('helper hooks return correct values from config', async () => {
    (fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockConfig),
    });

    render(
      <ConfigProvider>
        <HelperHookConsumer />
      </ConfigProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('name')).toHaveTextContent('Test Foundation');
      expect(screen.getByTestId('tagline')).toHaveTextContent('Helping the world');
      expect(screen.getByTestId('logo')).toHaveTextContent('https://cdn.example.com/logo.png');
      expect(screen.getByTestId('count')).toHaveTextContent('5');
      expect(screen.getByTestId('perPage')).toHaveTextContent('20');
    });
  });

  it('useCampaignsPerPage guards against 0 or NaN', async () => {
    (fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ ...mockConfig, 'campaigns_page.items_per_page': '0' }),
    });

    render(
      <ConfigProvider>
        <HelperHookConsumer />
      </ConfigProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('perPage')).toHaveTextContent('12');
    });
  });

  it('useSiteLogo prepends origin for relative paths', async () => {
    (fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ ...mockConfig, 'site.logo_url': '/uploads/logo.png' }),
    });

    render(
      <ConfigProvider>
        <HelperHookConsumer />
      </ConfigProvider>
    );

    await waitFor(() => {
      const logo = screen.getByTestId('logo').textContent!;
      expect(logo).toMatch(/^https?:\/\/.+\/uploads\/logo\.png$/);
    });
  });

  it('applies theme CSS variables to document root', async () => {
    (fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockConfig),
    });

    render(
      <ConfigProvider>
        <TestConsumer />
      </ConfigProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('config')).toBeInTheDocument();
    });

    const root = document.documentElement;
    expect(root.style.getPropertyValue('--primary')).toBe('#ff0000');
    expect(root.style.getPropertyValue('--secondary')).toBe('#00ff00');
    expect(root.style.getPropertyValue('--header-height')).toBe('80px');
  });

  it('refetch triggers a fresh API call', async () => {
    const fetchMock = fetch as ReturnType<typeof vi.fn>;
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockConfig),
    });

    function RefetchConsumer() {
      const { config, refetch } = useConfig();
      return (
        <div>
          <span data-testid="name">{config['site.name']}</span>
          <button onClick={() => refetch()}>Refetch</button>
        </div>
      );
    }

    const { getByText } = render(
      <ConfigProvider>
        <RefetchConsumer />
      </ConfigProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('name')).toHaveTextContent('Test Foundation');
    });

    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ ...mockConfig, 'site.name': 'Updated Foundation' }),
    });

    await act(async () => {
      getByText('Refetch').click();
    });

    await waitFor(() => {
      expect(screen.getByTestId('name')).toHaveTextContent('Updated Foundation');
    });

    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});
