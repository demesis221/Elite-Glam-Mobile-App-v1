import { router } from 'expo-router';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { Alert } from 'react-native';
import { CartItem, cartService } from '../services/cart.service';
import { Product } from '../services/products.service';
import { useAuth } from './AuthContext';

// Cart context interface
interface CartContextType {
  cartItems: CartItem[];
  cartCount: number;
  isLoading: boolean;
  addToCart: (product: Product, quantity?: number) => Promise<void>;
  removeFromCart: (itemId: string) => Promise<void>;
  updateQuantity: (itemId: string, quantity: number) => Promise<void>;
  clearCart: () => Promise<void>;
  refreshCart: () => Promise<void>;
}

// Create the context
const CartContext = createContext<CartContextType | null>(null);

// Custom hook to use the cart context
export const useCart = (): CartContextType => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

// Cart provider component
export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [cartCount, setCartCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const { isAuthenticated } = useAuth();

  // Load cart items when the component mounts or authentication state changes
  useEffect(() => {
    if (isAuthenticated) {
      refreshCart();
    } else {
      setCartItems([]);
      setCartCount(0);
      setIsLoading(false);
    }
  }, [isAuthenticated]);

  // Refresh cart data
  const refreshCart = async (): Promise<void> => {
    try {
      setIsLoading(true);
      const items = await cartService.getCartItems();
      setCartItems(items);
      setCartCount(items.reduce((total, item) => total + item.quantity, 0));
    } catch (error) {
      console.error('Error refreshing cart:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Add item to cart
  const addToCart = async (product: Product, quantity: number = 1): Promise<void> => {
    try {
      setIsLoading(true);
      await cartService.addToCart(product, quantity);
      
      // Show success message
      Alert.alert(
        'Added to Cart',
        `${product.name} has been added to your cart.`,
        [
          {
            text: 'Continue Shopping',
            style: 'cancel',
          },
          {
            text: 'View Cart',
            onPress: () => {
              // Navigate to rent-later page since cart was removed
              router.push('/rent-later');
            },
          },
        ]
      );
      
      // Refresh cart to get updated items
      await refreshCart();
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to add item to cart');
    } finally {
      setIsLoading(false);
    }
  };

  // Remove item from cart
  const removeFromCart = async (itemId: string): Promise<void> => {
    try {
      setIsLoading(true);
      await cartService.removeFromCart(itemId);
      await refreshCart();
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to remove item from cart');
    } finally {
      setIsLoading(false);
    }
  };

  // Update item quantity
  const updateQuantity = async (itemId: string, quantity: number): Promise<void> => {
    try {
      setIsLoading(true);
      await cartService.updateCartItemQuantity(itemId, quantity);
      await refreshCart();
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to update item quantity');
    } finally {
      setIsLoading(false);
    }
  };

  // Clear cart
  const clearCart = async (): Promise<void> => {
    try {
      setIsLoading(true);
      await cartService.clearCart();
      setCartItems([]);
      setCartCount(0);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to clear cart');
    } finally {
      setIsLoading(false);
    }
  };

  // Context value
  const value: CartContextType = {
    cartItems,
    cartCount,
    isLoading,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    refreshCart,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}; 