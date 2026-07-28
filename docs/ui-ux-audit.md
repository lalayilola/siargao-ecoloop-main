# Siargao Loops UI/UX Audit and Modernization Plan

**Audit date:** July 28, 2026  
**Deliverable:** Phase 0 audit artifact  
**Product name used by this report:** Siargao Loops  
**Status:** Ready for stakeholder review; application refactoring is intentionally gated

## Audit scope and method

This audit evaluates the current Siargao Loops frontend from the perspectives of public visitors, residents, farmers, restaurant users, LGU administrators, and island-wide super administrators. It covers information architecture, core journeys, authentication, responsive behavior, accessibility, performance, visual design, component consistency, data credibility, and frontend reliability.

The findings are based on:

- Source inspection of routes, layouts, shared components, feature screens, styles, assets, translations, PWA configuration, and Supabase-facing code.
- Static TypeScript and behavioral ESLint diagnostics.
- Production bundle and asset inspection.
- Contrast calculations for the current design tokens.
- Review of representative public, member, LGU, planning, marketplace, messaging, reporting, and administrative journeys.

This is a code-informed audit, not a substitute for moderated usability testing or a complete live-data security review. Implementation phases must also validate real accounts, Supabase policies, assistive technologies, physical devices, slow networks, and production-like datasets.

## A. Executive summary

Siargao Loops already has a credible technical and visual foundation. It uses React 19, TanStack Router, Tailwind, Radix-based interface primitives, responsive grid patterns, multilingual public content, role-aware features, municipality-scoped data, and a distinctive infinity-leaf sustainability mark.

The current application is not yet ready for dependable LGU or broad public use. The most serious problems are functional rather than cosmetic:

- Every visit is deliberately held behind a 2.5-second render delay and a loading overlay that remains for 5 seconds.
- Valid restaurant users are rejected by screens that still expect the legacy `hotel_restaurant` role.
- Some dashboards link to `/waste-collections`, although only `/waste-collection` exists.
- Authentication is implemented through three competing flows with different roles, redirects, terms, and verification behavior.
- `super_admin` exists in the data model but does not receive a usable administrative experience or clear island-wide permissions.
- Public mock listings, a non-submitting contact form, and hard-coded dashboard trends can be mistaken for live operational data.
- Several critical mobile layouts, form labels, touch targets, focus states, animations, and color pairs do not meet an LGU-grade accessibility standard.
- Type and hook errors can surface as blank, broken, or permanently loading screens.

The modernization should therefore begin with correctness, trust, accessibility, and navigability. Visual refinement should follow those foundations rather than lead them.

### Baseline evidence

| Measure | Current evidence | Implication |
|---|---:|---|
| Largest route | `src/routes/auth.tsx` — approximately 2,980 lines | Auth behavior is difficult to reason about and safely change. |
| Largest feature screens | `MarketplaceView.tsx` — approximately 2,266 lines; `PlanningForecastDashboard.tsx` — approximately 2,181 lines | Data, view state, forms, and presentation are too tightly coupled. |
| TypeScript diagnostics | 149 | Runtime-affecting defects can be hidden by the transpile-only production build. |
| Behavioral ESLint | 192 errors and 19 warnings | Includes conditional hooks, incomplete effect dependencies, and extensive untyped data. |
| Homepage video | Approximately 12.5 MB | High mobile bandwidth and Largest Contentful Paint risk. |
| Main JavaScript output | Approximately 892 KB uncompressed | Core startup includes too much eagerly loaded functionality. |
| Current primary green on white | 3.3:1 | Fails WCAG AA for normal text. |
| Current accent green on white | 2.28:1 | Fails WCAG AA for text. |
| Global loading behavior | 2.5-second render delay; 5-second overlay | The product feels unavailable even when no real work is pending. |
| Hard-coded color utilities | More than 1,100 `bg-*` and `text-*` color usages in inspected source | Visual changes and accessible theming are expensive and inconsistent. |

## B. Strengths to retain

### Product identity

- The infinity-leaf logo mark communicates circularity and local environmental purpose without containing the old wordmark.
- Siargao photography and the circular-economy narrative give the public experience a specific sense of place.
- Sora headings and Manrope interface text create a modern, readable base.
- The current sustainability motif can remain recognizable while becoming more restrained and institutional.

### Frontend foundation

