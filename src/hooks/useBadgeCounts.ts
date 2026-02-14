'use client';

import { useState, useEffect } from 'react';
import { db, type User } from '@/lib/firebase';
import { collection, getDocs, query, orderBy, onSnapshot, limit } from 'firebase/firestore';
import type { Product, Order } from '@/lib/firebase';

export function useBadgeCounts(user: User | null) {
  const [pendingOrderCount, setPendingOrderCount] = useState(0);
  const [lowStockCount, setLowStockCount] = useState(0);
  const [unreadMessagesCount, setUnreadMessagesCount] = useState(0);

  // Real-time pending order count from order listener
  useEffect(() => {
    if (!user) return;

    const ordersQuery = query(
      collection(db, 'orders'),
      orderBy('created_at', 'desc'),
      limit(100)
    );
    const unsubscribe = onSnapshot(ordersQuery, (snapshot) => {
      const newOrders = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Order));
      setPendingOrderCount(newOrders.filter(o => o.status === 'pending').length);
    }, (error) => {
      console.error('Error listening to orders:', error);
    });

    return () => unsubscribe();
  }, [user]);

  // Fetch low stock count for badge
  useEffect(() => {
    if (!user) return;
    const fetchLowStock = async () => {
      try {
        const productsSnap = await getDocs(collection(db, 'products'));
        const productsData = productsSnap.docs.map(d => ({ id: d.id, ...d.data() } as Product));
        const sizes = ['XS', 'S', 'M', 'L', 'XL'];
        let count = 0;
        productsData.forEach(p => {
          const colors = p.colors || [];
          if (colors.length > 0) {
            colors.forEach((color) => {
              sizes.forEach(size => {
                if (((color.stock as Record<string, number>)?.[size] || 0) < 5) count++;
              });
            });
          } else {
            sizes.forEach(size => {
              if (((p.stock as Record<string, number>)?.[size] || 0) < 5) count++;
            });
          }
        });
        setLowStockCount(count);
      } catch (err) {
        console.error('Error fetching low stock:', err);
      }
    };
    fetchLowStock();
  }, [user]);

  // Fetch unread messages count for badge
  useEffect(() => {
    if (!user) return;
    const fetchUnreadMessages = async () => {
      try {
        const messagesSnap = await getDocs(collection(db, 'contact_messages'));
        const unread = messagesSnap.docs.filter(d => d.data().read !== true).length;
        setUnreadMessagesCount(unread);
      } catch (err) {
        console.error('Error fetching unread messages:', err);
      }
    };
    fetchUnreadMessages();
  }, [user]);

  return {
    pendingOrderCount,
    lowStockCount,
    unreadMessagesCount,
  };
}
