'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { useCart } from '@/components/CartContext';
import { db } from '@/lib/firebase';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import type { Product } from '@/lib/firebase';

const sizes = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];

export default function CollectionsPage() {
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const { addToCart } = useCart();

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const q = query(collection(db, 'products'), orderBy('displayOrder', 'asc'));
        const snapshot = await getDocs(q);
        const productsData = snapshot.docs.map(doc => ({ 
          id: doc.id, 
          ...doc.data() 
        } as Product));
        setProducts(productsData);
      } catch (err: any) {
        console.error('Query error:', err.message);
        const fallbackQ = query(collection(db, 'products'));
        const fallbackSnap = await getDocs(fallbackQ);
        const productsData = fallbackSnap.docs.map(doc => ({ 
          id: doc.id, 
          ...doc.data() 
        } as Product));
        productsData.sort((a, b) => (a.displayOrder || 999) - (b.displayOrder || 999));
        setProducts(productsData);
      }
      setLoading(false);
    };

    fetchProducts();
  }, []);

  const filteredProducts = selectedCategory === 'All' 
    ? products 
    : products.filter(p => p.category === selectedCategory);

  const handleAddToCart = (product: Product, size: string) => {
    addToCart({
      id: `${product.id}-${size}`,
      name: product.title,
      price: product.price,
      quantity: 1,
      size,
    });
    alert(`${product.title} (Size ${size}) added to cart!`);
  };

  return (
    <main className="min-h-screen bg-black text-white font-mono">
      <Navbar />

      {/* Hero */}
      <section className="pt-32 pb-16 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-xs tracking-[0.3em] uppercase text-white/50 mb-4">Premium Activewear</p>
            <h1 className="text-6xl md:text-8xl font-bebas italic tracking-tight uppercase mb-6">
              Shop Collection
            </h1>
            <p className="text-lg text-white/40 max-w-2xl mx-auto italic">
              Every piece engineered for performance. 10% of every order supports survivors.
            </p>
          </div>

          {/* Category Filter */}
          <div className="flex justify-center gap-4 mb-12">
            {['All', 'Men', 'Women'].map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-6 py-3 text-sm tracking-widest uppercase rounded-xl transition-all ${
                  selectedCategory === cat
                    ? 'bg-white text-black'
                    : 'border border-white/20 text-white/60 hover:text-white hover:border-white/40'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Products Grid */}
          {loading ? (
            <div className="flex justify-center py-20">
              <div className="w-12 h-12 border-2 border-white border-t-transparent rounded-full animate-spin" />
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-white/40 text-xl mb-4">No products yet</p>
              <p className="text-white/30">Add products in the admin dashboard</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredProducts.map((product) => (
                <ProductCard key={product.id} product={product} onAddToCart={handleAddToCart} />
              ))}
            </div>
          )}
        </div>
      </section>

      <Footer />
    </main>
  );
}

function ProductCard({ product, onAddToCart }: { 
  product: Product;
  onAddToCart: (p: Product, size: string) => void;
}) {
  const [added, setAdded] = useState(false);

  // Check if size is in stock
  const isSizeInStock = (size: string) => {
    return (product.stock as Record<string, number>)?.[size] > 0;
  };

  // Auto-select first available size (prefer M if in stock, otherwise first available)
  const getDefaultSize = () => {
    if (isSizeInStock('M')) return 'M';
    const firstAvailable = sizes.find(size => isSizeInStock(size));
    return firstAvailable || 'M';
  };

  const [selectedSize, setSelectedSize] = useState(getDefaultSize());
  const donation = (product.price * 0.10).toFixed(2);

  const handleAdd = () => {
    if (!isSizeInStock(selectedSize)) return;
    onAddToCart(product, selectedSize);
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  };

  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden hover:border-white/20 transition-all">
      {/* Image Placeholder */}
      <Link href={`/products/${product.slug}`} className="block">
        <div className="aspect-square bg-neutral-900 flex items-center justify-center relative group">
          <img 
            src="/diamond-white.png" 
            alt="" 
            className="w-20 h-20 opacity-20 group-hover:opacity-40 transition-opacity"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
      </Link>

      {/* Content */}
      <div className="p-6">
        <p className="text-xs tracking-widest uppercase text-white/40 mb-2">{product.category}</p>
        <Link href={`/products/${product.slug}`}>
          <h3 className="text-2xl font-bebas italic uppercase tracking-wide mb-2 hover:opacity-70 transition-opacity">{product.title}</h3>
        </Link>
        <p className="text-white/60 text-sm mb-4">{product.subtitle}</p>

        {/* Impact */}
        <div className="flex items-center gap-2 mb-4 text-green-400 text-sm">
          <div className="w-2 h-2 rounded-full bg-green-400" />
          <span>${donation} supports survivors</span>
        </div>

        {/* Price */}
        <p className="text-2xl font-bebas italic mb-4">${product.price}</p>

        {/* Size Selector */}
        <div className="mb-4">
          <p className="text-xs tracking-widest uppercase text-white/40 mb-2">Size</p>
          <div className="flex flex-wrap gap-2">
            {sizes.map((size) => {
              const inStock = isSizeInStock(size);
              return (
                <button
                  key={size}
                  onClick={() => inStock && setSelectedSize(size)}
                  disabled={!inStock}
                  className={`w-10 h-10 flex items-center justify-center text-sm rounded-lg transition-all ${
                    selectedSize === size
                      ? 'bg-white text-black'
                      : inStock
                        ? 'border border-white/20 text-white/60 hover:text-white hover:border-white/40'
                        : 'border border-neutral-800 text-neutral-700 cursor-not-allowed line-through'
                  }`}
                >
                  {size}
                </button>
              );
            })}
          </div>
        </div>

        {/* Add to Cart */}
        <button
          onClick={handleAdd}
          disabled={!isSizeInStock(selectedSize)}
          className={`w-full py-4 font-bebas italic text-lg tracking-widest uppercase rounded-xl transition-all ${
            added
              ? 'bg-green-500 text-white'
              : isSizeInStock(selectedSize)
                ? 'bg-white text-black hover:scale-[1.02]'
                : 'bg-neutral-800 text-neutral-500 cursor-not-allowed'
          }`}
        >
          {added ? 'Added ✓' : isSizeInStock(selectedSize) ? 'Add to Cart' : 'Out of Stock'}
        </button>
      </div>
    </div>
  );
}