- Radix-based dialogs, menus, selects, and sidebar primitives provide a strong accessibility starting point.
- TanStack Router supports explicit route organization and future feature-level code splitting.
- Tailwind and existing CSS variables can support a semantic token system without adopting a replacement UI framework.
- Existing responsive grids already adapt several content sections successfully.
- Toast feedback, empty states, and shared UI primitives exist and can be standardized rather than rebuilt.

### Domain and role foundation

- The application already models residents, farmers, restaurants, LGU administrators, and super administrators.
- Municipality-aware data scoping is present in several services and screens.
- Existing role normalization demonstrates a path for preserving legacy `hotel_restaurant` records.
- Marketplace, planning, transactions, messaging, announcements, reporting, mapping, and member administration reflect the major domain needs.

### Localization

- Public content has English, Tagalog, and Cebuano translations.
- The existing i18n setup can be extended into authenticated workspaces.

## C. Prioritized issues

Priority means implementation order. Severity reflects user or operational impact.

| ID | Priority | Severity | Affected areas | Finding and user impact | Recommended direction |
|---|---|---|---|---|---|
| UX-01 | P1 | Critical | Root shell, `LoadingScreen` | The app intentionally postpones rendering for 2.5 seconds and keeps a decorative overlay for 5 seconds. Users may assume the service is slow or broken. | Render the shell immediately. Show route- or component-level skeletons only while real asynchronous work is pending. |
| UX-02 | P1 | Critical | Restaurant dashboards, waste reports, waste collection | The canonical role is `restaurant`, while some screens require `hotel_restaurant`. Valid users see access-denied states. Dashboard links also target nonexistent `/waste-collections`. | Normalize legacy values once at the application boundary and use canonical roles everywhere. Point navigation to `/waste-collection`. |
| UX-03 | P1 | Critical | `/auth`, `/login`, `/register`, email verification | Three competing auth implementations expose different roles and redirects. Verification updates component state during render, which can cause React warnings and unreliable behavior. | Build shared auth forms, role options, validation, terms, verification, and one redirect policy. Preserve legacy URLs as aliases or redirects. Move async/state effects into effects or query callbacks. |
| UX-04 | P1 | Critical | Super-admin navigation, authorization, RLS | `super_admin` exists in schema and migrations but is not included in the normal administrative UI capability checks. Existing LGU policies are municipality-oriented. | Define explicit super-admin capabilities, island-wide filters, clear scope indicators, and narrowly reviewed RLS policies. |
| UX-05 | P1 | Critical | Public marketplace, contact page, LGU dashboard | Mock listings appear like real records when data is absent; the contact form shows success without sending; trend labels such as “+3 today” are hard-coded. These patterns damage public-sector trust. | Label demonstrations unmistakably, connect actions to real services, and remove claims that are not derived from authoritative data. |
| UX-06 | P1 | High | Global styles, controls, animated branding | There is no reduced-motion handling; global transitions and repeated bouncing/floating effects run continuously. Buttons, inputs, and icon controls are commonly 32–36px high. | Add `prefers-reduced-motion`, limit motion to purposeful 150–200ms transitions, and use a 44px minimum interactive target on touch interfaces. |
| UX-07 | P1 | High | Colors, focus, status communication | Primary and accent greens fail normal-text contrast on white, focus indication is weak, and status meaning often relies on color. | Introduce WCAG AA semantic tokens, a visible multi-pixel focus ring, text/icon status cues, and automated contrast checks. |
| UX-08 | P1 | High | Forms, notifications, marketplace, messaging | Several icon-only controls lack accessible names. Some fields rely on placeholders, and actions such as image removal become visible only on hover. | Use durable visible labels, programmatic names, inline help and errors, and touch-visible actions. |
| UX-09 | P1 | High | Application shell and routing | Important dashboards and routes—inventory, GIS, eco-points, waste tools—are difficult to discover. `/requests` and `/trades` duplicate one screen, while `/feed` is referenced without a route. | Introduce a capability-driven information architecture, canonical `/dashboard` and `/transactions` routes, and tested aliases for legacy URLs. Remove or implement dead references. |
| UX-10 | P1 | High | Mobile marketplace, registration, messages, AI chat | Fixed 600px panels, fixed-width marketplace cards, two-column phone forms, tiny labels, and oversized dialogs cause crowding or excessive scrolling. | Use fluid cards, viewport-safe dialogs, stacked forms, and a single-pane list/detail messaging flow on small screens. |
| UX-11 | P1 | High | Runtime reliability | A conditional hook, stale/generated type mismatches, missing Feed imports, schema mismatches, and incomplete effect dependencies can cause broken screens or perpetual loading. | Repair runtime blockers first. Require clean TypeScript and behavioral-lint gates for touched areas, followed by repository-wide cleanup. |
| UX-12 | P2 | High | Design system and feature styling | Hundreds of direct color classes and per-page treatments bypass semantic tokens. Similar states look and behave differently. | Define semantic color, typography, spacing, radius, elevation, motion, and status tokens; migrate incrementally through shared primitives. |
| UX-13 | P2 | High | Public and workspace headers | Internal tools use large promotional heroes and heavy decoration. Some public pages use an eyebrow as `h1` and the actual title as `h2`. | Create separate public-hero and compact workspace-header patterns with correct heading hierarchy. |
| UX-14 | P2 | High | LGU member and record management | Administrative records are card-only and lack scalable pagination, selection, bulk actions, and persistent filters. | Use accessible desktop tables with equivalent mobile record cards, server-aware pagination, filter summaries, and guarded bulk actions. |
| UX-15 | P2 | High | Charts, planning, reporting | Charts depend heavily on color and lack equivalent summaries or tables. Dense fixed-size report previews do not adapt well. | Pair every chart with a plain-language summary and data table. Separate responsive on-screen reports from printable output. |
| UX-16 | P2 | Medium | Loading, empty, error, and partial-data states | Feedback ranges from plain “Loading...” text to blank grids and toast-only failures. Recovery is inconsistent. | Standardize skeleton, empty, error, retry, permission-denied, offline, and partial-data patterns through a shared `AsyncState`. |
| UX-17 | P2 | Medium | Authenticated localization | The language selector implies broader localization, but most workspace text is hard-coded English. | Move workspace text into the current i18n system and synchronize the document language with the selected locale. |
| UX-18 | P2 | Medium | Performance and data fetching | Heavy video, charts, mapping, PDF libraries, repeated profile queries, and limited dynamic import use increase startup and navigation cost. | Compress media, use posters and controlled playback, lazy-load specialist libraries, and share cached typed queries. |
| UX-19 | P2 | Medium | PWA and notification behavior | The service worker and manifest reference nonexistent `/feed`; an empty notification audio file is shipped. A failed precache can prevent installation. | Correct the cache/shortcut list and either supply valid, user-initiated audio or remove it. Test install, update, offline, and recovery behavior. |
| UX-20 | P3 | Medium | Institutional visual tone | Repeated glass effects, large gradients, emoji decoration, excessive rounding, logo bouncing, and hover movement weaken the credibility of LGU workspaces. | Keep expressive storytelling on selected public sections; use calmer surfaces, compact density, and minimal decoration inside workspaces. |
| UX-21 | P3 | Low | Copy, statuses, currency, dates | Raw status values, inconsistent capitalization, mixed date/currency formats, and generic empty copy reduce comprehension and polish. | Centralize human-readable labels, Philippine currency and local date formatting, status language, and contextual microcopy. |

