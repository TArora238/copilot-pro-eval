# AI Tool Evaluation Prompts for Frontend — Liferay 7.4 DXP (Star Alliance Digital Experience Platform)

**Context:** JavaScript/SCSS frontend within Liferay 7.4 DXP, GSAP for animations,
SCSS for styling, vanilla JS modules for state and theming, multi-airline white-label theming,
FreeMarker templates for the theme and ADT layer.

---

## PRELIMINARY ASSESSMENT NOTES

This file mirrors the structure of the backend evaluation (`Liferay_AI_Tools_Evaluation_Prompts.md`)
and is scoped to the **actual daily workspace** of the Star Alliance frontend developer:
Liferay theme layer (SCSS, FTL, vanilla JS modules, GSAP animations). No React, no TypeScript,
no Redux — those are not part of the theme workspace and including them would make this a generic
frontend benchmark rather than a Star Alliance one.

**What transfers from the backend file:**
- Evaluation rubric (Section 6) — reused with frontend-specific criteria.
- Testing methodology — identical prompts across tools, capture outputs, measure iteration quality.
- FreeMarker section (backend section 4) — overlaps directly; evaluate the same FTL prompts
  from the frontend angle (theme templates, ADTs, layout TPLs).

**What is new / frontend-only:**
- Section 1: Vanilla JS modules — array processing, caching, async coordination.
- Section 2: Airline theme switching and flight search state in plain JS.
- Section 3: GSAP animations and ScrollTrigger (project-critical, no backend equivalent).
- Section 4: SCSS architecture and multi-airline theming.
- Section 5: FreeMarker templates from the theme/ADT perspective.

---

## 1. JAVASCRIPT — CORE LANGUAGE (Vanilla JS Modules)

### 1.1 Medium: Array Transformation & Functional Patterns

**Prompt:**
```
I have an array of airline flight objects in a Liferay DXP theme page (vanilla JS, no framework):

const flights = [
  {
    id: "LH401",
    airline: "LH",
    origin: "FRA",
    destination: "JFK",
    departureTime: "2026-08-01T10:30:00Z",
    arrivalTime: "2026-08-01T13:45:00Z",
    status: "ON_TIME", // ON_TIME | DELAYED | CANCELLED | BOARDING
    seatClass: "BUSINESS" // ECONOMY | BUSINESS | FIRST
  }
  // ...more flights
];

Write plain JavaScript (ES6+) that:
1. Filters to only ON_TIME or BOARDING flights
2. Maps each to a display object with:
   - id, airline, route (e.g. "FRA → JFK"), formattedDeparture ("HH:mm"),
     durationMinutes (number), statusLabel (user-friendly string), isPremium (BUSINESS or FIRST)
3. Sorts by departureTime ascending
4. Groups into a plain object keyed by airline code: { "LH": [...], "SQ": [...] }

Include a utility function formatDuration(minutes) that returns "2h 35m".
Add JSDoc comments. No TypeScript, no imports — this runs as a JS module in a Liferay theme.
```

---

### 1.2 Medium: Module-Scoped Cache with TTL

**Prompt:**
```
Build a JavaScript cache module for use inside a Liferay 7.4 theme page.
It caches API responses in memory (no localStorage — Liferay portlet context makes
localStorage unreliable across page navigation).

Requirements:
1. Module pattern (IIFE or ES module export) — must not pollute the global scope
2. Internal store: a plain Map with entries { data, expiresAt }
3. get(key) — returns data if not expired, null otherwise; removes expired entry
4. set(key, data, ttlMs) — stores entry with expiry timestamp
5. getOrFetch(key, fetchFn, ttlMs) — returns cached data if valid, otherwise calls
   fetchFn() (returns a Promise), caches the result, and returns it
6. clear(prefix) — clears all keys or only those starting with prefix
7. Singleton pattern — one instance shared across the page

Show example usage: caching an airline profile from /api/airlines/LH/profile
with a 5-minute TTL. Include JSDoc comments.
```

---

### 1.3 Difficult: Parallel Fetch with Partial Failure Handling

