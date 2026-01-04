// API Configuration
import { API_BASE_URL } from './config/constants';
export { API_BASE_URL };

// Types matching backend DTOs
export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string;
  icon: string;
  color: string;
  active: boolean;
  displayOrder: number;
}

export interface Campaign {
  id: string;
  title: string;
  slug: string;
  shortDescription: string;
  description: string;
  targetAmount: number;
  currentAmount?: number;
  currency: string;
  active: boolean;
  categoryId?: string;
  categoryName?: string;
  categoryIcon?: string;
  categoryColor?: string;
  imageUrl?: string;
  location?: string;
  beneficiariesCount?: number;
  featured?: boolean;
  urgent?: boolean;
}

export interface DonationRequest {
  amount: number;
  currency: string;
  donorName?: string;
  donorEmail?: string;
  campaignId: string;
}

export interface DonationResponse {
  id: string;
  amount: number;
  currency: string;
  donorName: string;
  donorEmail: string;
  status: 'PENDING' | 'SUCCESS' | 'FAILED';
  stripePaymentIntentId?: string;
  stripeSessionId?: string;
  campaignId: string;
  campaignTitle: string;
  createdAt: string;
  updatedAt: string;
}

export interface DonationPageResponse {
  items: DonationResponse[];
  page: number;
  size: number;
  totalItems: number;
  totalPages: number;
}

export interface CheckoutSessionResponse {
  sessionId: string;
  url: string;
}

export interface SiteConfig {
  featuredCampaignsCount: number;
  itemsPerPage: number;
}

export interface CampaignPopupDto {
  id: string;
  title: string;
  shortDescription: string;
  imageUrl?: string;
  targetAmount: number;
  currentAmount: number;
  currency: string;
  progressPercent: number;
  badgeText: string;
  activeNote?: string;
  categoryName?: string;
  categoryIcon?: string;
}

export interface DonatePopupResponse {
  campaign: CampaignPopupDto | null;
  mode: 'SPOTLIGHT' | 'FALLBACK';
  fallbackReason?: 'NO_SPOTLIGHT_SET' | 'SPOTLIGHT_INACTIVE' | 'NO_ACTIVE_CAMPAIGNS' | null;
}

export interface CampaignSummaryDto {
  id: string;
  title: string;
  active: boolean;
  featured: boolean;
  categoryName?: string;
  updatedAt: string;
}

export interface DonatePopupSettingsResponse {
  spotlightCampaignId?: string | null;
  spotlightCampaign?: CampaignSummaryDto | null;
}

export interface DonatePopupSettingsRequest {
  campaignId?: string | null;
}

// API Functions
export const api = {
  // Get public site configuration
  getPublicConfig: async (): Promise<SiteConfig> => {
    const response = await fetch(`${API_BASE_URL}/config/public`);
    if (!response.ok) {
      // Return defaults if fetch fails
      return {
        featuredCampaignsCount: 3,
        itemsPerPage: 12
      };
    }
    return response.json();
  },
  // Get all active categories
  getCategories: async (): Promise<Category[]> => {
    const response = await fetch(`${API_BASE_URL}/categories`);
    if (!response.ok) throw new Error('Failed to fetch categories');
    return response.json();
  },

  // Get campaigns with optional filters
  getCampaigns: async (filters?: { 
    categoryId?: string; 
    featured?: boolean; 
    urgent?: boolean;
    limit?: number;
  }): Promise<Campaign[]> => {
    const params = new URLSearchParams();
    if (filters?.categoryId) params.append('categoryId', filters.categoryId);
    if (filters?.featured !== undefined) params.append('featured', String(filters.featured));
    if (filters?.urgent !== undefined) params.append('urgent', String(filters.urgent));
    if (filters?.limit !== undefined) params.append('limit', String(filters.limit));
    
    const url = `${API_BASE_URL}/campaigns${params.toString() ? '?' + params.toString() : ''}`;
    const response = await fetch(url);
    if (!response.ok) throw new Error('Failed to fetch campaigns');
    return response.json();
  },

  // Get single campaign by ID
  getCampaign: async (id: string): Promise<Campaign> => {
    const response = await fetch(`${API_BASE_URL}/campaigns/${id}`);
    if (!response.ok) throw new Error('Failed to fetch campaign');
    return response.json();
  },

  // Create Stripe checkout session
  createStripeSession: async (request: DonationRequest): Promise<CheckoutSessionResponse> => {
    const response = await fetch(`${API_BASE_URL}/donations/stripe/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });
    if (!response.ok) throw new Error('Failed to create checkout session');
    return response.json();
  },
  
  // Get donate popup campaign (spotlight or fallback)
  getDonatePopup: async (): Promise<DonatePopupResponse> => {
    const response = await fetch(`${API_BASE_URL}/config/public/donate-popup`);
    if (!response.ok) throw new Error('Failed to fetch donate popup campaign');
    return response.json();
  },
};

// Admin API utilities (requires authentication)
export const authFetch = async (url: string, options: RequestInit = {}) => {
  // Check if user is logged in (using adminUser in localStorage as indicator)
  const adminUser = localStorage.getItem('adminUser');
  if (!adminUser) {
    throw new Error('No authentication token found');
  }

  // Use cookies for authentication (httpOnly cookies are sent automatically)
  const response = await fetch(url, {
    ...options,
    credentials: 'include', // Important: Include cookies in the request
    headers: {
      ...options.headers,
      'Content-Type': 'application/json',
    },
  });

  if (response.status === 401) {
    localStorage.removeItem('adminUser');
    window.location.href = '/admin/login';
    throw new Error('Unauthorized');
  }

  return response;
};

export interface DonationFilters {
  page?: number;
  size?: number;
  sort?: string;
  q?: string;
  status?: string;
}

export const fetchDonationsPaginated = async (filters: DonationFilters): Promise<DonationPageResponse> => {
  const params = new URLSearchParams();
  if (filters.page !== undefined) params.set('page', String(filters.page));
  if (filters.size !== undefined) params.set('size', String(filters.size));
  if (filters.sort) params.set('sort', filters.sort);
  if (filters.q) params.set('q', filters.q);
  if (filters.status && filters.status !== 'ALL') params.set('status', filters.status);

  const url = `${API_BASE_URL}/admin/donations?${params.toString()}`;
  const response = await authFetch(url);
  
  if (!response.ok) {
    throw new Error('Failed to fetch donations');
  }
  
  return response.json();
};

// Admin API for donate popup settings
export const getDonatePopupSettings = async (): Promise<DonatePopupSettingsResponse> => {
  const url = `${API_BASE_URL}/admin/config/donate-popup`;
  const response = await authFetch(url);
  
  if (!response.ok) {
    throw new Error('Failed to fetch donate popup settings');
  }
  
  return response.json();
};

export const updateDonatePopupSettings = async (request: DonatePopupSettingsRequest): Promise<DonatePopupSettingsResponse> => {
  const url = `${API_BASE_URL}/admin/config/donate-popup`;
  const response = await authFetch(url, {
    method: 'PUT',
    body: JSON.stringify(request),
  });
  
  if (!response.ok) {
    throw new Error('Failed to update donate popup settings');
  }
  
  return response.json();
};