## Findings by user perspective

### Public visitors

Public pages communicate the circular-economy mission well, but the first experience is unnecessarily slow and sometimes misleading. Autoplay video and continuous motion impose bandwidth and cognitive costs. Mock listings and simulated contact success make it difficult to distinguish demonstration content from an operating service.

The target public experience should:

- Load meaningful content immediately on a mid-range phone.
- Use one clear primary action per section.
- Distinguish live, sample, and unavailable data.
- Provide controllable media and respect reduced-motion and data-saving preferences.
- Maintain correct heading order and a predictable keyboard path.
- Preserve local imagery while using lighter assets and restrained motion.

### Residents, farmers, and restaurants

The member feature set is useful but fragmented. Users may land on generic destinations, miss their role dashboard, encounter duplicate transaction routes, or be blocked by inconsistent role names. Forms and messages become cumbersome on phones, where many real users are likely to access the platform.

The target member experience should:

- Land each role on one canonical, useful dashboard.
- Expose permitted tasks through one consistent shell.
- Complete marketplace, planning, transaction, messaging, and waste journeys without dead links or full reloads.
- Show progress, success, failure, and recovery near the action that caused them.
- Retain context when moving between list and detail views.
- Use role language that matches what users selected at registration.

### LGU administrators

The current LGU dashboard provides a useful starting overview, but unsupported trend claims and card-only management patterns limit operational trust and scale. Municipality scope is important but must remain visible during filtering, reporting, exporting, and bulk actions.

The target LGU experience should:

- Show the active municipality persistently.
- Separate authoritative data from estimates or unavailable metrics.
- Support large, filterable, paginated record sets.
- Require confirmation for destructive or bulk actions.
- Provide accessible chart summaries and data-table alternatives.
- Return action summaries identifying complete, partial, and failed operations.

