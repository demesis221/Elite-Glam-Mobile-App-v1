import { MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router, useFocusEffect } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { Alert, Image, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Product } from '@/services/products.service';

const defaultProductImage = require('@/assets/images/dressProduct.png');

export default function RentLaterScreen() {
  const [cartProducts, setCartProducts] = useState<Product[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const loadCartItems = async () => {
    try {
      console.log('Loading cart items...'); // Debug log
      const cartItems = await AsyncStorage.getItem('cartItems');
      console.log('Cart items from storage:', cartItems); // Debug log
      const items = cartItems ? JSON.parse(cartItems) : [];
      setCartProducts(items);
    } catch (error) {
      console.error('Error loading cart items:', error);
    }
  };

  // Use useFocusEffect instead of useEffect to reload items when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      console.log('Cart screen focused'); // Debug log
      loadCartItems();
    }, [])
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadCartItems().finally(() => setRefreshing(false));
  }, []);

  const removeFromCart = async (productId: string) => {
    try {
      const cartItems = await AsyncStorage.getItem('cartItems');
      let items = cartItems ? JSON.parse(cartItems) : [];
      items = items.filter((item: Product) => item.id !== productId);
      await AsyncStorage.setItem('cartItems', JSON.stringify(items));
      setCartProducts(items);
    } catch (error) {
      console.error('Error removing item from cart:', error);
    }
  };

  return (
    <View style={styles.container}>
      {/* Cart Items List */}
      <ScrollView 
        style={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={["#7E57C2"]}
          />
        }
      >
        {cartProducts.length === 0 ? (
          <View style={styles.emptyStateContainer}>
            <MaterialIcons name="watch-later" size={64} color="#ccc" />
            <Text style={styles.emptyStateText}>No items in cart</Text>
            <TouchableOpacity 
              style={styles.browseButton}
              onPress={() => router.push('/')}
            >
              <Text style={styles.browseButtonText}>Browse Products</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.productsGrid}>
            {cartProducts.map((product) => (
              <TouchableOpacity 
                key={product.id} 
                style={styles.productCard}
                onPress={() => {
                  if (!product.id) {
                    console.error('Cannot navigate: Product has no ID', product);
                    Alert.alert('Error', 'Could not open product details. Please try again.');
                    return;
                  }
                  router.push({ pathname: '/(renter)/product-details/[id]', params: { id: product.id } });
                }}
              >
                <Image 
                  source={product.image ? { uri: product.image } : defaultProductImage} 
                  style={styles.productImage} 
                />
                <TouchableOpacity 
                  style={styles.rentLaterButton}
                  onPress={() => {
                    if (product.id) {
                      removeFromCart(product.id);
                    }
                  }}
                >
                  <MaterialIcons name="remove-shopping-cart" size={24} color="#ff4444" />
                </TouchableOpacity>
                <View style={styles.productInfo}>
                  <Text style={styles.productName} numberOfLines={2}>
                    {product.name}
                  </Text>
                  <View style={styles.ratingContainer}>
                    <MaterialIcons name="star" size={16} color="#FFD700" />
                    <Text style={styles.ratingText}>{product.rating || '0'}</Text>
                  </View>
                  <Text style={styles.productPrice}>PHP {product.price?.toLocaleString()}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    flex: 1,
  },
  emptyStateContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 64,
  },
  emptyStateText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
    marginBottom: 24,
  },
  browseButton: {
    backgroundColor: '#7E57C2',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
  },
  browseButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
  productsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    padding: 16,
  },
  productCard: {
    width: '48%',
    marginBottom: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  productImage: {
    width: '100%',
    height: 200,
    resizeMode: 'cover',
  },
  rentLaterButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  productInfo: {
    padding: 12,
  },
  productName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    marginBottom: 4,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  ratingText: {
    marginLeft: 4,
    fontSize: 12,
    color: '#666',
  },
  productPrice: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },
}); 