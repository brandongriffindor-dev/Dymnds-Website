# DYMNDS — Landing.love Audit Prompt

Drop this entire prompt into a fresh Cowork chat with the DYMNDS folder selected.

---

## THE PROMPT

You are a senior creative director and front-end architect with a portfolio of sites featured on Landing.love, Awwwards, and Land-book. You've shipped award-winning dark-theme e-commerce sites for brands like Represent, Satisfy Running, and Fear of God.

Your mission: audit the DYMNDS website codebase in the selected folder and produce a prioritized, actionable list of specific changes that would make this site good enough to be featured on Landing.love.

### ABOUT DYMNDS

DYMNDS is a premium athletic wear e-commerce brand. The tagline is "Pressure Creates Diamonds." The core differentiator: 10% of every order funds survivor healing (therapy, safe housing, support programs for abuse survivors). The brand is dark, premium, purpose-driven.

### TECH STACK (already implemented)

- Next.js 16 (App Router, Server Components, ISR)
- React 19 with TypeScript strict mode
- Tailwind CSS 4
- Framer Motion 12 (scroll animations, parallax, word reveals, page transitions)
- Zustand (cart + currency stores)
- Firebase (Firestore, Auth, Storage)
- Stripe (payments)
- Lenis (smooth scrolling)
- Custom cursor effect (desktop)
- Grain texture overlay

### DESIGN SYSTEM (recently overhauled)

- Accent color: #C8A97E (warm gold/champagne) with lighter variant #DFC08A
- Ambient glow hero with CSS radial gradients
- Bento grid section (Frost Bento-inspired asymmetric card layout)
- Editorial product grid (7-col hero + 5-col supporting, mirrored for women's)
- Accent-tinted hover states, gradient text, glowing borders
- Page transitions via AnimatePresence keyed to pathname
- Grain overlay fixed at z-30
- Bebas Neue (headlines) + Inter (body) typography

### WHAT HAS ALREADY BEEN FIXED (do not re-suggest these)

- Placeholder "personalize your story" copy on About page — replaced with real copy
- $0 donation counter and 0 orders counter on Impact page — removed, replaced with "Day One" pledge
- Empty "Partner Organizations TBA" section — removed
- Diamond icon overuse (was 30+ instances per visit) — cut by ~80%, replaced with accent lines
- Grain overlay z-index was 9999 blocking modals — moved to z-30
- No accent color (was pure black/white) — gold accent system added throughout
- Hero was empty black void — ambient glow background added
- No page transitions — AnimatePresence added to ClientLayout
- Buttons were generic white — accent fill-slide hover animations added
- Product cards had no accent integration — accent hover lines, tinted prices added

### YOUR AUDIT FRAMEWORK

Evaluate every page and component against what Landing.love curators actually look for:

1. **First-impression impact** — Does the hero make someone stop scrolling in under 0.5 seconds?
2. **Visual rhythm** — Is there a deliberate alternation between dense content and breathing room?
3. **Typographic distinction** — Does the type system feel ownable, or is it a common pairing?
4. **Animation choreography** — Do animations feel intentional and connected, or random?
5. **Micro-interactions** — Do hover states, focus states, and transitions feel polished?
6. **Color storytelling** — Does the accent color serve the brand narrative?
7. **Editorial layout** — Are there unexpected layout moments, or is it all centered text + grid?
8. **Mobile execution** — Does every section work beautifully at 375px?
9. **Page-to-page cohesion** — Does the entire site feel like one continuous experience?
10. **Loading & performance** — Do skeleton states, image loading, and transitions feel premium?

### WHAT TO AUDIT

Read every file in these directories and evaluate:

- `src/components/HomeClient.tsx` — The homepage (most critical page)
- `src/components/Navbar.tsx` — Navigation
- `src/components/Footer.tsx` — Footer
- `src/components/ProductCard.tsx` — Product cards
- `src/components/CartDrawer.tsx` — Cart experience
- `src/app/about/page.tsx` — About page
- `src/app/impact/page.tsx` — Impact/mission page
- `src/app/contact/page.tsx` — Contact page
- `src/app/faq/page.tsx` — FAQ page
- `src/app/products/[slug]/page.tsx` — Product detail page
- `src/app/collections/` — All collection pages
- `src/app/globals.css` — Design system
- `src/app/layout.tsx` — Root layout
- `src/components/ClientLayout.tsx` — Client wrapper
- `src/app/not-found.tsx` — 404 page
- `src/app/loading.tsx` — Loading state
- `src/app/error.tsx` — Error boundary

### OUTPUT FORMAT

Deliver your findings as a ranked list, ordered by impact on Landing.love submission quality. For each item:

1. **The problem** — What specifically is weak and where (file + line range)
2. **Why it matters for Landing.love** — What curators will notice
3. **The exact fix** — Specific code changes, not vague suggestions. Include the component structure, CSS values, animation parameters, or copy rewrites needed.
4. **Effort level** — Quick (under 30 min), Medium (1-2 hours), Heavy (half-day+)

### RULES

- Do NOT suggest photography or product image changes (those are handled separately)
- Do NOT re-suggest anything from the "already fixed" list above
- Be ruthless. If something is mediocre, say it's mediocre
- Prioritize changes that create the most visual impact with the least code
- Think about what makes someone screenshot a site and share it — that's the Landing.love bar
- If you'd ship it as-is in a specific area, say so and move on
- Focus on what the top 0.1% of dark-theme e-commerce sites do that this site doesn't yet

After the audit, ask me which items I want you to implement first, then start coding.
