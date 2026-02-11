# DYMNDS OG Images - Implementation Guide

## Quick Start

All three OG images have been generated and are ready to use:

```
public/og-image.png          (Homepage/Default)
public/og-product.png        (Product Pages)
public/og-collection.png     (Collection Pages)
```

## Implementation Steps

### 1. Next.js App Router (Recommended)

**File: `app/layout.tsx`**
```typescript
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'DYMNDS - Pressure Creates Diamonds',
  description: 'Premium Athletic Wear. Pressure Creates Diamonds. 10% of every order funds survivor healing.',
  openGraph: {
    title: 'DYMNDS - Premium Athletic Wear',
    description: 'Pressure Creates Diamonds',
    url: 'https://dymnds.com',
    siteName: 'DYMNDS',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        type: 'image/png',
        alt: 'DYMNDS - Pressure Creates Diamonds',
      },
    ],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'DYMNDS - Premium Athletic Wear',
    description: 'Pressure Creates Diamonds',
    images: ['/og-image.png'],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
```

### 2. Product Pages

**File: `app/products/[id]/page.tsx`**
```typescript
import { Metadata } from 'next';

interface ProductPageProps {
  params: { id: string };
}

export const generateMetadata = async ({
  params,
}: ProductPageProps): Promise<Metadata> => {
  const product = await getProduct(params.id);

  return {
    title: `${product.name} | DYMNDS`,
    description: product.description,
    openGraph: {
      title: `${product.name} - DYMNDS`,
      description: product.description,
      url: `https://dymnds.com/products/${params.id}`,
      images: [
        {
          url: '/og-product.png',
          width: 1200,
          height: 630,
          type: 'image/png',
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      images: ['/og-product.png'],
    },
  };
};

export default function ProductPage({ params }: ProductPageProps) {
  // Component code
}
```

### 3. Collection Pages

**File: `app/collections/[slug]/page.tsx`**
```typescript
import { Metadata } from 'next';

interface CollectionPageProps {
  params: { slug: string };
}

export const generateMetadata = async ({
  params,
}: CollectionPageProps): Promise<Metadata> => {
  const collection = await getCollection(params.slug);

  return {
    title: `${collection.name} | DYMNDS`,
    description: collection.description,
    openGraph: {
      title: `${collection.name} - DYMNDS`,
      description: collection.description,
      url: `https://dymnds.com/collections/${params.slug}`,
      images: [
        {
          url: '/og-collection.png',
          width: 1200,
          height: 630,
          type: 'image/png',
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      images: ['/og-collection.png'],
    },
  };
};

export default function CollectionPage({ params }: CollectionPageProps) {
  // Component code
}
```

### 4. HTML Meta Tags (Alternative)

If not using Next.js metadata API:

```html
<!-- Homepage -->
<head>
  <meta property="og:title" content="DYMNDS - Pressure Creates Diamonds">
  <meta property="og:description" content="Premium Athletic Wear. 10% of every order funds survivor healing.">
  <meta property="og:image" content="https://dymnds.com/og-image.png">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta property="og:image:type" content="image/png">
  <meta property="og:url" content="https://dymnds.com">
  <meta property="og:type" content="website">

  <!-- Twitter Card -->
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:image" content="https://dymnds.com/og-image.png">
  <meta name="twitter:title" content="DYMNDS - Pressure Creates Diamonds">
  <meta name="twitter:description" content="Premium Athletic Wear. 10% of every order funds survivor healing.">
</head>
```

## Testing

### Facebook Sharing Debugger
1. Visit: https://developers.facebook.com/tools/debug/sharing/
2. Enter your URL: https://dymnds.com/
3. Click "Scrape Again"
4. Verify image appears correctly

### Twitter Card Validator
1. Visit: https://cards-dev.twitter.com/validator
2. Enter your URL
3. Verify preview shows correct image

### LinkedIn Post Inspector
1. Visit: https://www.linkedin.com/feed/
2. Paste your URL
3. Verify preview shows OG image

## Image Specifications

| Property | Value |
|----------|-------|
| Dimensions | 1200×630px |
| Format | PNG |
| Color Space | RGB |
| File Size | ~34-36 KB |
| Color Scheme | Black (#000000) background, White (#FFFFFF) text |
| Typography | Clean sans-serif, modern minimal aesthetic |

## Branding Elements

All three images feature:
- **Hero Text**: "DYMNDS" in large, bold uppercase
- **Subtitle**: Context-specific tagline
- **Descriptor**: "Premium Athletic Wear"
- **Brand Mission**: "10% of every order funds survivor healing"
- **Visual Element**: Subtle diamond shape (brand symbol)
- **Design**: Dark, minimal, premium aesthetic (Lululemon × Off-White)

## Performance Considerations

- PNG format with lossless compression (~34-36 KB each)
- Optimized for fast loading on social platforms
- Standard 1200×630 size matches platform recommendations
- No external dependencies or heavy assets

## Customization

To create variants for campaigns or seasonal content:

```bash
python3 /sessions/funny-vibrant-pasteur/generate_og_images_v2.py
```

Edit the taglines in the Python script and regenerate:

```python
# Example for Summer Collection
og_summer = OG_SVG_TEMPLATE.format(
    tagline="Summer Collection Drop",
    secondary="Premium Athletic Wear"
)
```

## File Locations

**Source Files:**
- Generation Script: `/sessions/funny-vibrant-pasteur/generate_og_images_v2.py`
- First Version (PIL): `/sessions/funny-vibrant-pasteur/generate_og_images.py`

**Output Files:**
- Homepage: `/public/og-image.png`
- Products: `/public/og-product.png`
- Collections: `/public/og-collection.png`

## Quality Assurance

✓ All images verified as valid PNG format
✓ All images are exactly 1200×630px
✓ Professional, on-brand appearance
✓ Optimized file sizes
✓ Ready for social media deployment

---

**Last Updated**: February 10, 2026
