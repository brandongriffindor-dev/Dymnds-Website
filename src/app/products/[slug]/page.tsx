'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import ProductClient from './ProductClient';
import type { Product } from '@/lib/firebase';

export default function ProductPageWrapper() {
  const params = useParams();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProduct = async () => {
      if (!params.slug) return;
      
      // Query by slug field instead of document ID
      const q = query(collection(db, 'products'), where('slug', '==', params.slug as string));
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        const doc = querySnapshot.docs[0];
        setProduct({ id: doc.id, ...doc.data() } as Product);
      }
      setLoading(false);
    };

    fetchProduct();
  }, [params.slug]);

  if (loading) {
    return (
      <main className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="w-12 h-12 border-2 border-white border-t-transparent rounded-full animate-spin" />
      </main>
    );
  }

  if (!product) {
    return (
      <main className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-bebas italic mb-4">PRODUCT NOT FOUND</h1>
          <p className="text-white/40">This item doesn&apos;t exist in our collection.</p>
        </div>
      </main>
    );
  }

  return <ProductClient product={product} />;
}