### Super administrators

Super administration is modeled but not meaningfully exposed. Treating a super administrator as an LGU administrator in isolated UI branches is not a sufficient access or safety model.

The target super-admin experience should:

- Default to an explicit island-wide oversight context.
- Allow intentional selection of all municipalities or one municipality.
- Display the current data scope beside page titles, filters, reports, and actions.
- Use capabilities rather than ad hoc role comparisons.
- Preserve municipality isolation for LGU administrators.
- Back interface behavior with reviewed RLS policies and audited privileged actions.

## Core journey assessment

### 1. Sign in and role landing

**Current path:** A user can enter through `/auth`, `/login`, or `/register`; each flow can expose different role choices or redirect behavior. Existing signed-in users may land on `/profile`, while others land on role-specific or generic dashboards.

**Primary risks:** Confusion, inconsistent validation, redirect loops, missing roles, and render-time state updates.

**Target path:**

1. A shared entry flow determines sign-in or registration intent.
2. Shared role choices and validation use canonical role values.
3. Verification state is resolved without state changes during render.
4. One redirect policy sends the user to `/dashboard`.
5. The dashboard resolves the permitted role view and visible navigation.
6. Legacy URLs continue working through explicit aliases or redirects.

### 2. Farmer or restaurant marketplace transaction

**Current path:** Users can discover listings and transaction screens, but navigation labels and `/requests` versus `/trades` are inconsistent. Restaurant role checks can block related waste features.

**Primary risks:** Dead ends, role denial, placeholder-only fields, weak mobile layouts, and unclear async outcomes.

**Target path:**

1. The role dashboard exposes marketplace and current transactions.
2. Marketplace search, filters, and listing cards are fully keyboard- and touch-usable.
3. Listing details fit the viewport and keep the primary action visible.
4. Form labels, validation, units, price, and images are explicit.
5. Submission shows pending, success, or recoverable error feedback.
6. The resulting record is available at canonical `/transactions`.

### 3. Planning forecast

**Current path:** `PlanningForecastDashboard` combines substantial query, state, chart, form, and presentation logic. Failure may appear as a simple loading state, while charts and dense information lack consistent accessible alternatives.

**Primary risks:** Perpetual loading, difficult maintenance, poor small-screen comprehension, and chart-only meaning.

**Target path:**

1. Page-level scope and data freshness are stated clearly.
2. Independent data sections load through typed hooks.
3. Skeleton, empty, partial, failed, and retry states are distinct.
4. Forecast charts include written summaries and accessible data tables.
5. Filters persist during the session and adapt to a compact mobile toolbar.

### 4. LGU member review and reporting

**Current path:** Administrators filter card lists and view charts/reports, but high record counts, bulk workflows, accessible comparisons, and persistent scope are not well supported.

**Primary risks:** Slow review, accidental action, lost filter context, municipality-scope ambiguity, and inaccessible chart data.

**Target path:**

1. The workspace header identifies municipality and administrative scope.
2. A toolbar exposes search, status, role, date, and saved/persistent filters.
3. Desktop uses a table; mobile uses equivalent record cards.
4. Selection count and intended operation remain visible.
5. Bulk actions require confirmation and explain consequences.
6. Completion returns per-record or summarized success and failure results.
7. Reports expose on-screen summaries, data tables, and print-ready output.

### 5. Island-wide super-admin oversight

**Current path:** No coherent island-wide UI journey exists.

**Target path:**

1. Super administrators land on an island-wide overview.
2. A scope selector offers “All municipalities” and individual municipalities.
3. Every query and privileged action uses the selected explicit scope.
4. Aggregates explain freshness, source, and unavailable data.
5. Drilling into a municipality preserves scope and offers a clear return path.
6. Authorization is enforced in both UI capabilities and database policies.

## Responsive design findings

The current code uses responsive grids effectively in several content areas, but key workflows still depend on fixed dimensions or desktop-first composition.

Required behavior by breakpoint:

