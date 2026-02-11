'use client';

import { useState, useEffect, useRef } from 'react';
import { db, type User } from '@/lib/firebase';
import { collection, query, orderBy, onSnapshot, limit } from 'firebase/firestore';
import type { Order } from '@/lib/firebase';

export function useNotifications(user: User | null) {
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [lastOrderCount, setLastOrderCount] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Notification permission check on mount
  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
      setNotificationsEnabled(true);
    }
  }, []);

  // Real-time order listener with audio alerts
  useEffect(() => {
    if (!user) return;

    audioRef.current = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBjGH0fPTgjMGHm7A7+OZSA0PVanu87plHQUuh9Dz2YU2Bhxqv+zplkcODVGm5O+4ZSAEMYrO89GFNwYdcfDr4plIDQtPp+XysWUeBjiOz/PShjYGHG7A7+SaSQ0PTqjl8bJkHwU2jc7zzYU1Bhxwv+zmm0gNC1Gn5fGzZSAFNo/M89CEMwYccPDs4plIDQtQp+TwxWUeBTiOz/PPhjUGG3Dw7OKbSA0LUqjl8cVlHwU3jM7z0YU1Bhtw8OzhmUgNC1Gn5fGzZSAFNo/M89CEMwYccPDs4ppIDQtQp+TwxWUeBTiOz/PPhjUGG3Dw7OKaSA0LUqjl8cVlIAU3jM7z0YU1Bhtw8OzhmUgNC1Ko5fHFZSAF');

    // Listen only to recent orders (limit 100) to avoid reading entire collection
    const ordersQuery = query(
      collection(db, 'orders'),
      orderBy('created_at', 'desc'),
      limit(100)
    );
    const unsubscribe = onSnapshot(ordersQuery, (snapshot) => {
      const newOrders = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Order));

      if (lastOrderCount > 0 && newOrders.length > lastOrderCount) {
        const newOrderCount = newOrders.length - lastOrderCount;
        if (audioRef.current) {
          audioRef.current.play().catch(() => {});
        }
        if (notificationsEnabled && 'Notification' in window) {
          new Notification('New Order!', {
            body: `${newOrderCount} new order${newOrderCount > 1 ? 's' : ''} received`,
            icon: '/favicon.ico',
          });
        }
      }

      setLastOrderCount(newOrders.length);
    }, (error) => {
      console.error('Error listening to orders:', error);
    });

    return () => unsubscribe();
  }, [user, notificationsEnabled, lastOrderCount]);

  const enableNotifications = async () => {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') setNotificationsEnabled(true);
    }
  };

  return {
    notificationsEnabled,
    enableNotifications,
    audioRef,
  };
}
