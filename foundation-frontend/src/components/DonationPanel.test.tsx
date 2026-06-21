import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import DonationPanel from './DonationPanel';
import { useDonationPresets } from '../hooks/useDonationPresets';
import { useMoneyAllocations } from '../hooks/useMoneyAllocations';
import { useStories } from '../hooks/useStories';
import { useRegistrationInfo } from '../hooks/useRegistrationInfo';

vi.mock('../hooks/useDonationPresets');
vi.mock('../hooks/useMoneyAllocations');
vi.mock('../hooks/useStories');
vi.mock('../hooks/useRegistrationInfo');

const mockPresets = {
  presets: [
    { amountMinorUnits: 50000, label: 'Feeds a child for a week' },
    { amountMinorUnits: 150000, label: 'School kit for one child' },
    { amountMinorUnits: 500000, label: 'One term of tuition' },
  ],
  defaultAmountMinorUnits: 50000,
};

const mockAllocations = [
  { id: '1', percentage: 70, label: 'Education', colorHex: '#ff0000', description: 'Direct teaching' },
  { id: '2', percentage: 30, label: 'Admin', colorHex: '#0000ff', description: null },
];

const mockStories = [
  { quote: 'This changed my life', attribution: 'Priya', location: 'Mumbai' },
];

function renderPanel() {
  return render(
    <MemoryRouter>
      <DonationPanel />
    </MemoryRouter>,
  );
}

describe('DonationPanel', () => {
  beforeEach(() => {
    vi.mocked(useDonationPresets).mockReturnValue({ loading: false, data: mockPresets } as any);
    vi.mocked(useMoneyAllocations).mockReturnValue({ loading: false, allocations: mockAllocations } as any);
    vi.mocked(useStories).mockReturnValue({ loading: false, stories: mockStories } as any);
    vi.mocked(useRegistrationInfo).mockReturnValue({ eightyGActive: true } as any);
  });

  it('renders preset amount buttons from API data', () => {
    renderPanel();
    const buttons = screen.getAllByRole('button', { pressed: false });
    const amountTexts = buttons.map(b => b.textContent);
    expect(amountTexts.some(t => t?.includes('₹1,500'))).toBe(true);
    expect(amountTexts.some(t => t?.includes('₹5,000'))).toBe(true);
  });

  it('renders impact labels on preset buttons', () => {
    renderPanel();
    expect(screen.getByText('Feeds a child for a week')).toBeInTheDocument();
    expect(screen.getByText('School kit for one child')).toBeInTheDocument();
  });

  it('selects a preset amount on click', () => {
    renderPanel();
    const btn = screen.getByText('₹1,500').closest('button')!;
    fireEvent.click(btn);
    expect(btn).toHaveAttribute('aria-pressed', 'true');
  });

  it('allows custom amount input', () => {
    renderPanel();
    const input = screen.getByPlaceholderText('Other amount');
    fireEvent.change(input, { target: { value: '2000' } });
    expect(input).toHaveValue(2000);
  });

  it('renders allocation breakdown', () => {
    renderPanel();
    expect(screen.getByText('Where your money goes')).toBeInTheDocument();
    expect(screen.getByText(/70%/)).toBeInTheDocument();
    expect(screen.getByText(/Education/)).toBeInTheDocument();
    expect(screen.getByText(/30%/)).toBeInTheDocument();
  });

  it('renders testimonial quote', () => {
    renderPanel();
    expect(screen.getByText(/This changed my life/)).toBeInTheDocument();
    expect(screen.getByText(/Priya/)).toBeInTheDocument();
    expect(screen.getByText(/Mumbai/)).toBeInTheDocument();
  });

  it('shows 80G disclaimer when active', () => {
    renderPanel();
    expect(screen.getByText(/eligible for 80G tax deduction/)).toBeInTheDocument();
  });

  it('shows alternative disclaimer when 80G not active', () => {
    vi.mocked(useRegistrationInfo).mockReturnValue({ eightyGActive: false } as any);
    renderPanel();
    expect(screen.getByText(/80G tax deduction not yet available/)).toBeInTheDocument();
  });

  it('hides allocations when empty', () => {
    vi.mocked(useMoneyAllocations).mockReturnValue({ loading: false, allocations: [] } as any);
    renderPanel();
    expect(screen.queryByText('Where your money goes')).not.toBeInTheDocument();
  });

  it('hides testimonial when no stories', () => {
    vi.mocked(useStories).mockReturnValue({ loading: false, stories: [] } as any);
    renderPanel();
    expect(screen.queryByText(/This changed my life/)).not.toBeInTheDocument();
  });

  it('renders CTA link with correct amount', () => {
    renderPanel();
    const link = screen.getByText(/Proceed to secure payment/).closest('a')!;
    expect(link).toHaveAttribute('href', expect.stringContaining('amount=50000'));
  });

  it('uses fallback presets when API returns no data', () => {
    vi.mocked(useDonationPresets).mockReturnValue({ loading: false, data: null } as any);
    renderPanel();
    expect(screen.getByText('₹15,000')).toBeInTheDocument();
    expect(screen.getByText('Library shelf in their name')).toBeInTheDocument();
  });
});
