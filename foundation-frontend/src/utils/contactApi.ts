import { API_BASE_URL } from '../api';

export interface ContactLocation {
  label: string;
  lines: string[];
  postalLabel: string;
  postalCode: string;
  mobile?: string;
}

export interface ContactInfo {
  email: string;
  locations: ContactLocation[];
  showInFooter?: boolean;
}

/**
 * Fetches contact information from the backend API
 * @returns Promise<ContactInfo>
 * @throws Error if the API request fails
 */
export async function fetchContactInfo(): Promise<ContactInfo> {
  const response = await fetch(`${API_BASE_URL}/config/public/contact`);
  
  if (!response.ok) {
    throw new Error(`Failed to fetch contact info: ${response.statusText}`);
  }
  
  const data = await response.json();
  return data;
}
