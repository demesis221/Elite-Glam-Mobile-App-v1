import AsyncStorage from '@react-native-async-storage/async-storage';


import { Product } from './products.service';

// Flag to track if we've determined the cart API is unavailable


// Function to get current user ID
const getCurrentUserId = async (): Promise<string> => {
  const userData = await AsyncStorage.getItem('userData');
  if (!userData) {
    throw new Error('User not logged in');
  }
  const user = JSON.parse(userData);
  return user.uid || user._id;
};

// Function to check authentication
const checkAuth = async (): Promise<void> => {
  const token = await AsyncStorage.getItem('userToken');
  if (!token) {
    throw new Error('Authentication required');
  }
};

// Cart item interface
export interface CartItem {
  id: string;
  productId: string;
  userId: string;
  quantity: number;
  name: string;
  price: number;
  image?: string;
  addedAt: string;
  rentalPeriod?: {
    startDate: string;
    endDate: string;
  };
}

export const cartService = {
  // Add item to cart
  async addToCart(product: Product, quantity: number = 1, rentalPeriod?: { startDate: string; endDate: string }): Promise<CartItem> {
    try {
      const userId = await getCurrentUserId();

      const cartItem: CartItem = {
        id: `${Date.now()}`,
        productId: (product.id || product._id || '').toString(),
        userId,
        quantity,
        name: product.name,
        price: product.price,
        image: product.image,
        addedAt: new Date().toISOString(),
        rentalPeriod,
      };

      const cartItems = await this.getCartItems();
      const existingItemIndex = cartItems.findIndex(
        (item) => item.productId === cartItem.productId && JSON.stringify(item.rentalPeriod) === JSON.stringify(cartItem.rentalPeriod)
      );

      if (existingItemIndex > -1) {
        cartItems[existingItemIndex].quantity += quantity;
      } else {
        cartItems.push(cartItem);
      }

      await AsyncStorage.setItem('cartItems', JSON.stringify(cartItems));
      return cartItem;
    } catch (error) {
      console.error('Error adding to cart:', error);
      throw error;
    }
  },

  // Get all cart items
  async getCartItems(): Promise<CartItem[]> {
    try {
      const cartItemsJson = await AsyncStorage.getItem('cartItems');
      return cartItemsJson ? JSON.parse(cartItemsJson) : [];
    } catch (error) {
      console.error('Error getting cart items:', error);
      return [];
    }
  },

  // Remove item from cart
  async removeFromCart(itemId: string): Promise<void> {
    try {
      let cartItems = await this.getCartItems();
      cartItems = cartItems.filter((item) => item.id !== itemId);
      await AsyncStorage.setItem('cartItems', JSON.stringify(cartItems));
    } catch (error) {
      console.error('Error removing from cart:', error);
      throw error;
    }
  },

  // Update item quantity
  async updateCartItemQuantity(itemId: string, quantity: number): Promise<CartItem> {
    try {
      const cartItems = await this.getCartItems();
      const itemIndex = cartItems.findIndex((item) => item.id === itemId);

      if (itemIndex === -1) {
        throw new Error('Item not found in cart');
      }

      cartItems[itemIndex].quantity = quantity;
      await AsyncStorage.setItem('cartItems', JSON.stringify(cartItems));
      return cartItems[itemIndex];
    } catch (error) {
      console.error('Error updating cart item quantity:', error);
      throw error;
    }
  },

  // Clear cart
  async clearCart(): Promise<void> {
    try {
      await AsyncStorage.removeItem('cartItems');
    } catch (error) {
      console.error('Error clearing cart:', error);
      throw error;
    }
  },

  // Get cart count
  async getCartCount(): Promise<number> {
    try {
      const cartItems = await this.getCartItems();
      return cartItems.reduce((total, item) => total + item.quantity, 0);
    } catch (error) {
      console.error('Error getting cart count:', error);
      return 0;
    }
  },
}; 