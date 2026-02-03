'use client';

import { useState, useCallback, useEffect } from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Check, ShoppingBag, Diamond, Truck, RotateCcw, Mail, ChevronDown, ChevronUp, X } from 'lucide-react';
import type { Product } from '@/lib/firebase';
import { useCart } from '@/components/CartContext';
import { db } from '@/lib/firebase';
import { doc, getDoc, collection, query, where, getDocs, limit } from 'firebase/firestore';
import Link from 'next/link';

interface ProductClientProps {
  product: Product;
}

// Size Calculator Component
function SizeCalculator({ sizeGuide, onClose }: { sizeGuide?: Product['sizeGuide']; onClose: () => void }) {
  const [chest, setChest] = useState('');
  const [waist, setWaist] = useState('');
  const [recommendedSize, setRecommendedSize] = useState<string | null>(null);

  const calculateSize = () => {
    const chestNum = parseFloat(chest);
    const waistNum = parseFloat(waist);

    if (!chestNum && !waistNum) return;

    // Simple logic - prioritize chest for tops, waist for bottoms
    let size = 'M'; // default
    
    if (chestNum <= 34 || waistNum <= 28) size = 'XS';
    else if (chestNum <= 37 || waistNum <= 31) size = 'S';
    else if (chestNum <= 40 || waistNum <= 34) size = 'M';
    else if (chestNum <= 43 || waistNum <= 37) size = 'L';
    else if (chestNum <= 46 || waistNum <= 40) size = 'XL';
    else size = 'XXL';

    setRecommendedSize(size);
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-neutral-900 border border-white/10 rounded-2xl p-8 w-full max-w-md">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bebas italic tracking-wider">Find Your Size</h3>
          <button onClick={onClose} className="text-white/40 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4 mb-6">
          <div>
            <label className="block text-xs uppercase tracking-wider text-white/40 mb-2">Chest (inches)</label>
            <input
              type="number"
              value={chest}
              onChange={(e) => setChest(e.target.value)}
              placeholder="e.g., 38"
              className="w-full bg-black border border-white/20 rounded-lg px-4 py-3 text-white focus:border-white/50 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-xs uppercase tracking-wider text-white/40 mb-2">Waist (inches)</label>
            <input
              type="number"
              value={waist}
              onChange={(e) => setWaist(e.target.value)}
              placeholder="e.g., 32"
              className="w-full bg-black border border-white/20 rounded-lg px-4 py-3 text-white focus:border-white/50 focus:outline-none"
            />
          </div>
        </div>

        {sizeGuide && (
          <div className="mb-6 p-4 bg-white/5 rounded-lg">
            <p className="text-xs uppercase tracking-wider text-white/40 mb-2">Size Guide</p>
            <div className="grid grid-cols-3 gap-2 text-xs text-white/60">
              {Object.entries(sizeGuide.chest || {}).map(([size, measurement]) => (
                <div key={size} className="flex justify-between">
                  <span>{size}:</span>
                  <span>{measurement}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <button
          onClick={calculateSize}
          className="w-full py-3 bg-white text-black font-bold tracking-wider uppercase rounded-lg hover:bg-white/90 transition-colors"
        >
          Calculate My Size
        </button>

        {recommendedSize && (
          <div className="mt-4 p-4 bg-green-500/10 border border-green-500/20 rounded-lg text-center">
            <p className="text-white/60 text-sm mb-1">Your recommended size:</p>
            <p className="text-3xl font-bebas italic text-green-400">{recommendedSize}</p>
          </div>
        )}
      </div>
    </div>
  );
}

// Question Form Component
function QuestionForm({ productName, onClose }: { productName: string; onClose: () => void }) {
  const [email, setEmail] = useState('');
  const [question, setQuestion] = useState('');
  const [sent, setSent] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // In a real app, you'd send this to your backend
    // For now, we'll open the user's email client
    const subject = `Question about ${productName}`;
    const body = `Product: ${productName}\n\nQuestion:\n${question}\n\nFrom: ${email}`;
    window.location.href = `mailto:support@dymnds.ca?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    setSent(true);
    setTimeout(onClose, 2000);
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-neutral-900 border border-white/10 rounded-2xl p-8 w-full max-w-md">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bebas italic tracking-wider">Ask a Question</h3>
          <button onClick={onClose} className="text-white/40 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {sent ? (
          <div className="text-center py-8">
            <div className="text-4xl mb-4">✓</div>
            <p className="text-white/60">Opening your email client...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs uppercase tracking-wider text-white/40 mb-2">Product</label>
              <p className="text-white">{productName}</p>
            </div>
            <div>
              <label className="block text-xs uppercase tracking-wider text-white/40 mb-2">Your Email *</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-black border border-white/20 rounded-lg px-4 py-3 text-white focus:border-white/50 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs uppercase tracking-wider text-white/40 mb-2">Your Question *</label>
              <textarea
                required
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                rows={4}
                className="w-full bg-black border border-white/20 rounded-lg px-4 py-3 text-white focus:border-white/50 focus:outline-none resize-none"
              />
            </div>
            <button
              type="submit"
              className="w-full py-3 bg-white text-black font-bold tracking-wider uppercase rounded-lg hover:bg-white/90 transition-colors flex items-center justify-center gap-2"
            >
              <Mail className="w-4 h-4" />
              Send to support@dymnds.ca
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

export default function ProductClient({ product }: ProductClientProps) {
  const { addToCart } = useCart();
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [isAdded, setIsAdded] = useState(false);
  const [hoveredImage, setHoveredImage] = useState<number | null>(null);
  const [showSizeCalculator, setShowSizeCalculator] = useState(false);
  const [showQuestionForm, setShowQuestionForm] = useState(false);
  const [expandedSection, setExpandedSection] = useState<string | null>(null);
  const [matchingProduct, setMatchingProduct] = useState<Product | null>(null);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  
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

  // Fetch matching set product
  useEffect(() => {
    const fetchMatchingSet = async () => {
      if (product.matchingSetSlug) {
        const q = query(collection(db, 'products'), where('slug', '==', product.matchingSetSlug), limit(1));
        const snap = await getDocs(q);
        if (!snap.empty) {
          setMatchingProduct({ id: snap.docs[0].id, ...snap.docs[0].data() } as Product);
        }
      }
    };
    fetchMatchingSet();
  }, [product.matchingSetSlug]);

  // Fetch related products (same category)
  useEffect(() => {
    const fetchRelated = async () => {
      const q = query(
        collection(db, 'products'), 
        where('category', '==', product.category),
        where('slug', '!=', product.slug),
        limit(3)
      );
      const snap = await getDocs(q);
      const products = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product));
      setRelatedProducts(products);
    };
    fetchRelated();
  }, [product.category, product.slug]);

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

  const toggleSection = (section: string) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  const sizes = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];
  const impactMinutes = Math.round(Number(product.price) * 0.10 * 2);

  return (
    <main className="min-h-screen bg-black text-white">
      <Navbar />
      
      {/* Size Calculator Modal */}
      {showSizeCalculator && (
        <SizeCalculator sizeGuide={product.sizeGuide} onClose={() => setShowSizeCalculator(false)} />
      )}

      {/* Question Form Modal */}
      {showQuestionForm && (
        <QuestionForm productName={product.title} onClose={() => setShowQuestionForm(false)} />
      )}
      
      <div className="pt-20 lg:pt-24">
        <div className="lg:flex lg:min-h-[calc(100vh-6rem)]">
          
          {/* LEFT SIDE - GALLERY */}
          <div className="lg:w-[55%] lg:sticky lg:top-24 lg:h-[calc(100vh-6rem)]">
            
            {/* Desktop: Grid */}
            <div className="hidden lg:grid grid-cols-2 gap-1">
              {[0, 1, 2, 3].map((index) => (
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
                      {product.images && product.images[index] ? (
                        <img src={product.images[index]} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <img src="/diamond-white.png" alt="" className="w-20 h-20 opacity-20" />
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Mobile: Carousel */}
            <div className="lg:hidden relative">
              <div className="overflow-hidden" ref={emblaRef}>
                <div className="flex">
                  {[0, 1, 2, 3].map((index) => (
                    <div key={index} className="flex-[0_0_100%] min-w-0">
                      <div className="aspect-[3/4] bg-neutral-900 relative">
                        <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-neutral-900 to-neutral-800">
                          {product.images && product.images[index] ? (
                            <img src={product.images[index]} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <img src="/diamond-white.png" alt="" className="w-24 h-24 opacity-20" />
                          )}
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
          <div className="lg:w-[45%] px-6 py-8 lg:px-12 lg:py-16">
            <div className="max-w-md">
              
              <div className="mb-6">
                <h1 className="text-3xl lg:text-4xl font-bebas italic tracking-wide uppercase mb-2">
                  {product.title}
                </h1>
                <p className="text-neutral-400 text-sm mb-3">{product.subtitle}</p>
                <p className="text-2xl lg:text-3xl font-medium">${product.price}</p>
              </div>

              {/* Description */}
              {product.description && (
                <div className="mb-6">
                  <p className="text-white/60 text-sm leading-relaxed">{product.description}</p>
                </div>
              )}

              {/* Features */}
              {product.features && product.features.length > 0 && (
                <div className="mb-6">
                  <p className="text-[10px] tracking-widest uppercase text-neutral-500 mb-3">Features</p>
                  <ul className="space-y-1">
                    {product.features.map((feature, idx) => (
                      <li key={idx} className="text-sm text-white/70 flex items-center gap-2">
                        <span className="w-1 h-1 bg-white/40 rounded-full" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Size Selector */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-4">
                  <p className="text-[10px] tracking-widest uppercase text-neutral-500">Select Size</p>
                  <button 
                    onClick={() => setShowSizeCalculator(true)}
                    className="text-xs text-white/40 hover:text-white underline"
                  >
                    What&apos;s my size?
                  </button>
                </div>
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

              {/* Model Info */}
              {(product.modelSize || product.modelHeight) && (
                <div className="mb-6 p-3 bg-white/5 rounded-lg">
                  <p className="text-[10px] tracking-widest uppercase text-neutral-500 mb-1">Model Info</p>
                  <p className="text-sm text-white/60">
                    {product.modelSize && `Size: ${product.modelSize}`}
                    {product.modelSize && product.modelHeight && ' • '}
                    {product.modelHeight && `Height: ${product.modelHeight}`}
                  </p>
                </div>
              )}

              {/* Add to Cart */}
              <button
                onClick={handleAddToCart}
                disabled={!selectedSize || isAdding}
                className={`
                  w-full h-14 text-sm font-bold tracking-widest uppercase transition-all duration-300
                  flex items-center justify-center gap-3 mb-4
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
              <div className="mb-6 p-4 border border-white/10 bg-white/[0.02] flex items-start gap-3">
                <Diamond className="w-5 h-5 text-neutral-400 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-neutral-300">
                  This item funds <span className="text-white font-medium">{impactMinutes} minutes</span> of survivor therapy.
                </p>
              </div>

              {/* Collapsible Sections */}
              <div className="border-t border-white/10">
                {/* Delivery & Returns */}
                <button
                  onClick={() => toggleSection('delivery')}
                  className="w-full py-4 flex items-center justify-between text-left border-b border-white/10"
                >
                  <div className="flex items-center gap-3">
                    <Truck className="w-4 h-4 text-white/40" />
                    <span className="text-sm">Delivery & Returns</span>
                  </div>
                  {expandedSection === 'delivery' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>
                {expandedSection === 'delivery' && (
                  <div className="pb-4 space-y-3">
                    <div>
                      <p className="text-xs uppercase tracking-wider text-white/40 mb-1">Delivery</p>
                      <p className="text-sm text-white/60">{product.deliveryInfo || 'Free shipping on orders over $100. Delivery in 3-5 business days.'}</p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-wider text-white/40 mb-1">Returns</p>
                      <p className="text-sm text-white/60">{product.returnsInfo || '30-day hassle-free returns. Items must be unworn with tags attached.'}</p>
                    </div>
                  </div>
                )}

                {/* Ask a Question */}
                <button
                  onClick={() => setShowQuestionForm(true)}
                  className="w-full py-4 flex items-center gap-3 text-left border-b border-white/10"
                >
                  <Mail className="w-4 h-4 text-white/40" />
                  <span className="text-sm">Ask a Question</span>
                </button>
              </div>

            </div>
          </div>

        </div>
      </div>

      {/* Matching Set / Complete Your Look */}
      {(matchingProduct || relatedProducts.length > 0) && (
        <section className="py-16 px-6 bg-neutral-950 border-t border-white/10">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-2xl font-bebas italic tracking-wider mb-8">Complete Your Look</h2>
            <div className="grid md:grid-cols-3 gap-6">
              {matchingProduct && (
                <Link href={`/products/${matchingProduct.slug}`} className="group">
                  <div className="aspect-[4/5] bg-neutral-900 mb-4 flex items-center justify-center border border-white/5 group-hover:border-white/20 transition-all">
                    {matchingProduct.images && matchingProduct.images[0] ? (
                      <img src={matchingProduct.images[0]} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <img src="/diamond-white.png" alt="" className="w-16 h-16 opacity-20" />
                    )}
                  </div>
                  <p className="text-xs text-green-400 mb-1">Matching Set</p>
                  <h3 className="text-lg font-bebas italic">{matchingProduct.title}</h3>
                  <p className="text-white/40">${matchingProduct.price}</p>
                </Link>
              )}
              
              {relatedProducts.map((related) => (
                <Link key={related.id} href={`/products/${related.slug}`} className="group">
                  <div className="aspect-[4/5] bg-neutral-900 mb-4 flex items-center justify-center border border-white/5 group-hover:border-white/20 transition-all">
                    {related.images && related.images[0] ? (
                      <img src={related.images[0]} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <img src="/diamond-white.png" alt="" className="w-16 h-16 opacity-20" />
                    )}
                  </div>
                  <h3 className="text-lg font-bebas italic">{related.title}</h3>
                  <p className="text-white/40">${related.price}</p>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      <Footer />
    </main>
  );
}
