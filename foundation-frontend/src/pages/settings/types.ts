export type TabType = 'general' | 'contact' | 'footer' | 'banner';

export interface TabRef {
  save: () => Promise<void>;
}

export interface SiteSetting {
  key: string;
  value: string;
  type: 'STRING' | 'INTEGER' | 'BOOLEAN' | 'JSON';
  isPublic: boolean;
  description: string;
  createdAt: string;
  updatedAt: string;
  updatedBy: string;
}

export interface ContactLocation {
  label: string;
  lines: string[];
  postalLabel: string;
  postalCode: string;
  mobile: string;
}

export interface ContactInfo {
  email: string;
  locations: ContactLocation[];
  showInFooter?: boolean;
}

export interface SocialMediaLinks {
  facebook: string;
  twitter: string;
  instagram: string;
  youtube: string;
  linkedin: string;
}

export interface FooterConfig {
  tagline: string;
  socialMedia: SocialMediaLinks;
  showQuickLinks: boolean;
  showGetInvolved: boolean;
  copyrightText: string;
  disclaimerText: string;
}

export interface BannerSettings {
  enabled: boolean;
  message: string;
}

export interface SettingField {
  key: string;
  label: string;
  type: 'text' | 'number' | 'color' | 'textarea';
  placeholder?: string;
  description?: string;
  category: 'branding' | 'theme' | 'pagination';
}

export const GENERAL_SETTINGS: SettingField[] = [
  // Branding
  { key: 'site.name', label: 'Site Name', type: 'text', placeholder: 'Yugal Savitri Seva', description: 'Site name displayed in header and footer', category: 'branding' },
  { key: 'site.tagline', label: 'Site Tagline', type: 'text', placeholder: 'Empowering communities worldwide', description: 'Site tagline or slogan', category: 'branding' },
  { key: 'site.logo_url', label: 'Logo URL', type: 'text', placeholder: '/logo.png', description: 'Path to site logo image', category: 'branding' },

  // Theme
  { key: 'theme.primary_color', label: 'Primary Color', type: 'color', placeholder: '#2563eb', description: 'Primary brand color', category: 'theme' },
  { key: 'theme.secondary_color', label: 'Secondary Color', type: 'color', placeholder: '#7c3aed', description: 'Secondary brand color', category: 'theme' },
  { key: 'theme.header_height', label: 'Header Height', type: 'text', placeholder: '76px', description: 'Header height (include unit: px, rem)', category: 'theme' },

  // Pagination
  { key: 'homepage.featured_campaigns_count', label: 'Featured Campaigns Count', type: 'number', placeholder: '3', description: 'Number of featured campaigns on homepage', category: 'pagination' },
  { key: 'campaigns_page.items_per_page', label: 'Items Per Page', type: 'number', placeholder: '12', description: 'Number of campaigns per page', category: 'pagination' },
];

export const buildGeneralSettingTestId = (key: string) => `settings-input-${key.replace(/\./g, '-')}`;
