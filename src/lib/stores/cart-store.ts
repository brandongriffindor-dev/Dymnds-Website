'use client';

import { create } from 'zustand';

export interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  size: string;
  color?: string;
  image?: string;
}

interface CartState {
  cart: CartItem[];
  isCartOpen: boolean;
}

interface CartActions {
  addToCart: (item: CartItem) => void;
  removeFromCart: (id: string, size: string, color?: string) => void;
  updateQuantity: (id: string, size: string, quantity: number, color?: string) => void;
  clearCart: () => void;
  openCart: () => void;
  closeCart: () => void;
}

// Max quantity per item (must match server-side OrderItemSchema)
const MAX_QUANTITY_PER_ITEM = 10;

// Composite key: id + size + color (fixes color dedup bug)
function cartKey(id: string, size: string, color?: string): string {
  return `${id}::${size}::${color || ''}`;
}

function loadCartFromStorage(): CartItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const saved = localStorage.getItem('dymnds-cart');
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
}

function saveCartToStorage(cart: CartItem[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem('dymnds-cart', JSON.stringify(cart));
  } catch {
    // Storage full or unavailable — fail silently
  }
}

export const useCartStore = create<CartState & CartActions>((set, get) => ({
  cart: loadCartFromStorage(),
  isCartOpen: false,

  addToCart: (item) => {
    const cart = get().cart;
    const key = cartKey(item.id, item.size, item.color);
    const existingIndex = cart.findIndex(
      i => cartKey(i.id, i.size, i.color) === key
    );

    let newCart: CartItem[];
    if (existingIndex >= 0) {
      newCart = cart.map((i, idx) =>
        idx === existingIndex
          ? { ...i, quantity: Math.min(i.quantity + item.quantity, MAX_QUANTITY_PER_ITEM) }
          : i
      );
    } else {
      newCart = [...cart, { ...item, quantity: Math.min(item.quantity, MAX_QUANTITY_PER_ITEM) }];
    }

    saveCartToStorage(newCart);
    set({ cart: newCart, isCartOpen: true });
  },

  removeFromCart: (id, size, color) => {
    const key = cartKey(id, size, color);
    const newCart = get().cart.filter(
      i => cartKey(i.id, i.size, i.color) !== key
    );
    saveCartToStorage(newCart);
    set({ cart: newCart });
  },

  updateQuantity: (id, size, quantity, color) => {
    if (quantity <= 0) {
      get().removeFromCart(id, size, color);
      return;
    }
    const clamped = Math.min(quantity, MAX_QUANTITY_PER_ITEM);
    const key = cartKey(id, size, color);
    const newCart = get().cart.map(i =>
      cartKey(i.id, i.size, i.color) === key
        ? { ...i, quantity: clamped }
        : i
    );
    saveCartToStorage(newCart);
    set({ cart: newCart });
  },

  clearCart: () => {
    saveCartToStorage([]);
    set({ cart: [] });
  },

  openCart: () => set({ isCartOpen: true }),
  closeCart: () => set({ isCartOpen: false }),
}));

// ---- Derived selectors (subscribe to ONLY what you need) ----

export const useTotalItems = () =>
  useCartStore(s => s.cart.reduce((sum, item) => sum + item.quantity, 0));

export const useSubtotal = () =>
  useCartStore(s => s.cart.reduce((sum, item) => sum + item.price * item.quantity, 0));

export const useDonation = () =>
  useCartStore(s => s.cart.reduce((sum, item) => sum + item.price * item.quantity, 0) * 0.10);

export const useIsCartOpen = () => useCartStore(s => s.isCartOpen);
export const useCartItems = () => useCartStore(s => s.cart);
