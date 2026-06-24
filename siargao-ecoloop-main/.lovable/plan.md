# EcoLoop Siargao — Marketing Site + UI Demo

A multi-route TanStack Start site that explains the EcoLoop Siargao platform and demonstrates its core screens with mock data (no backend, no auth). Visitors can browse a working-looking EcoFeed, marketplaces, and LGU dashboard without signing in.

## Design direction

- Eco/tropical Siargao palette: deep forest green primary, sand/cream background, warm terracotta accent, ocean teal secondary. All tokens defined as oklch in `src/styles.css`.
- Friendly, community feel — rounded corners, soft shadows, generous spacing, photographic hero imagery (palm/island/farm/market).
- Typography: Outfit (headings) + Figtree (body), loaded via `<link>` in `__root.tsx`.
- Generated hero/section images saved to `src/assets/`.

## Routes

```
src/routes/
  __root.tsx              -> shared header (logo + nav + Join CTA) and footer
  index.tsx               -> Landing: hero, problem/solution, how it works, target users, feature highlights, CTA
  about.tsx               -> Mission, the circular economy loop, impact goals, team/LGU partners
  how-it-works.tsx        -> Step-by-step: post → match → exchange → track impact (with diagram)
  features.tsx            -> All 10 core features detailed with icons + screenshots
  feed.tsx                -> EcoFeed demo: social-style post cards (farmers, residents, restaurants) with images, qty, price, location, date, filter chips
  marketplace.tsx         -> Tabs: "Food Waste" and "Fresh Produce" with listing cards (photo, kg, price, pickup location, availability)
  planning.tsx            -> Advance Need & Future Planning board — chronological cards of future needs/offers
  trades.tsx              -> Barter & Trading demo: example trade requests, statuses (Pending/Approved/Completed), trade history table
  dashboard.tsx           -> LGU Admin demo: KPI cards (waste collected, diverted, active users, trades), charts (monthly waste, participation), recent activity
  join.tsx                -> Registration teaser: role selector (Farmer / Restaurant / Resident / LGU) with role-specific benefit cards and a non-functional "Coming soon" sign-up form
  contact.tsx             -> Contact info + simple form (front-end only)
```

Each route sets its own `head()` with unique title + description + og:title/og:description. Leaf routes with hero imagery also set og:image.

## Shared components (`src/components/`)

- `SiteHeader.tsx`, `SiteFooter.tsx`
- `PostCard.tsx` — EcoFeed post (avatar, role badge, image, body, metadata row)
- `ListingCard.tsx` — marketplace listing (image, title, kg/price, location, date)
- `TradeCard.tsx` — trade request with status badge
- `StatCard.tsx`, `RoleCard.tsx`, `FeatureCard.tsx`, `StepCard.tsx`
- Charts via `recharts` (already shadcn-compatible) for the LGU dashboard

## Mock data

`src/data/mock.ts` exports arrays of feed posts, listings, trades, planning entries, and dashboard metrics so all demo pages render rich, realistic content. No backend calls.

## Out of scope (for this build)

- No Lovable Cloud, auth, real submissions, persistence, maps, or live search. Forms are visual only. These can be added in a follow-up "Full MVP" build.

## Technical notes

- Tailwind v4 tokens in `src/styles.css` (oklch palette + `@theme inline` mapping for shadcn).
- Uses existing shadcn UI primitives (button, card, badge, tabs, table, input, textarea, chart).
- Images generated with `imagegen` (hero, farmer, restaurant, market, compost) saved under `src/assets/` and imported as ES modules.
- All navigation uses `<Link to="...">` from `@tanstack/react-router`.
