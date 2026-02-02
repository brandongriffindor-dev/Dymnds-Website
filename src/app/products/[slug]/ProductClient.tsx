'use client';

import { useState, useCallback, useEffect } from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Check, ShoppingBag, Diamond } from 'lucide-react';
import type { Product } from '@/lib/firebase';
import { useCart } from '@/components/CartContext';

interface ProductClientProps {
  product: Product;
}

export default function ProductClient({ product }: ProductClientProps) {
  const { addToCart } = useCart();
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [isAdded, setIsAdded] = useState(false);
  const [hoveredImage, setHoveredImage] = useState<number | null>(null);
  
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
    await new Promise(resolve => setTimeout(resolve, 500));
    
    addToCart({
      id: `${product.id}-${selectedSize}`,
      name: product.title,
      price: Number(product.price),
      quantity: 1,
      size: selectedSize,
    });
    
    setIsAdding(false);
    setIsAdded(true);
    setTimeout(() => setIsAdded(false), 2000);
  };

  const sizes = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];
  const impactMinutes = Math.round(Number(product.price) * 0.10 * 2); // Approx 10% = ~20min per $100

  return (
    <main className="min-h-screen bg-black text-white">
      <Navbar />
      
      <div className="pt-20 lg:pt-24">
        <div className="lg:flex lg:min-h-[calc(100vh-6rem)]">
          
          {/* LEFT SIDE - GALLERY */}
          <div className="lg:w-[60%] lg:sticky lg:top-24 lg:h-[calc(100vh-6rem)]">
            
            {/* Desktop: Grid */}
            <div className="hidden lg:grid grid-cols-2 gap-1">
              {[1, 2, 3, 4].map((_, index) => (
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
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-neutral-900 to-neutral-800">
                      <img src="/diamond-white.png" alt="" className="w-20 h-20 opacity-20" />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Mobile: Carousel */}
            <div className="lg:hidden relative">
              <div className="overflow-hidden" ref={emblaRef}>
                <div className="flex">
                  {[1, 2, 3, 4].map((_, index) => (
                    <div key={index} className="flex-[0_0_100%] min-w-0">
                      <div className="aspect-[3/4] bg-neutral-900 relative">
                        <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-neutral-900 to-neutral-800">
                          <img src="/diamond-white.png" alt="" className="w-24 h-24 opacity-20" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="flex justify-center gap-2 mt-4">
                {[0, 1, 2, 3].map((index) => (
                  <button
                    key={index}
                    onClick={() => scrollTo(index)}
                    className={`w-2 h-2 rounded-full transition-all duration-300 ${
                      selectedSlide === index ? 'bg-white w-6' : 'bg-white/30'
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* RIGHT SIDE - BUY BOX */}
          <div className="lg:w-[40%] px-6 py-8 lg:px-12 lg:py-16">
            <div className="lg:sticky lg:top-32">
              
              <div className="mb-8">
                <h1 className="text-3xl lg:text-4xl font-bebas italic tracking-wide uppercase mb-2">
                  {product.title}
                </h1>
                <p className="text-neutral-400 text-sm mb-4">{product.subtitle}</p>
                <p className="text-2xl lg:text-3xl font-medium">${product.price}</p>
              </div>

              {/* Size Selector */}
              <div className="mb-8">
                <p className="text-[10px] tracking-widest uppercase text-neutral-500 mb-4">Select Size</p>
                <div className="grid grid-cols-6 gap-2">
                  {sizes.map((size) => {
                    const stock = (product.stock as Record<string, number>)?.[size] || 0;
                    const inStock = stock > 0;
                    
                    return (
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
                        {!inStock && <span className="block text-[8px] text-neutral-700">0</span>}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Add to Cart */}
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
                  <><Check className="w-5 h-5" /> ADDED</>
                ) : (
                  <><ShoppingBag className="w-5 h-5" /> ADD TO CART — ${product.price}</>
                )}
              </button>

              {/* Impact Badge */}
              <div className="mt-6 p-4 border border-white/10 bg-white/[0.02] flex items-start gap-3">
                <Diamond className="w-5 h-5 text-neutral-400 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-neutral-300">
                  This item funds <span className="text-white font-medium">{impactMinutes} minutes</span> of survivor therapy.
                </p>
              </div>

            </div>
          </div>

        </div>
      </div>

      <Footer />
    </main>
  );
}
