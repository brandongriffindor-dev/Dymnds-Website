'use client';

import { useCallback, useEffect, useReducer, useRef, useState } from 'react';
import Image from 'next/image';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import ScrollReveal from '@/components/ScrollReveal';
import ProductReviews from '@/components/ProductReviews';
import ProductGallery from './ProductGallery';
import SizeCalculator from './SizeCalculator';
import QuestionForm from './QuestionForm';
import { Check, ShoppingBag, Truck, Mail, ChevronDown } from 'lucide-react';
import type { Product, ProductColor } from '@/lib/firebase';
import type { Review } from '@/lib/fetch-products';
import { useCartStore } from '@/lib/stores/cart-store';
import { useCurrency, convertPrice, formatPrice, getCadPrice } from '@/lib/stores/currency-store';
import Link from 'next/link';

interface ProductClientProps {
  product: Product;
  initialReviews?: Review[];
  initialMatchingProduct?: Product | null;
}

// Product state and reducer for managing product page state
interface ProductState {
  selectedColor: ProductColor | null;
  mainImageIndex: number;
  imageTransition: boolean;
  selectedSize: string | null;
  isAdding: boolean;
  isAdded: boolean;
  showSizeCalculator: boolean;
  showQuestionForm: boolean;
  matchingProduct: Product | null;
  deliveryOpen: boolean;
  returnsOpen: boolean;
  stockError: string | null;
}

type ProductAction =
  | { type: 'SET_COLOR'; color: ProductColor | null }
  | { type: 'SET_IMAGE_INDEX'; index: number }
  | { type: 'SET_IMAGE_TRANSITION'; transitioning: boolean }
  | { type: 'SET_SIZE'; size: string | null }
  | { type: 'SET_ADDING'; adding: boolean }
  | { type: 'SET_ADDED'; added: boolean }
  | { type: 'TOGGLE_SIZE_CALCULATOR' }
  | { type: 'TOGGLE_QUESTION_FORM' }
  | { type: 'SET_MATCHING_PRODUCT'; product: Product | null }
  | { type: 'TOGGLE_DELIVERY' }
  | { type: 'TOGGLE_RETURNS' }
  | { type: 'SET_STOCK_ERROR'; error: string | null }
  | { type: 'CLOSE_MODALS' }
  | { type: 'CHANGE_COLOR'; color: ProductColor };

function productReducer(state: ProductState, action: ProductAction): ProductState {
  switch (action.type) {
    case 'SET_COLOR':
      return { ...state, selectedColor: action.color };
    case 'SET_IMAGE_INDEX':
      return { ...state, mainImageIndex: action.index };
    case 'SET_IMAGE_TRANSITION':
      return { ...state, imageTransition: action.transitioning };
    case 'SET_SIZE':
      return { ...state, selectedSize: action.size, stockError: null };
    case 'SET_ADDING':
      return { ...state, isAdding: action.adding };
    case 'SET_ADDED':
      return { ...state, isAdded: action.added };
    case 'TOGGLE_SIZE_CALCULATOR':
      return { ...state, showSizeCalculator: !state.showSizeCalculator };
    case 'TOGGLE_QUESTION_FORM':
      return { ...state, showQuestionForm: !state.showQuestionForm };
    case 'SET_MATCHING_PRODUCT':
      return { ...state, matchingProduct: action.product };
    case 'TOGGLE_DELIVERY':
      return { ...state, deliveryOpen: !state.deliveryOpen };
    case 'TOGGLE_RETURNS':
      return { ...state, returnsOpen: !state.returnsOpen };
    case 'SET_STOCK_ERROR':
      return { ...state, stockError: action.error };
    case 'CLOSE_MODALS':
      return { ...state, showSizeCalculator: false, showQuestionForm: false };
    case 'CHANGE_COLOR':
      return {
        ...state,
        selectedColor: action.color,
        mainImageIndex: 0,
        imageTransition: false,
        selectedSize: null,
        stockError: null,
      };
    default:
      return state;
  }
}