**Prompt:**
```
Build a plain JavaScript function fetchAirlineBundle(airlineCodes, signal) that fetches
data for multiple airlines in parallel from three endpoints each:

- GET /api/airlines/:code/profile
- GET /api/airlines/:code/routes
- GET /api/airlines/:code/lounges

Requirements:
1. All fetches run in parallel using Promise.allSettled — not Promise.all, since
   some airlines may fail partially
2. Per airline: if profile fetch fails, exclude that airline entirely from results.
   If routes or lounges fail, include the airline with an empty array and flag
   partialData: true on that airline's result object.
3. Returns: { airlines: [...], failedCodes: [...] }
4. Retry logic: max 2 retries per failed request, exponential backoff (200ms, 400ms)
5. Accepts an AbortSignal — passes it to all fetch calls so the caller can cancel
6. No external libraries — native fetch and AbortController only

Include JSDoc. Add a usage example showing how to call this from a Liferay theme JS
file and cancel it when the portlet is detached from the DOM.
```

---

## 2. VANILLA JS — AIRLINE THEMING & STATE MODULES

*(These replace the React/Redux sections — same concepts, implemented as plain JS modules
the way they'd actually live in a Liferay theme.)*

### 2.1 Medium: Airline Theme Switcher Module

**Prompt:**
```
Build a vanilla JavaScript module called AirlineThemeManager for a Liferay 7.4 theme
that serves 26 member airlines from a single codebase.

Each airline has its own brand config:
{
  code: "SQ",
  primaryColor: "#F0A500",
  secondaryColor: "#0A2240",
  accentColor: "#FFFFFF",
  fontDisplay: "Singapore Sans",
  fontBody: "Arial",
  logoUrl: "/o/airline-theme/images/sq-logo.svg",
  rtl: false
}

The module should:
1. fetch(code) — fetches brand config from /api/themes/:code, with fallback to
   Star Alliance defaults if the request fails
2. apply(config) — writes all values as CSS custom properties on document.documentElement
   (--color-primary, --color-secondary, --color-accent, --font-display, --font-body, --logo-url)
   and sets dir="rtl" or dir="ltr" on document.documentElement based on config.rtl
3. persist(code) — saves the airline code to sessionStorage so it survives soft navigation
4. restore() — reads sessionStorage on page load and re-applies the saved theme
5. onChange(callback) — registers a listener called whenever the theme changes
   (to allow other JS modules on the page to react — e.g. update a logo element's src)

Show initialization code: how this module is called from portal_normal.ftl on page load.
No framework, no TypeScript. Module pattern only.
```

---

### 2.2 Difficult: Flight Search State Module

**Prompt:**
```
Build a plain JavaScript state module called FlightSearchState for managing flight search
UI state in a Liferay DXP theme page (no Redux, no framework).

State shape:
{
  searchParams: null,   // { origin, destination, departureDate, returnDate, cabinClass, passengers }
  results: [],
  status: "idle",       // idle | loading | succeeded | failed
  error: null,
  selectedFlight: null,
  filters: {
    airlines: [],
    maxDuration: null,
    cabinClass: null
  },
  pagination: {
    page: 1,
    pageSize: 10,
    totalCount: 0
  }
}

Requirements:
1. Module pattern with a private state object — no direct external mutation
2. getState() — returns a shallow copy of current state
3. search(params) — sets searchParams, sets status to "loading", calls
   GET /api/search/flights?...params, updates results + status on resolve/reject
4. selectFlight(id) — sets selectedFlight from current results (no API call)
5. updateFilters(partial) — merges partial into filters, resets pagination.page to 1
6. resetSearch() — clears results, params, selectedFlight, status; preserves filters
7. getFilteredResults() — returns results filtered by current filters (client-side,
   no API call) — filter by airlines array (if non-empty), maxDuration, cabinClass
8. subscribe(listener) — registers a callback fired on every state change;
   returns an unsubscribe function
9. getTotalPages() — derived from pagination state

Show how two separate DOM components on the same Liferay page (a search form portlet
and a results list portlet) can share this module and stay in sync via subscribe().
No external libraries.
```

---

## 3. GSAP ANIMATIONS & SCROLL INTERACTIONS

*(Project-critical — this section has no backend equivalent)*

### 3.1 Medium: Scroll-Triggered Stagger Reveal

**Prompt:**
```
I'm building a "Journey Steps" section in a Liferay DXP theme page.
The section has 6 step cards (.step-card elements) that should animate in on scroll.

Using GSAP 3 and ScrollTrigger, implement:

1. Each card fades in (opacity: 0 → 1) and slides up (y: 40 → 0) with a stagger of 0.15s
2. Trigger: when the section (.journey-steps) enters the viewport at 80% from top
3. Animation plays once only — no reverse on scroll back
4. On mobile (< 768px), reduce stagger to 0.08s and y offset to 20px
5. Wrap everything in a function initJourneySteps(container) that returns a cleanup
   function — the cleanup kills all ScrollTrigger instances created by this function.
   This is critical for Liferay SPA navigation where portlets remount.
6. GSAP and ScrollTrigger are loaded as theme-level globals (window.gsap, window.ScrollTrigger)
   — do not use import statements

Include a ResizeObserver that calls ScrollTrigger.refresh() after layout changes
(debounced 200ms). Explain why this matters for DXP pages with dynamic portlet stacking.
```

---

### 3.2 Difficult: Plane Animation with Position Anchoring

**Prompt:**
```
I have a decorative route-map animation in our Liferay theme page. A plane SVG (.plane-wrapper)
should fly along a curved SVG path between two airport marker elements (.airport-origin,
.airport-destination) positioned in the DOM.

Requirements using GSAP MotionPath and ScrollTrigger (both available as window globals):

1. Calculate the SVG path dynamically from the bounding boxes of .airport-origin and
   .airport-destination using getBoundingClientRect() — cubic bezier with control points
   offset upward (arc height = 30% of horizontal distance)
2. Animate the plane along this path, rotating to follow the curve (autoRotate: true)
3. Trigger on scroll: starts when the route-map section is 70% in view, scrubs with scroll
   (scrub: 1.5)
4. On window resize: recalculate bounding boxes and rebuild the MotionPath (debounced 250ms)
5. Show a dashed trail line that draws in ahead of the plane using SVG stroke-dasharray
   synchronized to the same ScrollTrigger progress
6. Return a cleanup function that kills all ScrollTrigger instances and removes resize listeners

Known issue to handle: on Liferay DXP, the page header has a sticky element that shifts
layout after the initial paint. Account for a 60px offset in the ScrollTrigger start
calculation and explain why ScrollTrigger.refresh() alone is sometimes insufficient here.
```

---

### 3.3 Difficult: History Timeline with Horizontal Scroll

**Prompt:**
```
Build a horizontal-scrolling history timeline for a Star Alliance "Our Story" page.

Structure:
- A pinned outer section (.timeline-section) fixed while inner content scrolls horizontally
- 12 timeline cards (.timeline-card) in a horizontal row
- Each card: year (large text), event title, short description, optional image

Using GSAP ScrollTrigger (window.ScrollTrigger):
1. Pin .timeline-section for the full horizontal scroll duration
2. Animate .timeline-track from x: 0 to x: -(totalWidth - viewportWidth)
3. As each card enters view, increment a year counter from the previous card's year
   to the current card's year using GSAP's counter animation
4. Active card gets .is-active class — only one at a time
5. A progress bar at the bottom of the section fills proportionally as user scrolls

Responsive:
- On mobile (< 768px), disable pin + horizontal scroll; stack cards vertically
  with standard ScrollTrigger fade-in per card
- Use matchMedia not window.innerWidth so it responds to orientation change

This lives inside a Liferay DXP portlet. Address the known issue where ScrollTrigger
pin spacer divs interfere with Liferay's column layout structure. Provide a workaround.
Return a cleanup function.
```

---

## 4. SCSS ARCHITECTURE & MULTI-AIRLINE THEMING

### 4.1 Medium: SCSS Token System for White-Label Theming

**Prompt:**
```
Design a SCSS architecture for a Liferay 7.4 theme that serves 26 airline brands
from a single codebase.

Requirements:
1. A base _tokens.scss defining CSS custom properties:
   --color-primary, --color-secondary, --color-accent,
   --font-family-display, --font-family-body,
   --border-radius-card, --spacing-section

2. A _theme-airline.scss mixin:
   @mixin airline-theme($code, $primary, $secondary, $accent, $font-display, $font-body)
   that scopes all variables under [data-airline="LH"] { ... } attribute selectors

3. A _airlines.scss that calls the mixin for 3 sample airlines:
   - Lufthansa: code LH, primary #05164D
   - Singapore Airlines: code SQ, primary #F0A500
   - Air Canada: code AC, primary #F01428

4. A .btn-primary component class using var(--color-primary) so it adapts per airline
   with no per-airline overrides

5. A _typography.scss using var(--font-family-display) for headings,
   var(--font-family-body) for body, with safe fallback stacks

6. RTL support: a [dir="rtl"] block that flips padding/margin/text-align for components

7. Explain how the Liferay theme sets data-airline on <html> via portal_normal.ftl
   using a theme setting or URL parameter — and how airline switching mid-session works
   without a full page reload

Show the full SCSS file structure.
```

---

### 4.2 Difficult: BEM + Clay CSS Coexistence in DXP

**Prompt:**
```
Our Liferay DXP project has a CSS conflict problem: Liferay's built-in Clay CSS framework
uses utility classes that collide with our custom SCSS (.text-primary, .container, .row).
We also inherit Bootstrap 4 Grid from the parent theme.

Design a SCSS architecture strategy that:

1. Namespaces all custom components under a .dxp- prefix using BEM:
   .dxp-card, .dxp-card__header, .dxp-card__header--active

2. Wraps custom styles in a [data-dxp-scope] attribute selector for specificity
   without using !important

3. Provides a SCSS @mixin scope() { [data-dxp-scope] & { @content; } }

4. Isolates component styles from Liferay portlet drop-ins — specifically address
   how .portlet-boundary adds unexpected margin and how to neutralize it safely

5. A _reset-clay.scss partial that selectively undoes Clay CSS rules only within
   our custom layout regions (not globally, other portlets depend on Clay)

6. A concrete .dxp-hero example: title, subtitle, CTA button, background image —
   fully namespaced, scoped, RTL-aware

7. How to include custom SCSS partials in the correct load order relative to Clay
   via liferay-look-and-feel.xml

Provide all SCSS partials and the liferay-look-and-feel.xml snippet.
```

---

## 5. FREEMARKER TEMPLATES (Theme & ADT Layer)

*(Overlaps with backend section 4 — run the same prompts and compare: does the AI
understand FTL from a theme/ADT context, not just Java service layer usage?)*

### 5.1 ADT for Navigation Menu

**Prompt:**
```
Create a Liferay 7.4 Application Display Template (ADT) for the Navigation Menu portlet.

Render a mega-menu with:
1. Top-level items in a horizontal nav bar
2. Items with children open a dropdown on hover/focus
3. Dropdown: 3-column grid layout if > 6 children, single column if <= 6
4. Active page highlighted with .is-active (use themeDisplay.URLCurrent for comparison)
5. Mobile: collapses to a hamburger toggle with slide-down drawer (vanilla JS toggle)
6. Uses Liferay's nav_item, nav_item_layout, nav_item_children FTL variables correctly
7. External links get target="_blank" rel="noopener noreferrer"
8. ARIA: role="navigation", aria-label, aria-expanded on toggles, aria-current="page"

Show the complete .ftl file with inline JS for toggle behavior.
Explain which Liferay variables are available in the ADT context vs. portal_normal.ftl —
this is a common source of confusion and errors.
```

---

### 5.2 Airline-Aware Layout Template

**Prompt:**
```
Create a Liferay 7.4 layout template (.tpl file) for an "Airline Hub" page that:

1. Reads the current airline code from a Liferay web content article field or URL parameter
   — show how to access it via themeDisplay, request object, and layout custom field
   (all three approaches, with comments on when to use each)
2. Sets data-airline="${airlineCode}" on the outermost wrapper div
3. Sets dir="rtl" if the airline code is in a configured list of RTL airlines
4. Renders a 3-column layout on desktop, single column on mobile using CSS Grid classes
5. Conditionally renders a "Premier Member Banner" only if the current user has the
   PREMIER_MEMBER role — use permissionChecker in FTL
6. A FreeMarker macro that formats a CMS date field to "dd MMM yyyy" with locale
   awareness using themeDisplay.locale

Include comments on every Liferay-specific variable explaining where it comes from
and what context it requires.
```

---

## 6. EVALUATION RUBRIC

When testing each AI tool against these prompts, rate on:

| Criterion | Weight | Notes |
|-----------|--------|-------|
| **Correctness** | 25% | Actually solves the stated problem |
| **Code quality** | 20% | Clean structure, no anti-patterns, proper module scope |
| **JS/SCSS idioms** | 20% | Correct ES6+ patterns, SCSS architecture decisions |
| **Liferay-aware output** | 20% | Understands theme context, FTL variables, portlet lifecycle, global GSAP |
| **Explanation quality** | 10% | Explains non-obvious choices, flags known pitfalls |
| **Accessibility** | 5% | ARIA, keyboard nav present without being asked |

**Bonus observations to note (not scored):**
- Does the tool spontaneously mention ScrollTrigger cleanup for Liferay SPA navigation?
- Does it use `window.gsap` / `window.ScrollTrigger` correctly (not import statements)?
- Does it flag the Clay CSS conflict risk when given SCSS context?
- Does it know which FTL variables are available in ADT context vs. theme templates?
- Does it handle the multi-airline theming constraint correctly without being reminded?

---

## 7. TESTING METHODOLOGY

- **Identical prompts across all tools** — copy/paste, no paraphrasing between tools.
- **Same order** — run prompts in the same sequence across Copilot and Cursor.
- **Capture raw output** — save tool responses per prompt per tool for later comparison.
- **Note clarifying questions** — did the tool ask for context, or assume and proceed?
- **One follow-up per prompt** — after the initial output, test with a targeted follow-up:
  - GSAP prompts: *"The cleanup isn't working after Liferay SPA navigation. What's wrong?"*
  - SCSS prompts: *"Add the Thai Airways theme and make it RTL."*
  - FTL prompts: *"themeDisplay is null in this ADT — why and how do I fix it?"*
  - JS module prompts: *"Two portlets on the same page aren't staying in sync. Debug this."*
- **Record iteration count** — how many back-and-forths were needed to get usable output?

---

## APPENDIX: QUICK-WIN AI USE CASES (NO IMPLEMENTATION REQUIRED)

Scenarios to mention in the POC presentation that don't require custom code:

1. **GSAP generation from intent** — describe the animation in plain English, AI writes the
   ScrollTrigger block. High value given the volume of animation work on Star Alliance pages.

2. **SCSS theme generation from brand guidelines** — paste an airline's hex codes and font names,
   AI generates the complete `_theme-airline.scss` mixin call. Reduces per-airline onboarding
   from hours to minutes.

3. **FreeMarker debugging** — paste an FTL snippet and ask why `themeDisplay` is null or why
   a `#list` isn't rendering. Currently a significant time sink for the frontend team.

4. **Clay CSS conflict diagnosis** — paste a broken component and ask the AI to identify
   which Clay utility class is overriding the custom style.

5. **Accessibility audit** — paste an HTML/FTL template, AI flags missing ARIA attributes,
   focus management issues, and color contrast problems.

6. **Liferay upgrade readiness** — paste theme files, AI flags deprecated FTL variables,
   removed Clay components, or API changes relevant to a future DXP version upgrade.

---

*File prepared for internal POC: "AI Tool Integration Analysis — Frontend"*
*Mirrors structure of `Liferay_AI_Tools_Evaluation_Prompts.md` (Backend team, June 2026)*
*Scoped to: Liferay 7.4 theme layer — vanilla JS modules, GSAP, SCSS, FreeMarker*
