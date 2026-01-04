// CMS API Service
import { API_BASE_URL } from './config/constants';
const API_BASE = `${API_BASE_URL}/cms`;

export interface Testimonial {
  id: string;
  authorName: string;
  authorTitle: string;
  testimonialText: string;
  displayOrder: number;
  active: boolean;
}

export interface HomepageStat {
  id: string;
  statLabel: string;
  statValue: string;
  icon: string | null;
  displayOrder: number;
  active: boolean;
}

export interface SocialMedia {
  id: string;
  platform: string;
  url: string;
  icon: string;
  displayOrder: number;
  active: boolean;
}

export interface CarouselImage {
  id: string;
  imageUrl: string;
  altText: string | null;
  displayOrder: number;
  active: boolean;
}

export const cmsApi = {
  getContent: async (section: string): Promise<Record<string, string>> => {
    const response = await fetch(`${API_BASE}/content/${section}`);
    if (!response.ok) throw new Error('Failed to fetch content');
    return response.json();
  },
  
  getTestimonials: async (): Promise<Testimonial[]> => {
    const response = await fetch(`${API_BASE}/testimonials`);
    if (!response.ok) throw new Error('Failed to fetch testimonials');
    return response.json();
  },
  
  getStats: async (): Promise<HomepageStat[]> => {
    const response = await fetch(`${API_BASE}/stats`);
    if (!response.ok) throw new Error('Failed to fetch stats');
    return response.json();
  },
  
  getSocialMedia: async (): Promise<SocialMedia[]> => {
    const response = await fetch(`${API_BASE}/social-media`);
    if (!response.ok) throw new Error('Failed to fetch social media');
    return response.json();
  },
  
  getCarouselImages: async (): Promise<CarouselImage[]> => {
    const response = await fetch(`${API_BASE}/carousel`);
    if (!response.ok) throw new Error('Failed to fetch carousel images');
    return response.json();
  }
};
