/**
 * Product description templates for DYMNDS.
 * Use these to generate consistent, compelling product copy.
 */

export interface ProductDescriptionData {
  title: string;
  fabricTech: string;
  fabricTagline: string;
  features: string[];
  impactStatement: string;
  careInstructions: string[];
}

export const CARE_INSTRUCTIONS = [
  'Machine wash cold, gentle cycle',
  'Do not bleach',
  'Tumble dry low or hang dry',
  'Do not iron directly on print/logo',
  'Do not dry clean',
];

export function generateProductDescription(data: ProductDescriptionData): string {
  return `${data.title} — crafted from our proprietary ${data.fabricTech} fabric. ${data.fabricTagline}

Built for your hardest days. ${data.features.slice(0, 3).join('. ')}. Every detail is intentional — because pressure creates diamonds.

${data.impactStatement}`;
}

export const IMPACT_STATEMENT = (price: number): string => {
  const donation = Math.round(price * 0.10);
  const therapyMinutes = Math.round(donation * 2);
  return `10% of your purchase (approximately $${donation}) funds ${therapyMinutes} minutes of professional therapy for survivors of abuse and trauma.`;
};

export const DESCRIPTION_TEMPLATES = {
  compression: {
    opener: 'Engineered for athletes who refuse to quit.',
    body: 'DiamondFlex™ compression fabric holds everything in place through sprints, lifts, and everything in between. 4-way stretch moves with you. Moisture-wicking tech keeps you dry. Built to survive your most brutal sessions.',
    closer: 'This is what premium compression feels like.',
  },
  training: {
    opener: 'Your new go-to for every training day.',
    body: 'PressureKnit™ fabric sits on your skin like it was made for you — because it was. Soft enough for all-day wear, tough enough for your hardest sets. Anti-pilling construction that looks new, session after session.',
    closer: 'Gear that matches your work ethic.',
  },
  performance: {
    opener: 'Built for the moments that test you.',
    body: 'CarbonBreeze™ ventilation keeps you cool when the intensity climbs. Ultralight mesh zones in all the right places. Sweat-wicking, odor-resistant, and lighter than anything else in your gym bag.',
    closer: 'Stay cool. Stay focused. Stay relentless.',
  },
  warmup: {
    opener: 'Premium warmth for the work before the work.',
    body: 'ForgeLayer™ heavyweight fleece delivers warmth without the bulk. Structured fit that looks clean before, during, and after your session. Layer it over anything in the collection for a complete kit.',
    closer: 'The layer between you and the cold.',
  },
  running: {
    opener: 'Fast-dry performance for athletes who move.',
    body: 'FlashDry Diamond™ — our lightest, fastest-drying fabric. Designed for high-output sessions where every ounce matters. Anti-chafe seams. UV protection. Full range of motion, zero restrictions.',
    closer: 'Light as air. Tough as you.',
  },
} as const;
