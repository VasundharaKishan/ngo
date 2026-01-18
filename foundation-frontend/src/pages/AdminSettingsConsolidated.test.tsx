import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import AdminSettingsConsolidated from './AdminSettingsConsolidated';
import { API_BASE_URL } from '../api';

const mockAuthFetch = vi.fn();
const mockToast = vi.fn();

vi.mock('../utils/auth', () => ({
  authFetch: (...args: unknown[]) => mockAuthFetch(...args),
}));

vi.mock('../components/ToastProvider', () => ({
  useToast: () => mockToast,
}));

describe('AdminSettingsConsolidated', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  afterEach(() => {
    localStorage.clear();
  });

  const renderPage = () =>
    render(
      <MemoryRouter>
        <AdminSettingsConsolidated />
      </MemoryRouter>
    );

  const seedAuthUser = () => {
    localStorage.setItem('adminUser', JSON.stringify({ name: 'Admin' }));
  };

  const baseSettingsPayload = [
    {
      key: 'site.name',
      value: 'Yugal Savitri Seva',
      type: 'STRING',
      isPublic: true,
      description: 'Site name displayed in header',
      createdAt: '',
      updatedAt: '',
      updatedBy: 'system',
    },
    {
      key: 'theme.primary_color',
      value: '#2563eb',
      type: 'STRING',
      isPublic: true,
      description: 'Primary color used in branding',
      createdAt: '',
      updatedAt: '',
      updatedBy: 'system',
    },
  ];

  const contactPayload = {
    email: 'info@yugalsavitriseva.org',
    locations: [],
    showInFooter: true,
  };

  const footerPayload = {
    tagline: 'Empowering communities worldwide',
    socialMedia: {
      facebook: '',
      twitter: '',
      instagram: '',
      youtube: '',
      linkedin: '',
    },
    showQuickLinks: true,
    showGetInvolved: true,
    copyrightText: '',
    disclaimerText: '',
  };

  const bannerPayload = [
    {
      key: 'development_banner',
      value: 'Website is under development',
      active: true,
    },
  ];

  const setupMockResponses = (options?: { settings?: typeof baseSettingsPayload }) => {
    const settingsData = options?.settings ?? baseSettingsPayload;

    mockAuthFetch.mockImplementation(async (url: string, requestOptions?: unknown) => {
      if (url.endsWith('/admin/settings/batch') && (requestOptions as any)?.method === 'PUT') {
        return { ok: true, json: () => Promise.resolve({}) };
      }
      if (url.endsWith('/admin/settings')) {
        return { ok: true, json: () => Promise.resolve(settingsData) };
      }
      if (url.endsWith('/admin/config/contact')) {
        return { ok: true, json: () => Promise.resolve(contactPayload) };
      }
      if (url.endsWith('/admin/config/footer')) {
        return { ok: true, json: () => Promise.resolve(footerPayload) };
      }
      if (url.endsWith('/admin/cms/content/site-settings')) {
        return { ok: true, json: () => Promise.resolve(bannerPayload) };
      }
      return { ok: true, json: () => Promise.resolve({}) };
    });
  };

  it('loads settings on mount and shows every section tab', async () => {
    seedAuthUser();
    setupMockResponses();

    renderPage();

    expect(screen.getByText(/Loading settings/)).toBeInTheDocument();
    await waitFor(() => expect(mockAuthFetch).toHaveBeenCalledWith(`${API_BASE_URL}/admin/settings`));
    expect(screen.getByRole('heading', { name: /General Settings/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^Contact$/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^Footer$/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^Banner$/ })).toBeInTheDocument();
  });

  it('saves updated general settings', async () => {
    seedAuthUser();
    setupMockResponses({
      settings: [
        {
          key: 'site.name',
          value: 'Name',
          type: 'STRING',
          isPublic: true,
          description: 'Site name',
          createdAt: '',
          updatedAt: '',
          updatedBy: 'admin',
        },
      ],
    });

    renderPage();
    const siteNameInput = await screen.findByLabelText('Site Name');
    expect(siteNameInput).toHaveValue('Name');

    fireEvent.change(siteNameInput, { target: { value: 'Updated Name' } });
    fireEvent.click(screen.getByRole('button', { name: /Save Settings/i }));

    await waitFor(() =>
      expect(mockAuthFetch).toHaveBeenCalledWith(
        `${API_BASE_URL}/admin/settings/batch`,
        expect.objectContaining({ method: 'PUT' })
      )
    );
    expect(mockToast).toHaveBeenCalledWith('General settings saved successfully', 'success');
  });

  it('still renders when general settings fail to load', async () => {
    seedAuthUser();
    mockAuthFetch.mockImplementation(async (url: string) => {
      if (url.endsWith('/admin/settings')) {
        return { ok: false, json: () => Promise.resolve([]) };
      }
      if (url.endsWith('/admin/config/contact')) {
        return { ok: true, json: () => Promise.resolve(contactPayload) };
      }
      if (url.endsWith('/admin/config/footer')) {
        return { ok: true, json: () => Promise.resolve(footerPayload) };
      }
      if (url.endsWith('/admin/cms/content/site-settings')) {
        return { ok: true, json: () => Promise.resolve(bannerPayload) };
      }
      return { ok: true, json: () => Promise.resolve({}) };
    });

    renderPage();
    await waitFor(() => expect(screen.getByText('Manage all site settings in one place')).toBeInTheDocument());
  });
});