export default function ProductClient({ product, initialReviews = [], initialMatchingProduct = null }: ProductClientProps) {
  const addToCart = useCartStore(s => s.addToCart);
  const cart = useCartStore(s => s.cart);
  const openCart = useCartStore(s => s.openCart);
  const currency = useCurrency();

  // Sticky mobile CTA
  const addToCartRef = useRef<HTMLButtonElement>(null);
  const [showStickyBar, setShowStickyBar] = useState(false);

  useEffect(() => {
    if (!addToCartRef.current) return;
    const observer = new IntersectionObserver(
      ([entry]) => setShowStickyBar(!entry.isIntersecting),
      { threshold: 0 }
    );
    observer.observe(addToCartRef.current);
    return () => observer.disconnect();
  }, []);

  // Color selection state
  const hasColors = product.colors && product.colors.length > 0;

  // Initialize product state with useReducer — matching product now comes from server
  const [state, dispatch] = useReducer(productReducer, {
    selectedColor: hasColors ? product.colors![0] : null,
    mainImageIndex: 0,
    imageTransition: false,
    selectedSize: null,
    isAdding: false,
    isAdded: false,
    showSizeCalculator: false,
    showQuestionForm: false,
    matchingProduct: initialMatchingProduct,
    deliveryOpen: true,
    returnsOpen: false,
    stockError: null,
  });

  // Get current images based on color selection
  const currentImages = state.selectedColor?.images || product.images || [];

  // Fix #3/#4: Matching product now fetched server-side — no client Firestore import needed

  // Close modals on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        dispatch({ type: 'CLOSE_MODALS' });
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Image navigation with CSS-based crossfade
  const mainImageIndexRef = useRef(state.mainImageIndex);
  useEffect(() => {
    mainImageIndexRef.current = state.mainImageIndex;
  }, [state.mainImageIndex]);

  const changeImage = useCallback((newIndex: number) => {
    if (newIndex === mainImageIndexRef.current) return;
    dispatch({ type: 'SET_IMAGE_TRANSITION', transitioning: true });
    const timer = setTimeout(() => {
      dispatch({ type: 'SET_IMAGE_INDEX', index: newIndex });
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          dispatch({ type: 'SET_IMAGE_TRANSITION', transitioning: false });
        });
      });
    }, 200);
    return () => clearTimeout(timer);
  }, [dispatch]);

  // Handle color change
  const handleColorChange = (color: ProductColor) => {
    dispatch({ type: 'CHANGE_COLOR', color });
  };

  // Handle add to cart with stock validation
  const handleAddToCart = async () => {
    if (!state.selectedSize) return;
    dispatch({ type: 'SET_STOCK_ERROR', error: null });

    // Stock validation
    const available = (currentStock as Record<string, number>)[state.selectedSize] ?? 0;
    if (available <= 0) {
      dispatch({ type: 'SET_STOCK_ERROR', error: 'This size is currently out of stock.' });
      return;
    }

    // Check how many of this exact variant are already in cart
    const colorName = state.selectedColor?.name || '';
    const cartItemId = `${product.id}-${state.selectedSize}${colorName ? `-${colorName}` : ''}`;
    const existingInCart = cart.find((item) => item.id === cartItemId);
    const currentQty = existingInCart?.quantity ?? 0;

    if (currentQty >= available) {
      dispatch({ type: 'SET_STOCK_ERROR', error: `Only ${available} left in stock — you already have ${currentQty} in your cart.` });
      return;
    }

    dispatch({ type: 'SET_ADDING', adding: true });
    await new Promise(resolve => setTimeout(resolve, 400));

    const colorImage = state.selectedColor?.images?.[0] || product.images?.[0] || '';

    addToCart({
      id: cartItemId,
      title: product.title,
      price: Number(product.price),
      quantity: 1,
      size: state.selectedSize,
      color: colorName || undefined,
      image: colorImage,
    });

    dispatch({ type: 'SET_ADDING', adding: false });
    dispatch({ type: 'SET_ADDED', added: true });
    openCart();
    setTimeout(() => dispatch({ type: 'SET_ADDED', added: false }), 1500);
  };

  // Get current stock based on color
  const currentStock = state.selectedColor?.stock || product.stock || {};

  const sizes = ['XS', 'S', 'M', 'L', 'XL'];
  const displayPrice = convertPrice(getCadPrice(product), currency);
  const impactMinutes = Math.round(displayPrice * 0.10 * 2);

  const collectionName = product.category === 'Men' ? "Men's Collection" : product.category === 'Women' ? "Women's Collection" : product.category;
  const collectionHref = product.category === 'Men' ? '/collections/men' : product.category === 'Women' ? '/collections/women' : '/shop';

  const totalStockAvailable = Object.values(currentStock as Record<string, number>).reduce((sum, qty) => sum + qty, 0);

  const productSchema: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Product",
    "name": product.title,
    "image": currentImages.length > 0 ? currentImages : ['https://dymnds.ca/og-product.png'],
    "description": product.description || `${product.title} — Premium athletic wear by DYMNDS.`,
    "sku": product.slug,
    "brand": { "@type": "Brand", "name": "DYMNDS" },
    "offers": {
      "@type": "Offer",
      "price": product.price,
      "priceCurrency": "CAD",
      "availability": totalStockAvailable > 0
        ? "https://schema.org/InStock"
        : "https://schema.org/OutOfStock",
      "url": `https://dymnds.ca/products/${product.slug}`,
      "priceValidUntil": "2026-12-31",
    },
  };

  // Add AggregateRating for rich snippet star ratings in Google SERPs
  if (initialReviews.length > 0) {
    const avgRating = (initialReviews.reduce((sum, r) => sum + r.rating, 0) / initialReviews.length).toFixed(1);
    productSchema.aggregateRating = {
      "@type": "AggregateRating",
      "ratingValue": avgRating,
      "reviewCount": initialReviews.length,
    };
  }

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://dymnds.ca" },
      { "@type": "ListItem", "position": 2, "name": collectionName, "item": `https://dymnds.ca${collectionHref}` },
      { "@type": "ListItem", "position": 3, "name": product.title, "item": `https://dymnds.ca/products/${product.slug}` }
    ]
  };

  return (
    <main id="main-content" className="min-h-screen bg-black text-white">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productSchema).replace(/</g, '\\u003c') }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema).replace(/</g, '\\u003c') }}
      />
      <Navbar />

      {state.showSizeCalculator && (
        <SizeCalculator
          sizeGuide={product.sizeGuide}
          onClose={() => dispatch({ type: 'TOGGLE_SIZE_CALCULATOR' })}
        />
      )}

      {state.showQuestionForm && (
        <QuestionForm
          productName={product.title}
          onClose={() => dispatch({ type: 'TOGGLE_QUESTION_FORM' })}
        />
      )}

      <div className="pt-20 lg:pt-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Breadcrumbs */}
          <nav className="mb-8 flex items-center gap-2 text-xs text-white/40">
            <Link href="/" className="hover:text-white/70 transition-colors">Home</Link>
            <span>/</span>
            <Link href={collectionHref} className="hover:text-white/70 transition-colors">{collectionName}</Link>
            <span>/</span>
            <span className="text-white/60">{product.title}</span>
          </nav>

          <div className="lg:grid lg:grid-cols-2 lg:gap-16 lg:items-start">

            {/* LEFT SIDE - IMAGE GALLERY */}
            <ProductGallery
              images={currentImages}
              productName={product.title}
              selectedImageIndex={state.mainImageIndex}
              isTransitioning={state.imageTransition}
              onImageChange={changeImage}
            />

            {/* RIGHT SIDE - PRODUCT INFO */}
            <div className="lg:sticky lg:top-32">

              {/* Title & Price */}
              <div className="mb-8">
                <h1 className="text-3xl lg:text-4xl font-bebas italic tracking-wide uppercase mb-2">
                  {product.title}
                </h1>
                <p className="text-neutral-400 text-sm mb-4">{product.subtitle}</p>
                <p className="text-2xl lg:text-3xl font-medium">{formatPrice(convertPrice(getCadPrice(product), currency), currency)}</p>
              </div>

              {/* Description */}
              {product.description && (
                <div className="mb-8">
                  <p className="text-white/60 text-sm leading-relaxed">{product.description}</p>
                </div>
              )}

              {/* Features */}
              {product.features && product.features.length > 0 && (
                <div className="mb-8">
                  <p className="text-[10px] tracking-widest uppercase text-neutral-500 mb-3">Features</p>
                  <ul className="space-y-1.5">
                    {product.features.map((feature, idx) => (
                      <li key={idx} className="text-sm text-white/70 flex items-center gap-2">
                        <span className="w-1 h-1 bg-white/40 rounded-full" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Color Selection */}
              {hasColors && (
                <div className="mb-8">
                  <p className="text-[10px] tracking-widest uppercase text-neutral-500 mb-3">
                    Color: <span className="text-white">{state.selectedColor?.name}</span>
                  </p>
                  <div className="flex gap-3">
                    {product.colors!.map((color) => (
                      <button
                        key={color.name}
                        onClick={() => handleColorChange(color)}
                        className={`w-10 h-10 rounded-full transition-all duration-200 ${
                          state.selectedColor?.name === color.name
                            ? 'ring-2 ring-white ring-offset-2 ring-offset-black scale-110'
                            : 'hover:scale-110 ring-1 ring-white/10'
                        }`}
                        style={{ backgroundColor: color.hex }}
                        title={color.name}
                        aria-label={`Select ${color.name} color`}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Size Selector */}
              <div className="mb-8">
                <div className="flex items-center justify-between mb-4">
                  <p className="text-[10px] tracking-widest uppercase text-neutral-500">Select Size</p>
                  <button
                    onClick={() => dispatch({ type: 'TOGGLE_SIZE_CALCULATOR' })}
                    className="text-xs text-white/40 hover:text-white link-underline transition-colors"
                  >
                    What&apos;s my size?
                  </button>
                </div>
                <div className="grid grid-cols-6 gap-2">
                  {sizes.map((size) => {
                    const stock = (currentStock as Record<string, number>)?.[size] || 0;
                    const inStock = stock > 0;

                    return (
                      <button
                        key={size}
                        onClick={() => inStock && dispatch({ type: 'SET_SIZE', size })}
                        disabled={!inStock}
                        className={`
                          h-12 text-xs font-medium tracking-wider uppercase transition-all duration-200
                          ${state.selectedSize === size
                            ? 'bg-white text-black scale-[1.02]'
                            : inStock
                              ? 'bg-transparent text-white border border-white/20 hover:border-white/40'
                              : 'bg-transparent text-neutral-600 border border-neutral-800 cursor-not-allowed line-through'
                          }
                        `}
                        style={{ transitionTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)' }}
                        aria-label={`Size ${size}${!inStock ? ', out of stock' : state.selectedSize === size ? ', selected' : ''}`}
                      >
                        {size}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Model Info */}
              {(product.modelSize || product.modelHeight) && (
                <div className="mb-8 p-3 bg-white/5 rounded-lg">
                  <p className="text-[10px] tracking-widest uppercase text-neutral-500 mb-1">Model Info</p>
                  <p className="text-sm text-white/60">
                    {product.modelSize && `Size: ${product.modelSize}`}
                    {product.modelSize && product.modelHeight && ' \u2022 '}
                    {product.modelHeight && `Height: ${product.modelHeight}`}
                  </p>
                </div>
              )}

              {/* Stock Error */}
              {state.stockError && (
                <div className="mb-3 p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded">
                  {state.stockError}
                </div>
              )}

              {/* Add to Cart Button */}
              <button
                ref={addToCartRef}
                onClick={handleAddToCart}
                disabled={!state.selectedSize || state.isAdding}
                className={`
                  w-full h-14 text-sm font-bold tracking-widest uppercase
                  flex items-center justify-center gap-3 mb-4
                  transition-all duration-300
                  ${state.isAdded
                    ? 'bg-green-500 text-black scale-[0.98]'
                    : state.selectedSize
                      ? 'bg-white text-black hover:scale-[1.01] active:scale-[0.98]'
                      : 'bg-neutral-800 text-neutral-500 cursor-not-allowed'
                  }
                `}
                style={{ transitionTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)' }}
              >
                {state.isAdding ? (
                  <div className="w-5 h-5 border-2 border-black/20 border-t-black rounded-full animate-spin" />
                ) : state.isAdded ? (
                  <><Check className="w-5 h-5" /> Added</>
                ) : (
                  <><ShoppingBag className="w-5 h-5" /> Add to Cart &mdash; {formatPrice(convertPrice(getCadPrice(product), currency), currency)}</>
                )}
              </button>

              {/* Free Shipping Banner */}
              <div className="mb-4 flex items-center gap-2 text-xs text-white/50">
                <Truck className="w-4 h-4" />
                <span>Free shipping on orders over $150</span>
              </div>

              {/* Impact Badge */}
              <div className="mb-8 p-4 border-l-2 border-white/20 bg-white/[0.02] flex items-start gap-3">
                <Image src="/diamond-white.png" alt="" width={20} height={20} className="w-5 h-5 opacity-40 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-neutral-300 leading-relaxed">
                  This item funds <span className="text-white font-medium">{impactMinutes} minutes</span> of survivor therapy.
                </p>
              </div>

              {/* Delivery Accordion */}
              <div className="border-t border-white/10">
                <button
                  onClick={() => dispatch({ type: 'TOGGLE_DELIVERY' })}
                  className="w-full flex items-center justify-between py-4 text-left"
                  aria-expanded={state.deliveryOpen}
                  aria-controls="delivery-content"
                >
                  <div className="flex items-center gap-3">
                    <Truck className="w-4 h-4 text-white/40" />
                    <span className="text-sm text-white/70">Delivery</span>
                  </div>
                  <ChevronDown className={`w-4 h-4 text-white/40 accordion-chevron ${state.deliveryOpen ? 'open' : ''}`} />
                </button>
                <div id="delivery-content" role="region" aria-label="Delivery information" className={`accordion-content ${state.deliveryOpen ? 'open' : ''}`}>
                  <div>
                    <p className="text-sm text-white/50 pb-4 leading-relaxed">
                      {product.deliveryInfo || 'Free shipping on orders over $150. Delivery in 3-5 business days.'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Returns / Ask Question Accordion */}
              <div className="border-t border-white/10">
                <button
                  onClick={() => dispatch({ type: 'TOGGLE_RETURNS' })}
                  className="w-full flex items-center justify-between py-4 text-left"
                  aria-expanded={state.returnsOpen}
                  aria-controls="returns-content"
                >
                  <div className="flex items-center gap-3">
                    <Mail className="w-4 h-4 text-white/40" />
                    <span className="text-sm text-white/70">Returns & Questions</span>
                  </div>
                  <ChevronDown className={`w-4 h-4 text-white/40 accordion-chevron ${state.returnsOpen ? 'open' : ''}`} />
                </button>
                <div id="returns-content" role="region" aria-label="Returns and questions" className={`accordion-content ${state.returnsOpen ? 'open' : ''}`}>
                  <div>
                    <p className="text-sm text-white/50 pb-2 leading-relaxed">
                      {product.returnsInfo || 'Free returns within 30 days. Items must be unworn with tags attached.'}
                    </p>
                    <button
                      onClick={() => dispatch({ type: 'TOGGLE_QUESTION_FORM' })}
                      className="text-sm text-white/60 hover:text-white link-underline transition-colors pb-4"
                    >
                      Ask a question about this product
                    </button>
                  </div>
                </div>
              </div>

              <div className="border-t border-white/10" />
            </div>
          </div>
        </div>
      </div>

      {/* Complete Your Look / Matching Set */}
      {state.matchingProduct && (
        <ScrollReveal>
          <section className="py-20 px-6 bg-neutral-950 border-t border-white/10 mt-16">
            <div className="max-w-6xl mx-auto">
              <h2 className="text-2xl font-bebas italic tracking-wider mb-10">Complete Your Look</h2>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                <Link href={`/products/${state.matchingProduct.slug}`} className="group">
                  <div className="relative aspect-[4/5] bg-neutral-900 mb-4 flex items-center justify-center border border-white/5 group-hover:border-white/15 transition-all duration-500 group-hover:scale-[1.02] overflow-hidden">
                    {state.matchingProduct.images && state.matchingProduct.images[0] ? (
                      <Image src={state.matchingProduct.images[0]} alt="" fill className="object-cover group-hover:scale-105 transition-transform duration-700" sizes="(max-width: 768px) 100vw, 33vw" />
                    ) : (
                      <div className="flex flex-col items-center gap-2 bg-gradient-to-br from-neutral-900 via-neutral-800 to-neutral-900 w-full h-full relative overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.03] to-transparent animate-shimmer" />
                        <Image src="/diamond-white.png" alt="" width={48} height={48} className="opacity-15 relative z-10" />
                        <p className="text-[8px] tracking-[0.2em] uppercase text-white/20 relative z-10">Coming Soon</p>
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-green-400 mb-1">Matching Set</p>
                  <h3 className="text-lg font-bebas italic">{state.matchingProduct.title}</h3>
                  <p className="text-white/40">{formatPrice(convertPrice(getCadPrice(state.matchingProduct), currency), currency)}</p>
                </Link>
              </div>
            </div>
          </section>
        </ScrollReveal>
      )}

      {/* Customer Reviews — server-fetched, no client-side Firebase needed */}
      <ProductReviews initialReviews={initialReviews} />

      <Footer />

      {/* Sticky mobile add-to-cart bar */}
      {showStickyBar && (
        <div className="fixed bottom-0 left-0 right-0 z-50 lg:hidden bg-black/95 backdrop-blur-xl border-t border-white/10 safe-area-padding animate-slide-up">
          <div className="flex items-center justify-between gap-4 px-4 py-3">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{product.title}</p>
              <p className="text-xs text-[var(--accent)]">{formatPrice(convertPrice(getCadPrice(product), currency), currency)}</p>
            </div>
            <button
              onClick={state.selectedSize ? handleAddToCart : () => {
                // Scroll to size selector
                document.querySelector('[aria-label="Select Size"]')?.scrollIntoView?.({ behavior: 'smooth', block: 'center' });
              }}
              disabled={state.isAdding}
              className={`flex-shrink-0 px-6 py-3 text-xs font-bold tracking-widest uppercase transition-all duration-300 ${
                state.isAdded
                  ? 'bg-green-500 text-black'
                  : state.selectedSize
                    ? 'bg-white text-black'
                    : 'bg-[var(--accent)] text-black'
              }`}
            >
              {state.isAdding ? (
                <div className="w-4 h-4 border-2 border-black/20 border-t-black rounded-full animate-spin" />
              ) : state.isAdded ? (
                'Added'
              ) : state.selectedSize ? (
                'Add to Cart'
              ) : (
                'Select Size'
              )}
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
