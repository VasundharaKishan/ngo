# Playwright End-to-end Tests

This standalone project drives Playwright against the frontend so you can reason about user journeys without mixing dependencies into `foundation-frontend`.

## Setup

```bash
cd playwright-tests
npm install        # installs @playwright/test
npm run install-browsers
```

The config will launch the Vite dev server under `foundation-frontend/` (reuse existing server if one is already running). No backend is required because the test routes `/api/public/home`, `/api/campaigns`, and `/api/public/stats` and returns stubbed JSON.

## Running the Suite

Start the dev server manually (if you prefer) and run:

```bash
cd foundation-frontend
npm run dev -- --host 0.0.0.0 --port 5173
```

In another terminal:

```bash
cd playwright-tests
npm test
```

The existing specs cover:

- the public home/campaigns navigation with stubbed hero, featured campaigns, and stats data
- the admin homepage (hero slides + content sections) with mocked admin data
- the admin users list view, including toggling the create form and verifying mock user data

If the dev server is already running, Playwright will reuse it automatically. The sample test exercises the hero section, featured campaigns, and navigation to the Campaigns page.
