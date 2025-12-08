// API Configuration
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api';

// Types matching backend DTOs
export interface Campaign {
  id: string;
  title: string;
  slug: string;
  shortDescription: string;
  description: string;
  targetAmount: number;
  currency: string;
  active: boolean;
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

// API Functions
export const api = {
  // Get all active campaigns
  getCampaigns: async (): Promise<Campaign[]> => {
    const response = await fetch(`${API_BASE_URL}/campaigns`);
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
