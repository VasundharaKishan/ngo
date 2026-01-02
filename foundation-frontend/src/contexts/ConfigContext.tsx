import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { API_BASE_URL } from '../api';

export interface SiteConfig {
  'homepage.featured_campaigns_count'?: string;
  'campaigns_page.items_per_page'?: string;
  'site.name'?: string;
  'site.tagline'?: string;
  'site.logo_url'?: string;
  'theme.primary_color'?: string;
  'theme.secondary_color'?: string;
  'theme.header_height'?: string;
  'contact.email'?: string;
  'contact.phone'?: string;
  [key: string]: string | undefined;
}

interface ConfigContextValue {
  config: SiteConfig;
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

const ConfigContext = createContext<ConfigContextValue | undefined>(undefined);

// Default values for graceful fallbacks
const DEFAULT_CONFIG: SiteConfig = {
  'site.name': 'Yugal Savitri Seva',
  'site.tagline': 'Empowering communities worldwide',
  'site.logo_url': '/logo.png',
  'theme.primary_color': '#2563eb',
  'theme.secondary_color': '#7c3aed',
  'theme.header_height': '76px',
  'homepage.featured_campaigns_count': '3',
  'campaigns_page.items_per_page': '12',
  'contact.email': 'info@yugalsavitriseva.org',
  'contact.phone': '+977-1-1234567',
};

export function ConfigProvider({ children }: { children: ReactNode }) {
  const [config, setConfig] = useState<SiteConfig>(DEFAULT_CONFIG);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchConfig = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`${API_BASE_URL}/settings/public`, {
        headers: {
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch config: ${response.status}`);
      }

      const data: SiteConfig = await response.json();
      
      // Merge with defaults to ensure all required keys exist
      const mergedConfig = { ...DEFAULT_CONFIG, ...data };
      setConfig(mergedConfig);
      
      // Apply theme CSS variables to document root
      applyThemeVariables(mergedConfig);
      
      console.log('Site configuration loaded:', mergedConfig);
    } catch (err) {
      console.error('Failed to load site configuration:', err);
      setError(err instanceof Error ? err : new Error('Unknown error'));
      
      // Continue with defaults on error
      setConfig(DEFAULT_CONFIG);
      applyThemeVariables(DEFAULT_CONFIG);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConfig();
  }, []);

  const value: ConfigContextValue = {
    config,
    loading,
    error,
    refetch: fetchConfig,
  };

  return <ConfigContext.Provider value={value}>{children}</ConfigContext.Provider>;
}

export function useConfig(): ConfigContextValue {
  const context = useContext(ConfigContext);
  if (context === undefined) {
    throw new Error('useConfig must be used within a ConfigProvider');
  }
  return context;
}

// Helper function to apply theme variables to CSS
function applyThemeVariables(config: SiteConfig) {
  const root = document.documentElement;

  // Map config keys to CSS variable names
  const themeMap: Record<string, string> = {
    'theme.primary_color': '--primary',
    'theme.secondary_color': '--secondary',
    'theme.header_height': '--header-height',
  };

  Object.entries(themeMap).forEach(([configKey, cssVar]) => {
    const value = config[configKey];
    if (value) {
      root.style.setProperty(cssVar, value);
      console.log(`Applied CSS variable: ${cssVar} = ${value}`);
    }
  });

  // Update meta theme-color for mobile browsers
  const primaryColor = config['theme.primary_color'];
  if (primaryColor) {
    let metaTheme = document.querySelector('meta[name="theme-color"]');
    if (!metaTheme) {
      metaTheme = document.createElement('meta');
      metaTheme.setAttribute('name', 'theme-color');
      document.head.appendChild(metaTheme);
    }
    metaTheme.setAttribute('content', primaryColor);
  }
}

// Helper hooks for commonly used config values
export function useSiteName(): string {
  const { config } = useConfig();
  return config['site.name'] || DEFAULT_CONFIG['site.name']!;
}

export function useSiteTagline(): string {
  const { config } = useConfig();
  return config['site.tagline'] || DEFAULT_CONFIG['site.tagline']!;
}

export function useSiteLogo(): string {
  const { config } = useConfig();
  return config['site.logo_url'] || DEFAULT_CONFIG['site.logo_url']!;
}

export function useFeaturedCampaignsCount(): number {
  const { config } = useConfig();
  const value = config['homepage.featured_campaigns_count'] || DEFAULT_CONFIG['homepage.featured_campaigns_count'];
  return parseInt(value!, 10);
}

export function useCampaignsPerPage(): number {
  const { config } = useConfig();
  const value = config['campaigns_page.items_per_page'] || DEFAULT_CONFIG['campaigns_page.items_per_page'];
  return parseInt(value!, 10);
}
