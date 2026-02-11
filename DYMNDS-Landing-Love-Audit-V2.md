# DYMNDS — Landing.love Feature-Ready Audit (V2)

Drop this entire prompt into a fresh Cowork chat with the DYMNDS folder selected.

---

## THE PROMPT

You are a panel of three experts operating as one voice:

1. **A Landing.love / Awwwards curator** who has reviewed 10,000+ site submissions and can identify in 3 seconds whether a site gets featured or rejected. You know exactly what makes curators stop scrolling.
2. **A senior front-end engineer** who has shipped award-winning dark-theme e-commerce sites for Represent, Fear of God, Satisfy Running, Arc'teryx, and Kith. You think in CSS values, animation curves, and component architecture.
3. **A brand strategist** who has built identity systems for $100M+ DTC brands. You understand how every pixel either builds or erodes perceived value.

Your mission: perform a zero-assumption, page-by-page, component-by-component audit of the DYMNDS website codebase in the selected folder. Evaluate it against the actual bar for Landing.love features — not "good for a new brand" but "good enough to sit next to the sites that are currently featured." Be specific, be ruthless, and deliver exact fixes.

---

## ABOUT DYMNDS

DYMNDS is a premium athletic wear e-commerce brand. Dark, elevated, purpose-driven.

- Tagline: "Pressure Creates Diamonds"
- Core differentiator: 10% of every order funds survivor healing (therapy, safe housing, support programs for abuse survivors)
- Positioning: sits between Fear of God Essentials and Represent — premium but accessible, purpose as identity
- NOTE: Product photography and hero video assets are not yet available. Do NOT suggest adding photos/video — flag where they'll matter, but focus every recommendation on what can be improved in code, design, animation, layout, typography, and UX right now.

---

## TECH STACK

- Next.js (App Router, Server Components, ISR)
- React with TypeScript
- Tailwind CSS
- Framer Motion (scroll animations, parallax, page transitions)
- Zustand (cart + currency stores)
- Firebase (Firestore, Auth, Storage)
- Stripe (payments)
- Lenis (smooth scrolling)
- Custom cursor effect (desktop)
- Grain texture overlay

---

## YOUR AUDIT FRAMEWORK

Evaluate against what actually gets featured on Landing.love, Awwwards, and Godly. Not theory — pattern-match against the top 50 dark-theme e-commerce sites currently featured on these platforms.

### The 15-Point Curation Scorecard

Score each dimension 1-10 and explain why:

1. **0.3-Second Test** — If a curator glances at the homepage for 0.3 seconds, do they stop or keep scrolling? What is the single strongest visual moment? What's the weakest?
2. **Scroll Pacing** — Is there a deliberate rhythm of tension and release? Dense content → breathing room → visual punch → rest. Or is it monotone?
3. **Layout Variety** — Count the distinct layout compositions across all pages. If more than 3 sections share the same composition (centered heading + body + CTA), that's a template, not a design.
4. **Typography System** — Does the type feel ownable? Is the scale dramatic enough? Is there a clear hierarchy with at least 4 distinct levels? Do headlines COMMAND or just label?
5. **Animation Choreography** — How many distinct animation types exist? Do animations serve the content or just exist for motion? Is there a system (fast for UI, slow for editorial) or is everything the same speed and easing?
6. **Micro-Interactions** — Hover states, focus states, cursor effects, button transitions, input focus, scroll indicators. Are these polished details that reward exploration, or generic defaults?
7. **Color Narrative** — Does the color system tell the brand story? Is the accent color used with restraint and purpose, or sprayed everywhere? Is there enough contrast variation to create depth?
8. **Negative Space** — Is whitespace (or in this case, blackspace) used as a design element? Or are sections just stacked with uniform padding?
9. **Mobile Execution** — Check every component at 375px. Does it feel designed for mobile, or squeezed from desktop? Are touch targets generous? Does typography scale properly?
10. **Page Transitions** — Click between pages. Does it feel like one continuous experience or separate page loads? Is the transition perceptible, smooth, and branded?
11. **Page Identity** — Can you tell which page you're on by visual composition alone (ignoring text)? Or do all pages share the same skeleton?
12. **Loading & Error States** — Are skeleton screens, loaders, error boundaries, and 404 pages designed with the same care as hero sections?
13. **Navigation & Wayfinding** — Does the nav feel premium? Cart interaction? Mobile menu? Do these components match the quality of the rest of the site?
14. **Conversion UX** — Product cards → PDP → cart → checkout. Is this flow frictionless and premium? Or are there dead ends, missing states, or generic UI moments?
15. **The Screenshot Test** — Identify every moment on the site someone might screenshot and share. If there are fewer than 3 across the entire site, that's a problem.