| Context | 360–390px | 768px | 1024–1440px |
|---|---|---|---|
| Navigation | Sheet/drawer with current-page title and clear close behavior | Compact shell | Persistent role-aware sidebar where appropriate |
| Forms | Single column; labels above fields; full-width primary action | One or two columns only when fields remain readable | Density can increase without reducing target size |
| Messaging | One pane at a time with a clear Back action | Adaptive list/detail | Stable split pane |
| Marketplace | Fluid cards; no fixed `w-96`; bottom-safe dialogs | Two-column where useful | Dense grid with consistent card actions |
| Records | Mobile record cards with equivalent actions | Hybrid view | Accessible table, pagination, and sticky/visible toolbar |
| Dialogs | Viewport margins, safe max-height, internal scrolling | Centered adaptive width | Content-based maximum width |
| Reports | Reflowed sections and horizontal chart safeguards | Responsive preview | Full preview plus print/export controls |

Acceptance must include no horizontal page overflow at 360px, no inaccessible hover-only action, and no touch target below 44px in critical journeys.

## Accessibility assessment

The modernization target is WCAG 2.2 AA for critical journeys.

### Required foundation changes

- Add a skip link and a reliable main landmark.
- Keep document language synchronized with English, Tagalog, or Cebuano.
- Restore a strong, visible focus indicator on every interactive element.
- Replace failing text/background combinations with accessible semantic tokens.
- Ensure all icon-only controls have accessible names.
- Associate every input with a durable visible label and inline error text.
- Use status text or icons in addition to color.
- Provide accessible names and descriptions for dialogs.
- Announce meaningful async updates through appropriate live regions without over-announcing.
- Respect `prefers-reduced-motion` and avoid essential information that depends on animation.
- Pair charts with summaries and accessible tabular data.
- Use correct page-title heading hierarchy.
- Confirm logical keyboard order and prevent focus traps in sheets, menus, and dialogs.

### Proposed accessible palette

| Token | Value | Intended use |
|---|---|---|
| Primary forest | `#166534` | Primary actions, active navigation, strong brand accents |
| Ocean teal | `#0F766E` | Secondary institutional actions and information accents |
| Sand | `#F4EFE4` | Warm storytelling sections and subtle highlights |
| Surface | `#FFFFFF` | Cards, dialogs, and form surfaces |
| Background | `#F8FAF7` | Workspace and page background |
| Text | `#172A22` | Primary text |
| Muted text | `#52635C` | Secondary copy that must remain readable |
| Border | `#D4DED8` | Dividers and boundaries, supplemented by shape/spacing where needed |

Bright greens should remain decorative or be paired with dark text; they should not be the default background for white normal-size text.

## Performance assessment

### Main contributors

- A homepage autoplay video of approximately 12.5 MB.
- A main JavaScript output of approximately 892 KB uncompressed.
- Eager inclusion of charting, mapping, PDF, and feature code.
- A large stylesheet output of approximately 166 KB.
- Monolithic screens that limit effective feature-level code splitting.
- Artificial loading delays unrelated to network or computation.
- Repeated profile or role queries in different feature areas.

### Recommended performance direction

- Remove all artificial delay timers.
- Compress and resize public media, add a poster, and avoid autoplay where reduced-motion or data-saving preferences apply.
- Dynamically import maps, charts, PDF tools, and feature screens where they are first needed.
- Split route files from reusable exported components so TanStack Router can code-split routes effectively.
- Consolidate typed, cached profile and capability queries.
- Measure real-user and lab performance after each structural phase.
- Treat the proposed LCP, CLS, and INP targets as release criteria on a representative mid-range mobile profile.

## Component-system assessment

The existing component library should be evolved, not replaced.

### Shared patterns to introduce

| Pattern | Responsibility |
|---|---|
| `WorkspacePageHeader` | Compact title, description, breadcrumbs where needed, scope, freshness, and primary actions |
| `StatusBadge` | Central status labels, iconography, tone, and accessible text |
| `AsyncState` | Skeleton, empty, error, retry, offline, permission-denied, and partial-data states |
| `DataToolbar` | Search, filters, saved/persistent state, result count, and responsive collapse behavior |
| `ResponsiveDataView` | Equivalent table and mobile-card representations |
| `ConfirmDialog` | Consequences, target summary, cancellation, pending state, and guarded destructive/bulk confirmation |
| Role capability model | Route visibility, allowed actions, verification requirements, and municipality/island scope |

### Monolith decomposition

Large screens should be separated by responsibility:

- Route component: routing, page boundary, and route-level loading/error behavior.
- Feature section: task-oriented visual regions.
- Typed data hook: query, mutation, caching, and error normalization.
- Form schema and form component: validation and submission state.
- Presentation component: reusable, testable display behavior.
- Domain formatter: role, status, date, quantity, Philippine currency, and municipality labels.

This decomposition is especially important for authentication, marketplace, planning, messaging, announcements, and dashboards.

