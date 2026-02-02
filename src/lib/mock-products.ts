// Mock data for DYMNDS Flagship Products
// These represent the 3 core items of the collection

export interface Product {
  slug: string;
  name: string;
  subtitle: string;
  price: number;
  description: string;
  fabricTech: string;
  impactMinutes: number;
  images: string[];
  sizes: SizeAvailability[];
  details: string[];
}

export interface SizeAvailability {
  size: 'XS' | 'S' | 'M' | 'L' | 'XL' | 'XXL';
  inStock: boolean;
}

export const products: Product[] = [
  {
    slug: 'heavy-hoodie',
    name: 'HEAVY HOODIE',
    subtitle: 'Warmth without weight. Your post-workout recovery layer.',
    price: 149,
    description: 'The Heavy Hoodie is built for the moments after the battle. When your muscles are spent and your mind is clear. Made from heavyweight 14oz cotton fleece with a brushed interior that feels like armor against the cold.',
    fabricTech: '14oz Heavyweight Cotton / Brushed Interior / Reinforced Seams',
    impactMinutes: 30,
    images: [
      '/products/hoodie-1.jpg',
      '/products/hoodie-2.jpg',
      '/products/hoodie-3.jpg',
      '/products/hoodie-4.jpg',
    ],
    sizes: [
      { size: 'XS', inStock: false },
      { size: 'S', inStock: true },
      { size: 'M', inStock: true },
      { size: 'L', inStock: true },
      { size: 'XL', inStock: true },
      { size: 'XXL', inStock: false },
    ],
    details: [
      'Double-lined hood with reinforced drawstrings',
      'Kangaroo pocket with hidden phone sleeve',
      'Ribbed cuffs and hem that hold their shape',
      'Pre-shrunk for consistent fit',
    ],
  },
  {
    slug: 'compression-tee',
    name: 'COMPRESSION TEE',
    subtitle: 'Your base layer for every battle. Sweat-wicking, 4-way stretch.',
    price: 89,
    description: 'The Compression Tee is your second skin. Engineered with 4-way stretch fabric that moves with you, not against you. Moisture-wicking technology keeps you dry when the pressure is on.',
    fabricTech: 'Nylon-Spandex Blend / 4-Way Stretch / Moisture-Wicking',
    impactMinutes: 20,
    images: [
      '/products/tee-1.jpg',
      '/products/tee-2.jpg',
      '/products/tee-3.jpg',
      '/products/tee-4.jpg',
    ],
    sizes: [
      { size: 'XS', inStock: true },
      { size: 'S', inStock: true },
      { size: 'M', inStock: true },
      { size: 'L', inStock: true },
      { size: 'XL', inStock: true },
      { size: 'XXL', inStock: true },
    ],
    details: [
      'Seamless construction reduces chafing',
      'Anti-odor technology',
      'UPF 50+ sun protection',
      'Reflective logo for low-light visibility',
    ],
  },
  {
    slug: 'neural-joggers',
    name: 'NEURAL JOGGERS',
    subtitle: 'Advanced comfort mapping. The future of athletic wear.',
    price: 119,
    description: 'The Neural Joggers feature our proprietary comfort mapping technology. Strategic paneling provides support where you need it and freedom where you dont. The tapered fit transitions seamlessly from gym to street.',
    fabricTech: 'Performance Polyester / Comfort Mapping / Ankle Zips',
    impactMinutes: 25,
    images: [
      '/products/joggers-1.jpg',
      '/products/joggers-2.jpg',
      '/products/joggers-3.jpg',
      '/products/joggers-4.jpg',
    ],
    sizes: [
      { size: 'XS', inStock: true },
      { size: 'S', inStock: true },
      { size: 'M', inStock: false },
      { size: 'L', inStock: true },
      { size: 'XL', inStock: true },
      { size: 'XXL', inStock: false },
    ],
    details: [
      'Strategic paneling for targeted support',
      'Ankle zips for easy on/off over shoes',
      'Hidden waistband pocket for keys/cards',
      'Tapered leg with 29" inseam',
    ],
  },
];

export function getProductBySlug(slug: string): Product | undefined {
  return products.find((p) => p.slug === slug);
}

export function getAllProducts(): Product[] {
  return products;
}
