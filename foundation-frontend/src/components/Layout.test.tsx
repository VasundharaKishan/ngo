import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Layout from './Layout';
import { ConfigProvider } from '../contexts/ConfigContext';

const mockContactInfo = {
  email: 'info@test.org',
  phone: '123',
  address: ['street'],
  socialMedia: [],
};

const fetchMock = vi.fn();

const renderWithProviders = () =>
  render(
    <ConfigProvider value={{ siteName: 'Test Site', logoUrl: '/logo.png', primaryColor: '#000', secondaryColor: '#000' }}>
      <MemoryRouter>
        <Layout />
      </MemoryRouter>
    </ConfigProvider>
  );

describe('Layout', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    // @ts-expect-error override global fetch
    global.fetch = fetchMock;
    fetchMock.mockImplementation((url: string) => {
      if (url.includes('/config/public/contact')) {
        return Promise.resolve({ ok: true, json: async () => mockContactInfo });
      }
      if (url.includes('/cms/content/site-settings')) {
        return Promise.resolve({ ok: true, json: async () => [] });
      }
      if (url.includes('/cms/social-media')) {
        return Promise.resolve({ ok: true, json: async () => [] });
      }
      if (url.includes('/cms/content/footer')) {
        return Promise.resolve({ ok: true, json: async () => [] });
      }
      return Promise.resolve({ ok: true, json: async () => [] });
    });
  });

  it('renders header with site name and opens donate modal', async () => {
    renderWithProviders();

    expect(await screen.findByRole('banner')).toBeInTheDocument();
    expect(screen.getAllByText(/Yugal Savitri Seva/i).length).toBeGreaterThan(0);

    fireEvent.click(screen.getByRole('link', { name: /Open donation form/i }));

    await waitFor(() => expect(screen.getByText(/No active campaigns available/i)).toBeInTheDocument());
  });
});
