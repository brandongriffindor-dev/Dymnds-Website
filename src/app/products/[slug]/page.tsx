'use client';

import { useState, useCallback, useEffect } from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import { getProductBySlug } from '@/lib/mock-products';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Check, ShoppingBag, Diamond } from 'lucide-react';

interface ProductPageProps {
  params: {
    slug: string;
  };
}

export default function ProductPage({ params }: ProductPageProps) {
  const product = getProductBySlug(params.slug);
  
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [isAdded, setIsAdded] = useState(false);
  const [hoveredImage, setHoveredImage] = useState<number | null>(null);
  
  // Embla carousel for mobile
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true });
  const [selectedSlide, setSelectedSlide] = useState(0);

  useEffect(() => {
    if (!emblaApi) return;
    
    const onSelect = () => {
      setSelectedSlide(emblaApi.selectedScrollSnap());
    };
    
    emblaApi.on('select', onSelect);
    return () => {
      emblaApi.off('select', onSelect);
    };
  }, [emblaApi]);

  const scrollTo = useCallback(
    (index: number) => emblaApi && emblaApi.scrollTo(index),
    [emblaApi]
  );

  const handleAddToCart = async () => {
    if (!selectedSize) return;
    
    setIsAdding(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 500));
    
    setIsAdding(false);
    setIsAdded(true);
    
    // Reset after 2 seconds
    setTimeout(() => setIsAdded(false), 2000);
  };

  if (!product) {
    return (
      <main className="min-h-screen bg-black text-white font-mono flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-bebas italic mb-4">PRODUCT NOT FOUND</h1>
          <p className="text-white/40">This item doesn&apos;t exist in our collection.</p>
        </div>
      </main>
    );
  }

  const isSizeAvailable = (size: string) => {
    return product.sizes.find(s => s.size === size)?.inStock ?? false;
  };

  return (
    <main className="min-h-screen bg-black text-white">
      <Navbar />
      
      <div className="pt-20 lg:pt-24">
        <div className="lg:flex lg:min-h-[calc(100vh-6rem)]">
          
          {/* LEFT SIDE - GALLERY */}
          <div className="lg:w-[60%] lg:sticky lg:top-24 lg:h-[calc(100vh-6rem)]">
            
            {/* Desktop: Masonry Grid */}
            <div className="hidden lg:grid grid-cols-2 gap-1">
              {product.images.map((image, index) => (
                <div
                  key={index}
                  className="relative aspect-[3/4] bg-neutral-900 overflow-hidden cursor-zoom-in group"
                  onMouseEnter={() => setHoveredImage(index)}
                  onMouseLeave={() => setHoveredImage(null)}
                >
                  <div 
                    className={`absolute inset-0 bg-neutral-800 transition-transform duration-700 ease-out ${
                      hoveredImage === index ? 'scale-110' : 'scale-100'
                    }`}
                  >
                    {/* Placeholder - replace with actual image */}
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-neutral-900 to-neutral-800">
                      <img 
                        src="/diamond-white.png" 
                        alt="" 
                        className="w-20 h-20 opacity-20"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Mobile: Swipe Carousel */}
            <div className="lg:hidden relative">
              <div className="overflow-hidden" ref={emblaRef}>
                <div className="flex">
                  {product.images.map((image, index) => (
                    <div key={index} className="flex-[0_0_100%] min-w-0">
                      <div className="aspect-[3/4] bg-neutral-900 relative">
                        <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-neutral-900 to-neutral-800">
                          <img 
                            src="/diamond-white.png" 
                            alt="" 
                            className="w-24 h-24 opacity-20"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Dot Indicators */}
              <div className="flex justify-center gap-2 mt-4">
                {product.images.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => scrollTo(index)}
                    className={`w-2 h-2 rounded-full transition-all duration-300 ${
                      selectedSlide === index 
                        ? 'bg-white w-6' 
                        : 'bg-white/30'
                    }`}
                    aria-label={`Go to slide ${index + 1}`}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* RIGHT SIDE - BUY BOX (STICKY) */}
          <div className="lg:w-[40%] px-6 py-8 lg:px-12 lg:py-16">
            <div className="lg:sticky lg:top-32">
              
              {/* Header */}
              <div className="mb-8">
                <h1 className="text-3xl lg:text-4xl font-bebas italic tracking-wide uppercase mb-2">
                  {product.name}
                </h1>
                <p className="text-neutral-400 text-sm mb-4">
                  {product.subtitle}
                </p>
                <p className="text-2xl lg:text-3xl font-medium">
                  ${product.price}
                </p>
              </div>

              {/* Description */}
              <p className="text-neutral-300 text-sm leading-relaxed mb-6">
                {product.description}
              </p>

              {/* Fabric Tech */}
              <div className="mb-8 pb-8 border-b border-white/10">
                <p className="text-[10px] tracking-widest uppercase text-neutral-500 mb-2">
                  Fabric Technology
                </p>
                <p className="text-xs text-neutral-300">
                  {product.fabricTech}
                </p>
              </div>

              {/* Size Selector */}
              <div className="mb-8">
                <p className="text-[10px] tracking-widest uppercase text-neutral-500 mb-4">
                  Select Size
                </p>
                <div className="grid grid-cols-6 gap-2">
                  {product.sizes.map(({ size, inStock }) => (
                    <button
                      key={size}
                      onClick={() => inStock && setSelectedSize(size)}
                      disabled={!inStock}
                      className={`
                        h-12 text-xs font-medium tracking-wider uppercase transition-all duration-200
                        ${selectedSize === size 
                          ? 'bg-white text-black' 
                          : inStock 
                            ? 'bg-transparent text-white border border-white/20 hover:border-white/40'
                            : 'bg-transparent text-neutral-600 border border-neutral-800 cursor-not-allowed line-through'
                        }
                      `}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>

              {/* Add to Cart Button */}
              <button
                onClick={handleAddToCart}
                disabled={!selectedSize || isAdding}
                className={`
                  w-full h-14 text-sm font-bold tracking-widest uppercase transition-all duration-300
                  flex items-center justify-center gap-3
                  ${isAdded 
                    ? 'bg-green-500 text-black' 
                    : selectedSize 
                      ? 'bg-white text-black hover:bg-neutral-200'
                      : 'bg-neutral-800 text-neutral-500 cursor-not-allowed'
                  }
                `}
              >
                {isAdding ? (
                  <div className="w-5 h-5 border-2 border-black/20 border-t-black rounded-full animate-spin" />
                ) : isAdded ? (
                  <>
                    <Check className="w-5 h-5" />
                    ADDED
                  </>
                ) : (
                  <>
                    <ShoppingBag className="w-5 h-5" />
                    ADD TO CART — ${product.price}
                  </>
                )}
              </button>

              {/* Impact Badge */}
              <div className="mt-6 p-4 border border-white/10 bg-white/[0.02] flex items-start gap-3">
                <Diamond className="w-5 h-5 text-neutral-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs text-neutral-300 leading-relaxed">
                    This item funds <span className="text-white font-medium">{product.impactMinutes} minutes</span> of survivor therapy.
                  </p>
                </div>
              </div>

              {/* Product Details */}
              <div className="mt-8 pt-8 border-t border-white/10">
                <p className="text-[10px] tracking-widest uppercase text-neutral-500 mb-4">
                  Product Details
                </p>
                <ul className="space-y-2">
                  {product.details.map((detail, index) => (
                    <li key={index} className="text-xs text-neutral-400 flex items-start gap-2">
                      <span className="text-white/40">—</span>
                      {detail}
                    </li>
                  ))}
                </ul>
              </div>

            </div>
          </div>

        </div>
      </div>

      <Footer />
    </main>
  );
}