## D. Quick wins

These changes should be completed early because they remove disproportionate friction with relatively contained risk:

1. Remove the 2.5-second render delay and 5-second loading overlay behavior.
2. Stop continuous logo bouncing and add reduced-motion behavior.
3. Normalize `hotel_restaurant` to `restaurant` at one boundary.
4. Correct `/waste-collections` links to `/waste-collection`.
5. Move verification state updates out of render.
6. Remove or repair `/feed` references in routing, manifest, and service-worker caches.
7. Remove the empty notification audio or provide a valid user-initiated asset.
8. Introduce accessible primary, focus, and muted-text tokens.
9. Raise shared control targets to at least 44px for critical touch interactions.
10. Add accessible names to icon buttons and visible labels to marketplace/auth fields.
11. Replace plain “Loading...” and blank grids with shared async states.
12. Clearly label sample marketplace content and remove simulated contact/dashboard success claims.
13. Consolidate transaction navigation under `/transactions`.
14. Remove unsupported “live” or trend language until derived from real data.

## E. Structural improvements

### Central role and capability model

Canonical roles:

```text
resident | farmer | restaurant | lgu_admin | super_admin
```

`hotel_restaurant` remains a legacy input alias only. Capability checks should answer:

- Which routes are visible?
- Which actions are allowed?
- Is verification required?
- Is data scoped to one municipality or the entire island?
- Can the user administer accounts, content, reports, or system settings?

### One role-aware application shell

- `/dashboard` becomes the canonical landing page.
- The shell provides role-appropriate navigation and a contextual page title.
- Municipality or island scope remains visible for administrative users.
- Mobile and desktop navigation expose equivalent destinations.
- Dead and duplicate navigation paths are removed or preserved as tested aliases.

### One authentication system

- Shared sign-in, registration, password, verification, terms, and error components.
- Shared canonical role choices.
- One redirect policy based on authenticated state and capability.
- `/login`, `/register`, and `/auth` remain available through shared components.

### Scalable feature architecture

- Marketplace, planning, messaging, announcements, transactions, and dashboards move into typed feature modules.
- Data-fetching hooks normalize loading, failure, partial-data, and permission behavior.
- Shared query caching replaces repeated profile and role retrieval.
- Route files export only route concerns to preserve code splitting.

### Administration built for volume

- Accessible tables on desktop and equivalent record cards on mobile.
- Server-aware pagination, persistent filters, selection summaries, and guarded bulk operations.
- Reports include text summaries, accessible data tables, and printable views.
- At least 1,000 synthetic records are used to validate usability and performance.

## F. Recommended design direction

### Brand

Use **Siargao Loops** consistently across:

- Interface copy
- Page titles and metadata
- Public translations
- Reports and exports
- PWA manifest and notification copy
- Assistant identity

Retain the current infinity-leaf mark. It does not contain the old wordmark and remains a strong visual asset.

### Typography

- Sora for page titles, section titles, and selected display text.
- Manrope for body, controls, tables, labels, and supporting copy.
- Remove inconsistent serif styles and runtime font imports.
- Use a compact, predictable type scale inside workspaces.

### Visual tone

Public pages may use:

- Local photography
- Sand and natural surfaces
- Limited storytelling gradients
- Short, optional motion that supports comprehension

Authenticated workspaces should use:

- Calm background and surface contrast
- Compact contextual headers
- Clearer information density
- Limited radius and elevation levels
- Minimal decorative animation
- Strong action hierarchy and visible data scope

### Motion

- Default transitions: 150–200ms.
- Use motion for state change, spatial continuity, and feedback.
- Avoid continuous bounce, float, shimmer, or background animation.
- Disable or simplify nonessential motion under `prefers-reduced-motion`.

### Content principles

- Never imply sample content is live.
- Never claim an action succeeded until the service confirms it.
- State data source, freshness, and scope where operational decisions depend on them.
- Prefer contextual empty states that explain what happened and what the user can do next.
- Use Philippine currency, local date/time conventions, and human-readable status labels consistently.

## Public interfaces and routing decisions

The implementation should preserve backend workflows and existing database structures except for narrowly required super-admin access policies.

- Canonical roles: `resident | farmer | restaurant | lgu_admin | super_admin`.
- Legacy role alias: `hotel_restaurant` normalizes to `restaurant`.
- Canonical dashboard: `/dashboard`.
- Canonical transactions: `/transactions`.
- `/requests` and `/trades` remain as redirects or aliases.
- `/login`, `/register`, and `/auth` remain available through shared authentication components.
- Super-admin scope is island-wide by default, with explicit municipality filtering.
- LGU administrators remain municipality-scoped.