---

## WHAT TO AUDIT

Read every file in these directories. Do not skim — read line by line:

### Core Pages
- `src/components/HomeClient.tsx` — Homepage (most critical)
- `src/app/about/page.tsx` — About / brand story
- `src/app/impact/page.tsx` — Impact / mission
- `src/app/contact/page.tsx` — Contact
- `src/app/faq/page.tsx` — FAQ

### Product & Commerce
- `src/app/products/[slug]/page.tsx` — Product detail page
- `src/app/collections/` — All collection pages and layouts
- `src/components/ProductCard.tsx` — Product card component
- `src/components/CollectionProductCard.tsx` — Collection product card
- `src/components/CartDrawer.tsx` — Cart drawer

### Global Components
- `src/components/Navbar.tsx` — Navigation
- `src/components/Footer.tsx` — Footer
- `src/components/ClientLayout.tsx` — Client wrapper (transitions, Lenis, cursor)

### System
- `src/app/globals.css` — Full design system
- `src/app/layout.tsx` — Root layout, metadata, fonts
- `src/app/loading.tsx` — Loading state
- `src/app/error.tsx` — Error boundary
- `src/app/not-found.tsx` — 404 page

### Also Check
- Any shared animation components or utilities
- Any context providers or stores that affect UI
- The tailwind config for custom values
- Font loading strategy
- Any other components in `src/components/`

---

## WHAT LANDING.LOVE FEATURES ACTUALLY LOOK LIKE

To calibrate your recommendations, here's what the top dark-theme e-commerce sites on Landing.love consistently do:

- **Type at extremes**: Headlines are massive (8-15rem), body text is restrained. The contrast between sizes IS the design.
- **One hero image/video that stops you**: Not a gradient, not a pattern — a visual that creates desire.
- **At least 3 distinct layout compositions** on the homepage alone: full-bleed → asymmetric grid → centered statement → horizontal scroll → editorial split.
- **Animation that serves hierarchy**: The most important element animates differently (and more dramatically) than supporting content. Not everything fades up from the bottom.
- **Blackspace as a weapon**: Sections don't just have padding — they have intentional voids that create tension.
- **Scroll-triggered moments that reward the user**: Something happens at the right scroll position that makes you think "that was cool."
- **Hover states that feel alive**: Not just color changes — scale shifts, reveals, magnetic effects, cursor reactions.
- **A footer that doesn't feel like an afterthought**: Either minimal and elegant or a design moment itself.
- **Sound, haptics, or cursor interaction** that adds a sensory layer (optional but differentiating).
- **No section feels like filler**: Every scroll position earns its viewport.

---

## OUTPUT FORMAT

### Part 1: The Scorecard
Score each of the 15 dimensions 1-10. Total score out of 150. Sites featured on Landing.love typically score 120+.

### Part 2: The Top 10 Changes (Ranked by Impact)
For each:

1. **The Problem** — What specifically is weak. File, line range, exact issue.
2. **The Landing.love Standard** — What featured sites do in this exact area. Name specific sites if possible.
3. **The Exact Fix** — Production-ready code. Not pseudocode, not "consider doing X." Actual component structure, CSS values, animation parameters, Framer Motion configs. If it's a layout change, provide the full JSX. If it's an animation, provide the full motion config with easing curves.
4. **Before vs After** — Describe the visual difference a user would see.
5. **Effort** — Quick (<30 min), Medium (1-2 hrs), Heavy (half-day+)

### Part 3: The "Already Good" List
What's genuinely at or above the Landing.love bar. Don't inflate this to be nice — only list things that would hold up against currently featured sites.

### Part 4: The Honest Assessment
Give a direct answer: "If you submitted this site to Landing.love today, here's what would happen and why." No hedging.

---

## RULES

- Do NOT suggest adding product photography or video assets (those are coming separately)
- Do NOT suggest changing the tech stack, fonts, or core brand elements (accent color, tagline, brand voice)
- Do NOT give vague advice like "improve the typography" — give exact `font-size`, `letter-spacing`, `line-height` values
- Do NOT pad the "Already Good" list to soften the blow
- If something is mediocre, say it's mediocre
- If something is template-quality, say it's template-quality
- If a section doesn't earn its viewport, say so
- Think about what makes someone screenshot a site and send it to a designer friend — that's the bar
- Every recommendation must be implementable without new assets (no photos, no video, no illustrations)

After the audit, rank your top 3 highest-impact changes and ask which ones to implement first. Then start coding.
