# Foundation Frontend - Donation Platform

React + TypeScript + Vite frontend application for the charity foundation donation platform.

## Tech Stack

- **React 18** - UI library
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server
- **React Router** - Client-side routing
- **CSS Modules** - Component styling

## Project Structure

```
src/
├── api.ts                 # API client and TypeScript types
├── components/
│   ├── Layout.tsx         # Main layout with header and footer
│   └── Layout.css
├── pages/
│   ├── Home.tsx           # Landing page with featured campaigns
│   ├── Home.css
│   ├── CampaignList.tsx   # All campaigns listing
│   ├── CampaignList.css
│   ├── CampaignDetail.tsx # Single campaign details
│   ├── CampaignDetail.css
│   ├── DonationForm.tsx   # Donation form with Stripe integration
│   ├── DonationForm.css
│   ├── Success.tsx        # Payment success page
│   ├── Cancel.tsx         # Payment cancellation page
│   └── Success.css
├── App.tsx                # Root component with routing
├── main.tsx              # Application entry point
└── index.css             # Global styles
```

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Backend API running on `http://localhost:8080`

### Installation

```bash
npm install
```

### Environment Variables

Create a `.env` file:

```env
VITE_API_BASE_URL=http://localhost:8080/api
```

### Development

```bash
npm run dev
```

The app will be available at `http://localhost:5173/`

### Build for Production

```bash
npm run build
```

The production files will be in the `dist/` directory.

### Preview Production Build

```bash
npm run preview
```

## Features

### Pages and Routes

- **/** - Home page with featured campaigns
- **/campaigns** - List of all active campaigns
- **/campaigns/:id** - Campaign detail page
- **/donate/:campaignId** - Donation form
- **/donate/success** - Payment success confirmation
- **/donate/cancel** - Payment cancellation page

### API Integration

The app communicates with the backend API:

- `GET /api/campaigns` - Fetch all campaigns
- `GET /api/campaigns/{id}` - Fetch single campaign
- `POST /api/donations/stripe/create` - Create Stripe checkout session

### Stripe Payment Flow

1. User selects campaign and amount
2. Submits donation form
3. Backend creates Stripe Checkout Session
4. User redirected to Stripe-hosted payment page
5. After payment, redirected to success/cancel page

## TypeScript Types

```typescript
interface Campaign {
  id: string;
  title: string;
  slug: string;
  shortDescription: string;
  description: string;
  targetAmount: number;  // cents
  currency: string;
  active: boolean;
}

interface DonationRequest {
  amount: number;         // cents
  currency: string;
  donorName?: string;
  donorEmail?: string;
  campaignId: string;
}

interface CheckoutSessionResponse {
  sessionId: string;
  url: string;
}
```

## Component Overview

### Layout
Provides consistent header, navigation, and footer across all pages.

### Home
Landing page showcasing the mission and 3 featured campaigns.

### CampaignList
Grid view of all active campaigns with donation buttons.

### CampaignDetail
Full campaign information with prominent donate button.

### DonationForm
Multi-step form with:
- Preset and custom donation amounts
- Optional donor information
- Stripe Checkout integration

### Success/Cancel
Post-payment confirmation pages with navigation options.

## Styling

Clean, modern design with:
- Blue primary color (#2563eb)
- Responsive grid layouts
- Card-based UI components
- Smooth transitions and hover effects
- Mobile-friendly responsive design