## Implementation phases

### Phase 0 — Audit artifact

**Work**

- Deliver this report and a concise stakeholder summary.
- Confirm product naming, role model, route direction, accessible palette, and super-admin scope.

**Files**

- `docs/ui-ux-audit.md`

**Risk**

- Beginning implementation before agreement could cause broad rework across auth, navigation, permissions, and branding.

**Acceptance**

- The report is present in the repository.
- Stakeholders review the findings and explicitly approve or amend the direction.
- No application code changes are included in this phase.

### Phase 1 — Foundation and critical correctness

**Likely files**

- `src/styles.css`
- Shared controls under `src/components/ui/`
- Auth role types and normalization utilities
- Supabase generated types
- Runtime-blocking feature files identified by TypeScript and ESLint

**Work**

- Remove forced delays.
- Establish accessible semantic tokens, focus, target sizes, and reduced motion.
- Normalize canonical roles.
- Repair render-time effects, conditional hooks, stale types, and critical broken routes.
- Separate formatting rules from behavioral lint so quality gates are actionable.

**Risks**

- Token changes can affect many screens.
- Generated types must match the deployed database.
- Role changes can unintentionally broaden access if UI and RLS are conflated.

**Acceptance**

- Existing workflows remain intact.
- WCAG AA token pairs pass.
- No artificial global loading delay remains.
- Runtime blockers in touched areas are eliminated.
- UI capability checks do not substitute for database authorization.

### Phase 2 — Navigation, shell, and authentication

**Likely files**

- Authenticated layout and `AppSidebar`
- Dashboard route files
- `/auth`, `/login`, `/register`, and verification routes
- Shared auth and capability modules
- Transaction route aliases

**Work**

- Add role-aware navigation, canonical dashboard and transactions, mobile shell behavior, shared auth components, and consistent redirects.
- Make route files code-splitting friendly.

**Risks**

- Redirect loops, lost return URLs, and role-specific dead ends.
- Legacy bookmarks may break without explicit aliases.

**Acceptance**

- Every canonical role lands on a useful dashboard.
- All permitted features are discoverable without dead links.
- Legacy auth and transaction URLs resolve predictably.
- Keyboard and mobile navigation expose equivalent destinations.

### Phase 3 — Public experience and rebrand

**Likely files**

- Public routes and sections
- Header, footer, metadata, translations
- Manifest, service worker, notification copy
- Public media assets and contact behavior

**Work**

- Apply Siargao Loops naming.
- Make public statistics and content honest.
- Improve hero media, headings, responsive layouts, and primary actions.
- Connect contact submission or explicitly present an unavailable/demo state.

**Risks**

- Search metadata, cached PWA assets, and translations can retain old branding.
- Media changes can regress visual quality if not art-directed.

**Acceptance**

- No unlabeled demo data or simulated success state remains.
- Public pages work from 360px through 1440px.
- Media is controllable and respects user preferences.
- Each section has a clear action hierarchy.

### Phase 4 — Core member workflows

**Likely files**

- Marketplace, planning, transactions, messages, announcements, profile, and notifications
- New typed feature hooks and reusable state/form components

**Work**

- Decompose monoliths.
- Improve forms, filters, mobile list/detail behavior, confirmations, validation, and async states.
- Complete authenticated localization coverage for touched flows.

**Risks**

- Large feature files hide implicit state coupling.
- Query refactors can change cache timing or optimistic behavior.

**Acceptance**

- Resident, farmer, and restaurant journeys complete without dead navigation, blank loading states, inaccessible controls, or full page reloads.
- Errors are recoverable in context.
- Charts or forecasts include accessible alternatives.

### Phase 5 — LGU and super-admin workspaces

**Likely files**

- LGU dashboard, member management, reports, GIS, verification, announcements
- Scope selector and capability modules
- Focused Supabase RLS migration and policy tests

**Work**

- Refine operational dashboards and municipality context.
- Add island-wide super-admin filters and explicit privileged capabilities.
- Remove unsupported trend claims.

**Risks**

- Super-admin access is security-sensitive.
- Aggregate queries can accidentally bypass municipality boundaries.

**Acceptance**

- LGU data remains municipality-scoped.
- Super administrators can intentionally choose island-wide or one-municipality scope.
- Scope is visible in screens and exports.
- Policies are tested independently from UI visibility.

### Phase 6 — Tables, forms, and data management

