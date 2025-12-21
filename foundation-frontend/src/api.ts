// API Configuration
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api';

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

export interface CheckoutSessionResponse {
  sessionId: string;
  url: string;
}

export interface SiteConfig {
  featuredCampaignsCount: number;
  itemsPerPage: number;
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
};
