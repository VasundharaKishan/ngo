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
      if (url.endsWith('/admin/cms/content/section/site-settings')) {
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
      if (url.endsWith('/admin/cms/content/section/site-settings')) {
        return { ok: true, json: () => Promise.resolve(bannerPayload) };
      }
      return { ok: true, json: () => Promise.resolve({}) };
    });

    renderPage();
    await waitFor(() => expect(screen.getByText('Manage all site settings in one place')).toBeInTheDocument());
  });

  it('switches to Contact tab and shows contact form', async () => {
    seedAuthUser();
    setupMockResponses();
    renderPage();
    await screen.findByRole('heading', { name: /General Settings/ });
    fireEvent.click(screen.getByTestId('settings-tab-contact'));
    await waitFor(() => expect(screen.getByRole('heading', { name: /Contact Information/ })).toBeInTheDocument());
  });

  it('switches to Footer tab and shows footer form', async () => {
    seedAuthUser();
    setupMockResponses();
    renderPage();
    await screen.findByRole('heading', { name: /General Settings/ });
    fireEvent.click(screen.getByTestId('settings-tab-footer'));
    await waitFor(() => expect(screen.getByRole('heading', { name: /Footer Configuration/ })).toBeInTheDocument());
  });

  it('switches to Banner tab and shows banner form', async () => {
    seedAuthUser();
    setupMockResponses();
    renderPage();
    await screen.findByRole('heading', { name: /General Settings/ });
    fireEvent.click(screen.getByTestId('settings-tab-banner'));
    // Banner tab content should render
    await waitFor(() => expect(screen.queryByRole('heading', { name: /General Settings/ })).toBeNull());
  });

  it('saves contact settings', async () => {
    seedAuthUser();
    setupMockResponses();
    renderPage();
    await screen.findByRole('heading', { name: /General Settings/ });
    fireEvent.click(screen.getByTestId('settings-tab-contact'));
    await screen.findByRole('heading', { name: /Contact Information/ });
    fireEvent.click(screen.getByRole('button', { name: /Save Settings/i }));
    await waitFor(() =>
      expect(mockAuthFetch).toHaveBeenCalledWith(
        `${API_BASE_URL}/admin/config/contact`,
        expect.objectContaining({ method: 'PUT' })
      )
    );
  });

  it('saves footer settings', async () => {
    seedAuthUser();
    setupMockResponses();
    renderPage();
    await screen.findByRole('heading', { name: /General Settings/ });
    fireEvent.click(screen.getByTestId('settings-tab-footer'));
    await screen.findByRole('heading', { name: /Footer Configuration/ });
    fireEvent.click(screen.getByRole('button', { name: /Save Settings/i }));
    await waitFor(() =>
      expect(mockAuthFetch).toHaveBeenCalledWith(
        `${API_BASE_URL}/admin/config/footer`,
        expect.objectContaining({ method: 'PUT' })
      )
    );
  });

  it('adds a contact location', async () => {
    seedAuthUser();
    setupMockResponses();
    renderPage();
    await screen.findByRole('heading', { name: /General Settings/ });
    fireEvent.click(screen.getByTestId('settings-tab-contact'));
    await screen.findByRole('heading', { name: /Contact Information/ });
    const addBtn = screen.getByRole('button', { name: /Add Location/i });
    fireEvent.click(addBtn);
    await waitFor(() => expect(screen.getByPlaceholderText(/Main Office/i)).toBeInTheDocument());
  });

  it('removes a contact location', async () => {
    seedAuthUser();
    setupMockResponses();
    renderPage();
    await screen.findByRole('heading', { name: /General Settings/ });
    fireEvent.click(screen.getByTestId('settings-tab-contact'));
    await screen.findByRole('heading', { name: /Contact Information/ });
    fireEvent.click(screen.getByRole('button', { name: /Add Location/i }));
    await screen.findByPlaceholderText(/Main Office/i);
    fireEvent.click(screen.getByRole('button', { name: /^Remove$/ }));
    await waitFor(() => expect(screen.queryByPlaceholderText(/Main Office/i)).toBeNull());
  });

  it('updates location label', async () => {
    seedAuthUser();
    setupMockResponses();
    renderPage();
    await screen.findByRole('heading', { name: /General Settings/ });
    fireEvent.click(screen.getByTestId('settings-tab-contact'));
    await screen.findByRole('heading', { name: /Contact Information/ });
    fireEvent.click(screen.getByRole('button', { name: /Add Location/i }));
    const labelInput = await screen.findByPlaceholderText(/Main Office/i);
    fireEvent.change(labelInput, { target: { value: 'Test Office' } });
    expect(labelInput).toHaveValue('Test Office');
  });

  it('adds an address line within a location', async () => {
    seedAuthUser();
    setupMockResponses();
    renderPage();
    await screen.findByRole('heading', { name: /General Settings/ });
    fireEvent.click(screen.getByTestId('settings-tab-contact'));
    await screen.findByRole('heading', { name: /Contact Information/ });
    fireEvent.click(screen.getByRole('button', { name: /Add Location/i }));
    await screen.findByPlaceholderText(/Main Office/i);
    const addLineBtn = screen.getByRole('button', { name: /Add Address Line/i });
    fireEvent.click(addLineBtn);
    await waitFor(() => expect(screen.getByPlaceholderText(/Address line 2/i)).toBeInTheDocument());
  });

  it('updates footer tagline', async () => {
    seedAuthUser();
    setupMockResponses();
    renderPage();
    await screen.findByRole('heading', { name: /General Settings/ });
    fireEvent.click(screen.getByTestId('settings-tab-footer'));
    await screen.findByRole('heading', { name: /Footer Configuration/ });
    const taglineInput = screen.getByDisplayValue('Empowering communities worldwide');
    fireEvent.change(taglineInput, { target: { value: 'New tagline' } });
    expect(taglineInput).toHaveValue('New tagline');
  });

  it('validates email in contact tab before saving', async () => {
    seedAuthUser();
    setupMockResponses();
    renderPage();
    await screen.findByRole('heading', { name: /General Settings/ });
    fireEvent.click(screen.getByTestId('settings-tab-contact'));
    await screen.findByRole('heading', { name: /Contact Information/ });
    const emailInput = screen.getByPlaceholderText('info@example.org');
    fireEvent.change(emailInput, { target: { value: 'notanemail' } });
    fireEvent.click(screen.getByRole('button', { name: /Save Settings/i }));
    await waitFor(() => expect(mockToast).toHaveBeenCalledWith('Please enter a valid email address', 'error'));
  });
});
