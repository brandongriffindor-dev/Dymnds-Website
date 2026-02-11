export interface FabricTechnology {
  name: string;
  tagline: string;
  description: string;
  properties: string[];
  usedIn: string[];
}

export const FABRIC_TECHNOLOGIES: Record<string, FabricTechnology> = {
  diamondFlex: {
    name: 'DiamondFlex™',
    tagline: '4-way stretch compression that moves with your hardest effort.',
    description: 'Engineered compression fabric with 4-way stretch that holds its shape through the most intense training sessions. Moisture-wicking, quick-dry, and built to perform under pressure.',
    properties: ['4-Way Stretch', 'Compression Fit', 'Moisture-Wicking', 'Quick-Dry', 'Shape Retention'],
    usedIn: ['Leggings', 'Shorts', 'Compression Wear'],
  },
  pressureKnit: {
    name: 'PressureKnit™',
    tagline: 'Buttery soft, second-skin feel for training and recovery.',
    description: 'Ultra-soft knit fabric that feels like a second skin. Breathable, lightweight, and designed for all-day comfort — from the gym floor to the streets.',
    properties: ['Ultra-Soft', 'Breathable', 'Lightweight', 'Anti-Pilling', 'All-Day Comfort'],
    usedIn: ['T-Shirts', 'Tanks', 'Long Sleeves'],
  },
  carbonBreeze: {
    name: 'CarbonBreeze™',
    tagline: 'Engineered ventilation for maximum airflow under pressure.',
    description: 'Strategic mesh ventilation zones engineered for peak airflow during high-intensity sessions. Keeps you cool when the work gets hot.',
    properties: ['Mesh Ventilation', 'Maximum Airflow', 'Sweat-Wicking', 'Odor-Resistant', 'Ultralight'],
    usedIn: ['Performance Tops', 'Running Tanks'],
  },
  forgeLayer: {
    name: 'ForgeLayer™',
    tagline: 'Premium heavyweight warmth built for pre/post workout.',
    description: 'Heavyweight fleece engineered for warmth without bulk. Premium hand-feel, structured fit, and built to layer over your training gear.',
    properties: ['Heavyweight', 'Structured Fit', 'Warm', 'Premium Hand-Feel', 'Layerable'],
    usedIn: ['Hoodies', 'Joggers', 'Crews'],
  },
  flashDry: {
    name: 'FlashDry Diamond™',
    tagline: 'Ultralight, fast-drying fabric for high-intensity sessions.',
    description: 'Our lightest performance fabric. Dries in minutes, weighs almost nothing, and moves like air. Built for runners, HIIT athletes, and anyone who pushes the pace.',
    properties: ['Ultra-Fast Drying', 'Featherweight', 'Anti-Chafe', 'UV Protection', 'Full Range of Motion'],
    usedIn: ['Running Shorts', 'Performance Tanks'],
  },
};

export function getFabricByProduct(category: string): FabricTechnology | null {
  const categoryMap: Record<string, string> = {
    'leggings': 'diamondFlex',
    'shorts': 'diamondFlex',
    'compression': 'diamondFlex',
    't-shirt': 'pressureKnit',
    'tee': 'pressureKnit',
    'tank': 'carbonBreeze',
    'hoodie': 'forgeLayer',
    'jogger': 'forgeLayer',
    'crew': 'forgeLayer',
    'running': 'flashDry',
  };

  const key = Object.keys(categoryMap).find(k => category.toLowerCase().includes(k));
  return key ? FABRIC_TECHNOLOGIES[categoryMap[key]] : null;
}