**Likely files**

- Shared data toolbar, responsive data view, pagination, confirmation, upload, and form patterns
- LGU members, verification, reports, transactions, and other record-heavy screens

**Work**

- Add accessible tables/cards, server-aware pagination, persistent filters, selection summaries, guarded bulk operations, report alternatives, and consistent uploads.

**Risks**

- Bulk operations can partially fail.
- Client-only pagination may conceal scale problems.

**Acceptance**

- Validate with at least 1,000 synthetic records.
- Destructive and bulk operations require confirmation.
- Results explain complete, partial, and failed outcomes.
- Mobile cards expose the same essential information and actions as desktop tables.

### Phase 7 — Responsive and accessibility refinement

**Likely files**

- All critical route and shared component styles
- Automated accessibility and end-to-end tests
- Chart summaries and live-region behavior

**Work**

- Audit keyboard order, screen readers, headings, labels, contrast, motion, dialogs, charts, and touch behavior at common breakpoints.

**Risks**

- Automated accessibility tests do not detect every usability or announcement issue.

**Acceptance**

- Critical journeys meet WCAG 2.2 AA.
- No keyboard traps, horizontal page overflow, color-only status, or critical touch target below 44px.
- Reduced-motion mode remains understandable and complete.

### Phase 8 — Performance and final consistency

**Likely files**

- Route loading boundaries
- Media assets
- Dynamic imports for maps, charts, and PDF tools
- Service worker and caching configuration
- Shared queries and remaining visual/copy inconsistencies

**Work**

- Compress media, add appropriate preload/poster behavior, lazy-load specialist features, reduce duplicate queries, repair PWA caching, and complete the consistency pass.

**Risks**

- Lazy loading can move delays into unhelpful places without good route-level feedback.
- Service-worker updates can strand clients on stale assets if versioning is not tested.

**Acceptance**

- LCP under 2.5 seconds, CLS under 0.1, and INP under 200ms on a representative mid-range mobile profile.
- Production build, TypeScript, behavioral lint, and critical end-to-end tests pass.
- Offline installation, update, and recovery behavior is verified.

## Test plan

### Accounts and data

- Use local or staging Supabase accounts supplied through environment variables.
- Never commit credentials.
- Cover guest, resident, farmer, restaurant, LGU admin, and super-admin roles.
- Include users with legacy role values to verify normalization.
- Seed empty, typical, and 1,000-record administrative datasets.

### States

- Empty
- Populated
- Slow network
- Offline
- Permission denied
- Expired session
- Upload failure
- Mutation failure
- Partial query success
- Stale data
- Large record count

### Viewports and preferences

- 1440px
- 1280px
- 1024px
- 768px
- 390px
- 360px
- Keyboard-only navigation
- Screen-reader review
- 200% zoom/reflow
- Reduced-motion mode
- High-contrast/forced-colors review where supported

### Automated gates

- Production build
- TypeScript
- Behavioral ESLint
- Playwright critical journeys
- axe checks for representative pages and state variations
- Route-link validation
- RLS policy tests for LGU and super-admin scope
- Performance profiling on a representative mobile configuration

## Assumptions and decisions requiring approval

This report proceeds with the following proposed decisions:

1. **Product name:** Siargao Loops everywhere; retain the existing infinity-leaf mark.
2. **Frontend stack:** Keep React, TanStack Router, Tailwind, and Radix; do not adopt a replacement UI framework.
3. **Canonical roles:** `resident`, `farmer`, `restaurant`, `lgu_admin`, and `super_admin`.
4. **Legacy compatibility:** Normalize `hotel_restaurant` at the application boundary.
5. **Canonical routes:** `/dashboard` and `/transactions`, with legacy aliases.
6. **Super-admin scope:** Island-wide by default, with intentional municipality filtering.
7. **Database direction:** No schema rewrite; only a narrowly scoped, reviewed RLS migration where required.
8. **Accessibility target:** WCAG 2.2 AA on critical journeys.
9. **Implementation gate:** Significant UI refactoring starts only after this Phase 0 audit is reviewed.

## Recommended approval checkpoint

Before Phase 1 begins, stakeholders should confirm or amend:

- Product name and retained logo mark
- Canonical role names and legacy normalization
- Island-wide super-admin scope
- Canonical dashboard and transaction routes
- Proposed accessible palette and calmer workspace tone
- The order of implementation phases and acceptance criteria

Once approved, Phase 1 should begin with forced-loading removal, role/route correctness, runtime blockers, and accessible global foundations.
