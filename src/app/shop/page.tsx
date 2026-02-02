'use client';

import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { useCart } from '@/components/CartContext';
import { useState, useEffect } from 'react';

interface ShopifyVariant {
  id: string;
  title: string;
  price: string;
  inventory_quantity: number;
}

interface ShopifyProduct {
  id: string;
  title: string;
  handle: string;
  description: string;
  product_type: string;
  tags: string;
  variants: ShopifyVariant[];
  images: { src: string }[];
}

const sizes = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];

export default function ShopPage() {
  const [activeCategory, setActiveCategory] = useState<'all' | 'men' | 'women'>('all');
  const { addToCart, cart, subtotal } = useCart();
  const [showCart, setShowCart] = useState(false);
  const [products, setProducts] = useState<ShopifyProduct[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch real products from Shopify
  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const response = await fetch('https://dymnds.myshopify.com/api/2024-01/products.json?limit=50', {
        headers: {
          'X-Shopify-Storefront-Access-Token': 'your-storefront-token-here'
        }
      });
      
      // For now, use the Storefront API or fetch from our admin API
      // Since we need to handle CORS, let's use a simpler approach
      const data = await fetch('/api/storefront/products').then(r => r.json()).catch(() => null);
      
      if (data?.products) {
        setProducts(data.products);
      } else {
        // Fallback: fetch from admin API through a proxy
        const adminData = await fetch('https://dymnds-admin.vercel.app/api/products').then(r => r.json()).catch(() => null);
        if (adminData?.products) {
          setProducts(adminData.products);
        }
      }
    } catch (err) {
      console.error('Failed to fetch products:', err);
    } finally {
      setLoading(false);
    }
  };

  // Filter products by category
  const getCategory = (product: ShopifyProduct) => {
    const type = product.product_type?.toLowerCase() || '';
    const tags = product.tags?.toLowerCase() || '';
    if (type.includes('men') || tags.includes('men')) return 'men';
    if (type.includes('women') || tags.includes('women')) return 'women';
    return 'men'; // default
  };

  const filteredProducts = activeCategory === 'all' 
    ? products 
    : products.filter(p => getCategory(p) === activeCategory);

  const handleCheckout = () => {
    window.location.href = 'https://dymnds.myshopify.com/cart';
  };

  return (
    <main className="min-h-screen bg-black text-white">
      <Navbar />

      <section className="pt-32 pb-24 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-3 gap-12">
            {/* Products Column */}
            <div className="lg:col-span-2">
              {/* Header */}
              <div className="mb-12">
                <h1 className="text-5xl md:text-6xl font-light tracking-tight mb-4" style={{ fontFamily: "'Bebas Neue', sans-serif" }}>
                  Shop
                </h1>
                <p className="text-white/50">Premium activewear. Real impact.</p>
                {loading && <p className="text-white/30 mt-2">Loading products...</p>}
              </div>

              {/* Category Filter */}
              <div className="flex gap-4 mb-10">
                {[
                  { key: 'all', label: 'All' },
                  { key: 'men', label: 'Men' },
                  { key: 'women', label: 'Women' },
                ].map((cat) => (
                  <button
                    key={cat.key}
                    onClick={() => setActiveCategory(cat.key as 'all' | 'men' | 'women')}
                    className={`px-6 py-3 text-xs tracking-[0.2em] uppercase transition-all ${
                      activeCategory === cat.key
                        ? 'bg-white text-black'
                        : 'border border-white/20 text-white/60 hover:text-white hover:border-white/40'
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>

              {/* Products Grid */}
              {products.length === 0 && !loading ? (
                <div className="text-center py-16">
                  <p className="text-white/40">No products available</p>
                </div>
              ) : (
                <div className="grid md:grid-cols-2 gap-8">
                  {filteredProducts.map((product) => (
                    <ProductCard key={product.id} product={product} onAddToCart={addToCart} />
                  ))}
                </div>
              )}
            </div>

            {/* Cart/Checkout Sidebar */}
            <div className="lg:col-span-1">
              <div className="sticky top-32 border border-white/10 p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl tracking-wide" style={{ fontFamily: "'Bebas Neue', sans-serif" }}>
                    Your Cart
                  </h2>
                  <span className="text-sm text-white/50">
                    {cart.length} {cart.length === 1 ? 'item' : 'items'}
                  </span>
                </div>

                {cart.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-white/40 mb-4">Your cart is empty</p>
                    <p className="text-white/30 text-sm">Add items to make an impact</p>
                    <div className="mt-6 p-4 bg-white/5 border border-white/10 rounded-lg">
                      <p className="text-xs text-white/50">
                        💎 Every $89 funds 1 hour of survivor therapy
                      </p>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="space-y-4 mb-6 max-h-64 overflow-y-auto">
                      {cart.map((item) => (
                        <div key={item.id} className="flex justify-between items-center py-3 border-b border-white/5">
                          <div>
                            <p className="text-sm">{item.name}</p>
                            <p className="text-xs text-white/40">Size: {item.size} × {item.quantity}</p>
                          </div>
                          <p className="text-sm">${item.price * item.quantity}</p>
                        </div>
                      ))}
                    </div>

                    <div className="border-t border-white/10 pt-4 mb-4">
                      <div className="flex justify-between mb-2">
                        <span className="text-white/60">Subtotal</span>
                        <span>${subtotal}</span>
                      </div>
                    </div>

                    {/* Impact Calculator */}
                    <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-lg mb-4">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-lg">💎</span>
                        <span className="text-sm font-medium text-green-400">Your Impact</span>
                      </div>
                      <p className="text-2xl font-light text-white mb-1" style={{ fontFamily: "'Bebas Neue', sans-serif" }}>
                        {(subtotal * 0.1 / 89 * 60).toFixed(0)} minutes
                      </p>
                      <p className="text-xs text-white/60">
                        of trauma therapy funded for survivors
                      </p>
                      <div className="mt-3 pt-3 border-t border-green-500/20">
                        <p className="text-xs text-white/40">
                          ${(subtotal * 0.1).toFixed(2)} donated • 10% of every order
                        </p>
                      </div>
                    </div>

                    <div className="border-t border-white/10 pt-4 mb-6">
                      <div className="flex justify-between text-lg">
                        <span>Total</span>
                        <span>${subtotal}</span>
                      </div>
                    </div>

                    <button
                      onClick={handleCheckout}
                      className="w-full py-4 bg-white text-black text-xs tracking-[0.2em] uppercase hover:bg-white/90 transition-all"
                    >
                      Checkout
                    </button>

                    <p className="text-center text-white/30 text-xs mt-4">
                      When you wear Dymnds, you help others shine
                    </p>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}

function ProductCard({ product, onAddToCart }: { 
  product: ShopifyProduct; 
  onAddToCart: (item: { id: string; name: string; price: number; quantity: number; size: string }) => void;
}) {
  const [selectedSize, setSelectedSize] = useState('M');
  const [added, setAdded] = useState(false);

  const handleAdd = () => {
    const price = parseFloat(product.variants?.[0]?.price || '0');
    onAddToCart({
      id: `${product.id}-${selectedSize}`,
      name: product.title,
      price: price,
      quantity: 1,
      size: selectedSize,
    });
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  };

  const price = parseFloat(product.variants?.[0]?.price || '0');
  const imageUrl = product.images?.[0]?.src || '/diamond-white.png';

  return (
    <div className="group">
      <div className="aspect-[4/5] bg-neutral-900 mb-5 flex items-center justify-center border border-white/5 group-hover:border-white/20 transition-all duration-500 overflow-hidden">
        {product.images?.[0]?.src ? (
          <img 
            src={imageUrl} 
            alt={product.title}
            className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity duration-500"
          />
        ) : (
          <img src="/diamond-white.png" alt="" className="w-16 h-16 opacity-15 group-hover:opacity-40 transition-opacity duration-500" />
        )}
      </div>

      <div className="space-y-3">
        <p className="text-[10px] tracking-[0.3em] uppercase text-white/30">{product.product_type || 'Apparel'}</p>
        <h3 className="text-xl tracking-wide" style={{ fontFamily: "'Bebas Neue', sans-serif" }}>
          {product.title}
        </h3>
        <p className="text-white/40 text-sm line-clamp-2">{product.description?.replace(/<[^>]*>/g, '').slice(0, 100) || 'Premium activewear'}</p>
        <p className="text-lg">${price}</p>

        <div className="flex gap-2 pt-2">
          {sizes.map((size) => (
            <button
              key={size}
              onClick={() => setSelectedSize(size)}
              className={`w-10 h-10 flex items-center justify-center text-xs transition-all ${
                selectedSize === size
                  ? 'bg-white text-black'
                  : 'border border-white/20 text-white/50 hover:text-white hover:border-white/40'
              }`}
            >
              {size}
            </button>
          ))}
        </div>

        <button
          onClick={handleAdd}
          className={`w-full py-4 mt-3 text-xs tracking-[0.2em] uppercase transition-all ${
            added 
              ? 'bg-green-500 text-white' 
              : 'bg-white text-black hover:bg-white/90'
          }`}
        >
          {added ? 'Added ✓' : 'Add to Cart'}
        </button>
      </div>
    </div>
  );
}
