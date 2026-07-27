# Navexa — Dashboard

A premium, responsive dashboard screen for Navexa, a micro-business management app (trips, income/expense, customers, vehicles). Built with Vite + React + Tailwind CSS, using Recharts for the income/expense chart and lucide-react for icons.

## Design notes

- **Palette**: primary `#172554`, accent `#2563EB`, background `#F8FAFC`, surface `#FFFFFF`, per the brief.
- **Type**: Inter for UI text and headings; IBM Plex Mono (tabular figures) for all monetary/metric values — a small Stripe/fintech-style touch that makes numbers easy to scan and compare.
- **Signature motif**: a dashed "route line" connecting pickup → destination in the Upcoming Trips card, tying the visual language back to the transport/logistics subject matter.
- Fully responsive: sidebar + top nav on desktop, collapsible sidebar on tablet, bottom tab bar on mobile.

## Getting started

```bash
npm install
npm run dev
```

Open the printed local URL (usually `http://localhost:5173`).

## Build

```bash
npm run build
npm run preview   # optional, to preview the production build locally
```

## Deploy to Vercel

1. Push this project to a GitHub repo.
2. Go to [vercel.com/new](https://vercel.com/new) and import the repo.
3. Vercel auto-detects Vite — build command `npm run build`, output directory `dist` (already set in `vercel.json`).
4. Deploy.

Or via CLI:

```bash
npm i -g vercel
vercel
```

## Project structure

```
src/
  components/
    layout/       Sidebar, TopNav, BottomNav
    ui/           StatCard, StatusBadge, Button
    dashboard/    All dashboard sections (Welcome, QuickActions, UpcomingTrips,
                  RecentActivity, IncomeExpenseChart, TransactionsTable,
                  VehicleOverview, CustomersOverview, NotificationsPanel)
  data/
    mockData.js   Realistic placeholder data — swap for your API/DB calls
  pages/
    Dashboard.jsx Composes all sections into the dashboard screen
  App.jsx         Shell: sidebar + top nav + bottom nav + page
```

All data currently comes from `src/data/mockData.js`. Replace these with real API calls (or a fetch hook) when your backend is ready — the components themselves don't need to change, just the data source.
