import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import AccessibilityPage from './AccessibilityPage';
import TermsPage from './TermsPage';
import PrivacyPage from './PrivacyPage';
import CookiesPage from './CookiesPage';

describe('Legal/Policy pages', () => {
  it('renders Accessibility statement content', () => {
    render(<AccessibilityPage />);
    expect(screen.getByText('Accessibility Statement')).toBeInTheDocument();
    expect(screen.getByText(/Last Updated/i)).toHaveTextContent('December 2024');
    expect(screen.getByText(/Our Commitment/)).toBeInTheDocument();
  });

  it('renders Terms page content', () => {
    render(<TermsPage />);
    expect(screen.getByText('Terms and Conditions')).toBeInTheDocument();
    expect(screen.getByText(/Acceptance of Terms/)).toBeInTheDocument();
    expect(screen.getByText(/donate@yugalsavitriseva.org/)).toBeInTheDocument();
  });

  it('renders Privacy page content', () => {
    render(<PrivacyPage />);
    expect(screen.getByText('Privacy Statement')).toBeInTheDocument();
    expect(screen.getByText(/Information We Collect/)).toBeInTheDocument();
    expect(screen.getByText(/Last Updated/)).toBeInTheDocument();
  });

  it('renders Cookies page content', () => {
    render(<CookiesPage />);
    expect(screen.getByText('Cookie Policy')).toBeInTheDocument();
    expect(screen.getByText(/How We Use Cookies/)).toBeInTheDocument();
    expect(screen.getByText(/Managing Cookies/)).toBeInTheDocument();
  });
});
