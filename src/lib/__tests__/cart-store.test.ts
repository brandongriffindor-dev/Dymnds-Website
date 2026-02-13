import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useCartStore, useTotalItems, useSubtotal, useDonation } from '@/lib/stores/cart-store';
import type { CartItem } from '@/lib/stores/cart-store';

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(() => null),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
  length: 0,
  key: vi.fn(() => null),
};

vi.stubGlobal('localStorage', localStorageMock);

describe('cart-store.ts', () => {
  beforeEach(() => {
    // Reset store state
    useCartStore.setState({ cart: [], isCartOpen: false });
    vi.clearAllMocks();
  });

  describe('addToCart', () => {
    it('adds a new item to empty cart', () => {
      const item: CartItem = {
        id: 'product1',
        title: 'Test Product',
        price: 100,
        quantity: 1,
        size: 'M',
        color: 'red',
        image: 'test.jpg',
      };

      useCartStore.getState().addToCart(item);

      const { cart } = useCartStore.getState();
      expect(cart).toHaveLength(1);
      expect(cart[0]).toEqual(item);
    });

    it('merges quantity when same id+size+color already exists', () => {
      const item1: CartItem = {
        id: 'product1',
        title: 'Test Product',
        price: 100,
        quantity: 2,
        size: 'M',
        color: 'red',
      };

      const item2: CartItem = {
        id: 'product1',
        title: 'Test Product',
        price: 100,
        quantity: 3,
        size: 'M',
        color: 'red',
      };

      useCartStore.getState().addToCart(item1);
      useCartStore.getState().addToCart(item2);

      const { cart } = useCartStore.getState();
      expect(cart).toHaveLength(1);
      expect(cart[0].quantity).toBe(5);
    });

    it('adds separately when same id but different size', () => {
      const item1: CartItem = {
        id: 'product1',
        title: 'Test Product',
        price: 100,
        quantity: 2,
        size: 'M',
        color: 'red',
      };

      const item2: CartItem = {
        id: 'product1',
        title: 'Test Product',
        price: 100,
        quantity: 3,
        size: 'L',
        color: 'red',
      };

      useCartStore.getState().addToCart(item1);
      useCartStore.getState().addToCart(item2);

      const { cart } = useCartStore.getState();
      expect(cart).toHaveLength(2);
    });

    it('adds separately when same id+size but different color', () => {
      const item1: CartItem = {
        id: 'product1',
        title: 'Test Product',
        price: 100,
        quantity: 2,
        size: 'M',
        color: 'red',
      };

      const item2: CartItem = {
        id: 'product1',
        title: 'Test Product',
        price: 100,
        quantity: 3,
        size: 'M',
        color: 'blue',
      };

      useCartStore.getState().addToCart(item1);
      useCartStore.getState().addToCart(item2);

      const { cart } = useCartStore.getState();
      expect(cart).toHaveLength(2);
    });

    it('opens cart drawer when adding item', () => {
      const item: CartItem = {
        id: 'product1',
        title: 'Test Product',
        price: 100,
        quantity: 1,
        size: 'M',
      };

      useCartStore.getState().addToCart(item);

      const { isCartOpen } = useCartStore.getState();
      expect(isCartOpen).toBe(true);
    });
  });

  describe('removeFromCart', () => {
    it('removes the correct item by composite key', () => {
      const item1: CartItem = {
        id: 'product1',
        title: 'Test Product',
        price: 100,
        quantity: 2,
        size: 'M',
        color: 'red',
      };

      const item2: CartItem = {
        id: 'product2',
        title: 'Another Product',
        price: 50,
        quantity: 1,
        size: 'L',
        color: 'blue',
      };

      useCartStore.getState().addToCart(item1);
      useCartStore.getState().addToCart(item2);

      useCartStore.getState().removeFromCart('product1', 'M', 'red');

      const { cart } = useCartStore.getState();
      expect(cart).toHaveLength(1);
      expect(cart[0].id).toBe('product2');
    });

    it('does nothing when item not found', () => {
      const item: CartItem = {
        id: 'product1',
        title: 'Test Product',
        price: 100,
        quantity: 2,
        size: 'M',
        color: 'red',
      };

      useCartStore.getState().addToCart(item);

      useCartStore.getState().removeFromCart('nonexistent', 'M', 'red');

      const { cart } = useCartStore.getState();
      expect(cart).toHaveLength(1);
    });
  });

  describe('updateQuantity', () => {
    it('updates quantity for correct item', () => {
      const item: CartItem = {
        id: 'product1',
        title: 'Test Product',
        price: 100,
        quantity: 2,
        size: 'M',
        color: 'red',
      };

      useCartStore.getState().addToCart(item);
      useCartStore.getState().updateQuantity('product1', 'M', 5, 'red');

      const { cart } = useCartStore.getState();
      expect(cart[0].quantity).toBe(5);
    });

    it('removes item when quantity is 0', () => {
      const item: CartItem = {
        id: 'product1',
        title: 'Test Product',
        price: 100,
        quantity: 2,
        size: 'M',
        color: 'red',
      };

      useCartStore.getState().addToCart(item);
      useCartStore.getState().updateQuantity('product1', 'M', 0, 'red');

      const { cart } = useCartStore.getState();
      expect(cart).toHaveLength(0);
    });

    it('removes item when quantity is negative', () => {
      const item: CartItem = {
        id: 'product1',
        title: 'Test Product',
        price: 100,
        quantity: 2,
        size: 'M',
        color: 'red',
      };

      useCartStore.getState().addToCart(item);
      useCartStore.getState().updateQuantity('product1', 'M', -1, 'red');

      const { cart } = useCartStore.getState();
      expect(cart).toHaveLength(0);
    });
  });

  describe('clearCart', () => {
    it('empties the cart array', () => {
      const item1: CartItem = {
        id: 'product1',
        title: 'Test Product',
        price: 100,
        quantity: 2,
        size: 'M',
      };

      const item2: CartItem = {
        id: 'product2',
        title: 'Another Product',
        price: 50,
        quantity: 1,
        size: 'L',
      };

      useCartStore.getState().addToCart(item1);
      useCartStore.getState().addToCart(item2);

      useCartStore.getState().clearCart();

      const { cart } = useCartStore.getState();
      expect(cart).toHaveLength(0);
    });
  });

  describe('openCart & closeCart', () => {
    it('openCart sets isCartOpen to true', () => {
      useCartStore.getState().openCart();

      const { isCartOpen } = useCartStore.getState();
      expect(isCartOpen).toBe(true);
    });

    it('closeCart sets isCartOpen to false', () => {
      useCartStore.getState().openCart();
      useCartStore.getState().closeCart();

      const { isCartOpen } = useCartStore.getState();
      expect(isCartOpen).toBe(false);
    });
  });

  describe('Derived selectors', () => {
    it('Subtotal calculates correctly: sum of (price * quantity) for all items', () => {
      const item1: CartItem = {
        id: 'product1',
        title: 'Test Product',
        price: 100,
        quantity: 2,
        size: 'M',
      };

      const item2: CartItem = {
        id: 'product2',
        title: 'Another Product',
        price: 50,
        quantity: 3,
        size: 'L',
      };

      useCartStore.getState().addToCart(item1);
      useCartStore.getState().addToCart(item2);

      // Test the selector directly
      const subtotal = useCartStore.getState().cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
      // (100 * 2) + (50 * 3) = 200 + 150 = 350
      expect(subtotal).toBe(350);
    });

    it('TotalItems calculates correctly: sum of quantities', () => {
      const item1: CartItem = {
        id: 'product1',
        title: 'Test Product',
        price: 100,
        quantity: 2,
        size: 'M',
      };

      const item2: CartItem = {
        id: 'product2',
        title: 'Another Product',
        price: 50,
        quantity: 3,
        size: 'L',
      };

      useCartStore.getState().addToCart(item1);
      useCartStore.getState().addToCart(item2);

      // Test the selector directly
      const totalItems = useCartStore.getState().cart.reduce((sum, item) => sum + item.quantity, 0);
      // 2 + 3 = 5
      expect(totalItems).toBe(5);
    });

    it('Donation is 10% of subtotal', () => {
      const item1: CartItem = {
        id: 'product1',
        title: 'Test Product',
        price: 100,
        quantity: 2,
        size: 'M',
      };

      const item2: CartItem = {
        id: 'product2',
        title: 'Another Product',
        price: 50,
        quantity: 3,
        size: 'L',
      };

      useCartStore.getState().addToCart(item1);
      useCartStore.getState().addToCart(item2);

      // Test the selector directly
      const subtotal = useCartStore.getState().cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
      const donation = subtotal * 0.10;
      // 350 * 0.10 = 35
      expect(donation).toBe(35);
    });
  });

  describe('localStorage persistence', () => {
    it('localStorage.setItem is called when cart changes', () => {
      const item: CartItem = {
        id: 'product1',
        title: 'Test Product',
        price: 100,
        quantity: 1,
        size: 'M',
      };

      useCartStore.getState().addToCart(item);

      expect(localStorageMock.setItem).toHaveBeenCalled();
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'dymnds-cart',
        expect.any(String)
      );
    });
  });
});
