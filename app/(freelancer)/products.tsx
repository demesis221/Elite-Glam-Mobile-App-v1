import { Product, productsService } from '@/services/products.service';
import { MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Image, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

// Helper function to get a consistent product ID
const getProductId = (product: Product): string | undefined => product.id?.toString() || product._id?.toString();

import { ScrollView } from 'react-native';

export default function ManageProductsScreen() {
  // CATEGORY FILTER STATE
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  // Only fetch all products ONCE, do not re-fetch by category.

  const [products, setProducts] = useState<Product[]>([]);
  // Ensure 'All' is always the default selected category when products change
  React.useEffect(() => {
    setSelectedCategory('All');
  }, [products]);

  // Extract unique categories from products
  // Build a unique, case-insensitive, display-friendly category list
  const categories = React.useMemo(() => {
    // Remove empty, dedupe (case-insensitive), and ignore any 'All' (any case)
    const seen = new Set<string>();
    const unique: string[] = [];
    products.forEach(p => {
      const raw = p.category?.trim();
      if (raw && raw.toLowerCase() !== 'all') {
        const lower = raw.toLowerCase();
        if (!seen.has(lower)) {
          seen.add(lower);
          unique.push(raw.charAt(0).toUpperCase() + raw.slice(1)); // Capitalize
        }
      }
    });
    unique.sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }));
    return ['All', ...unique];
  }, [products]);

  // Ref for horizontal scroll to always show 'All' first
  const categoryScrollRef = React.useRef<ScrollView>(null);
  React.useEffect(() => {
    categoryScrollRef.current?.scrollTo({ x: 0, animated: true });
  }, [categories]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAuthError, setIsAuthError] = useState(false); // For conditional UI
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [user, setUser] = useState<any>(null); // Store authenticated user for global access
  const ITEMS_PER_PAGE = 4;

  const checkUserAndFetchProducts = useCallback(async (pageNumber: number = 1, shouldRefresh: boolean = false) => {
    if (shouldRefresh) {
      setIsLoading(true);
      setPage(1);
      setHasMore(true);
    } else {
      setIsLoadingMore(true);
    }
    setError(null);
    setIsAuthError(false); // Reset auth error state on each attempt

    try {
      const storedUser = await AsyncStorage.getItem('userData');
      if (!storedUser) {
        throw new Error('Authentication required');
      }

      const loadedUser = JSON.parse(storedUser);
      if (!loadedUser || !loadedUser.id) {
        throw new Error('Authentication required');
      }
      setUser(loadedUser); // Store user in state for global access

      // Log user id for debugging
      console.log('[ProductScreen] Loaded user id:', loadedUser.id);

      // Fetch products for this user
      const fetchedProducts = await productsService.getMyProducts(loadedUser.id);
      // Log fetched product ownership for debugging
      if (Array.isArray(fetchedProducts)) {
        fetchedProducts.forEach((p, i) => {
          console.log(`[ProductScreen] Product #${i} id:`, p.id || p._id, 'userId:', p.userId);
        });
      }
      
      if (Array.isArray(fetchedProducts)) {
        // Ensure every product has a stable, unique key for FlatList rendering.
        // This prevents crashes when items without a backend-provided ID are present.
        const productsWithStableKeys = fetchedProducts.map((p, index) => {
          if (!p.id && !p._id) {
            // Assign a temporary but unique ID for this session.
            return { ...p, _id: `temp-id-${Date.now()}-${index}` };
          }
          return p;
        });

        if (productsWithStableKeys.length < ITEMS_PER_PAGE) {
          setHasMore(false);
        }

        setProducts(prevProducts => {
          if (shouldRefresh) {
            return productsWithStableKeys;
          }

          // Use a Map to safely merge products, ensuring every item has a key.
          // This prevents crashes by cleaning up any existing items that might be missing an ID.
          const productMap = new Map();

          // First, process existing products, assigning a key if missing.
          prevProducts.forEach((p, index) => {
            let key = getProductId(p);
            if (!key) {
              key = `temp-key-prev-${Date.now()}-${index}`;
              productMap.set(key, { ...p, _id: key }); // Add the key to the object itself
            } else {
              productMap.set(key, p);
            }
          });

          // Then, add the new products, which are already guaranteed to have keys.
          productsWithStableKeys.forEach(p => {
            productMap.set(getProductId(p)!, p);
          });

          return Array.from(productMap.values());
        });

        setPage(shouldRefresh ? 1 : prevPage => prevPage + 1);
      } else {
        throw new Error('Invalid products data received');
      }
    } catch (err: any) {
      console.error('Error in fetchProducts:', err);
      if (err.message === 'Authentication required' || err.response?.status === 401) {
        setError('Please login to view your products.');
        setIsAuthError(true);
      } else {
        setError('Failed to load products. Please try again.');
        setIsAuthError(false);
      }
      setProducts([]);
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  }, []);

  useEffect(() => {
    checkUserAndFetchProducts(1, true);
  }, [checkUserAndFetchProducts]);

  const handleRefresh = useCallback(() => {
    checkUserAndFetchProducts(1, true);
  }, [checkUserAndFetchProducts]);

  const loadMore = useCallback(() => {
    if (!isLoadingMore && hasMore && !isLoading) {
      checkUserAndFetchProducts(page + 1);
    }
  }, [isLoadingMore, hasMore, isLoading, page, checkUserAndFetchProducts]);

  // Extract unique categories from products
  // Build a unique, case-insensitive, display-friendly category list
  
  // Defensive client-side filter: only show products owned by this user, search, and category
  const filteredProducts = products.filter(product => {
    const matchesOwner = user && product.userId === user.id;
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) || product.category.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory =
      selectedCategory === 'All' ||
      (product.category && product.category.trim().toLowerCase() === selectedCategory.trim().toLowerCase());
    return matchesOwner && matchesSearch && matchesCategory;
  });

  // Edit handler for product cards
  const [editLoadingId, setEditLoadingId] = useState<string | null>(null); // Track loading state for edit

  // Handler for editing a product
  const handleEditProduct = (product: Product, index?: number) => {
    try {
      const id = getProductId(product);
      if (!id) {
        Alert.alert('Error', 'This product cannot be edited because it is missing a valid ID.');
        return;
      }
      // Expo Router does not have isReady, so we skip that check
      setEditLoadingId(id); // Optionally show a loading indicator for this product
      // Log navigation action
      console.log('[handleEditProduct] Navigating to edit product', { id, product });
      router.push({
        pathname: './post-product',
        params: {
          id,
          name: product.name ?? '',
          description: product.description ?? '',
          price: String(product.price ?? ''),
          image: product.image ?? '',
          category: product.category ?? '',
          quantity: String(product.quantity ?? ''),
          condition: product.condition ?? '',
          sellerMessage: product.sellerMessage ?? '',
          rentAvailable: product.rentAvailable?.toString() ?? 'false',
        }
      });
      // Optionally reset loading state after navigation
      setTimeout(() => setEditLoadingId(null), 1500);
    } catch (err) {
      console.error('[handleEditProduct] Error:', err, product, index);
      Alert.alert('Error', 'An error occurred while editing this product.');
      setEditLoadingId(null);
    }
  };


  const handleDeleteProduct = (productId: string) => {
    Alert.alert(
      'Delete Product',
      'Are you sure you want to delete this product? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            // Keep a copy of the original products list to allow for reverting the change if the API call fails.
            const originalProducts = [...products];

            // Optimistically update the UI for a more responsive user experience.
            setProducts(prevProducts =>
              prevProducts.filter(p => getProductId(p) !== productId)
            );

            try {
              // Attempt to delete the product from the backend.
              await productsService.deleteProduct(productId);
              Alert.alert('Success', 'Product has been successfully deleted.');
            } catch (error) {
              // If the API call fails, revert the UI to its original state and notify the user.
              console.error('Error deleting product:', error);
              Alert.alert(
                'Error',
                'Failed to delete the product. Please try again.'
              );
              setProducts(originalProducts);
            }
          },
        },
      ]
    );
  };

  // Render each product card, including Edit and Delete buttons
  const renderProductItem = ({ item, index }: { item: Product; index: number }) => {
    const productId = getProductId(item);
    const isEditing = editLoadingId === productId;
    return (
      <View style={styles.productCard}>
        <TouchableOpacity 
          onPress={() => {
            if (productId) {
              router.push({ pathname: './product-details', params: { id: productId } });
            } else {
              Alert.alert('Error', 'Could not open product details. Product is missing an ID.');
            }
          }}
        >
          <Image 
            source={{ uri: item.image || 'https://via.placeholder.com/150' }} 
            style={styles.productImage}
          />
          <View style={styles.productInfo}>
            <Text style={styles.productName}>{item.name}</Text>
            <Text style={styles.productPrice}>₱{item.price}</Text>
            <View style={styles.productMeta}>
              <Text style={styles.stockText}>Stock: {item.quantity}</Text>
              <Text style={[styles.statusText, { color: item.rentAvailable ? '#4CAF50' : '#D32F2F' }]}>
                {item.rentAvailable ? 'Available' : 'Not for Rent'}
              </Text>
            </View>
          </View>
        </TouchableOpacity>
        <View style={styles.actionButtons}>
          <TouchableOpacity 
            style={[styles.editButton, isEditing && { opacity: 0.7 }]}
            onPress={() => handleEditProduct(item, index)}
            disabled={isEditing}
          >
            {isEditing ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <MaterialIcons name="edit" size={16} color="#fff" />
            )}
            <Text style={styles.actionButtonText}>{isEditing ? 'Editing...' : 'Edit'}</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.deleteButton}
            onPress={() => {
              if (productId) {
                handleDeleteProduct(productId);
              } else {
                Alert.alert('Error', 'Cannot delete a product without a valid ID.');
              }
            }}
          >
            <MaterialIcons name="delete" size={16} color="#fff" />
            <Text style={styles.actionButtonText}>Delete</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <MaterialIcons name="hourglass-empty" size={48} color="#6B3FA0" />
        <Text style={styles.loadingText}>Loading products...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <MaterialIcons name="error-outline" size={48} color="#FF3B30" />
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity 
          style={styles.retryButton}
          onPress={() => checkUserAndFetchProducts(1, true)}
        >
          <Text style={styles.retryButtonText}>Try Again</Text>
        </TouchableOpacity>
        {isAuthError && (
          <TouchableOpacity 
            style={styles.loginButton}
            onPress={() => router.push('/(auth)/login')}
          >
            <Text style={styles.loginButtonText}>Go to Login</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  }

  if (products.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <MaterialIcons name="inventory" size={48} color="#6B3FA0" />
        <Text style={styles.emptyText}>No products found</Text>
        <TouchableOpacity 
          style={styles.addButton}
          onPress={() => router.push('./post-product')}
        >
          <Text style={styles.actionButtonText}>Add New Product</Text>
        </TouchableOpacity>
      </View>
    );
  }

  console.log('Categories at render:', categories);
  return (
    <View style={styles.container}>
      {/* CATEGORY FILTER BUTTONS */}
      <ScrollView
        ref={categoryScrollRef}
        horizontal
        onContentSizeChange={() => categoryScrollRef.current?.scrollTo({ x: 0, animated: false })}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{
          alignItems: 'center',
          justifyContent: 'center',
        }}
        style={styles.categoryFilterContainer}
      >
        {/* Always render 'All' first */}
        <TouchableOpacity
          key="All"
          style={[styles.categoryButton, selectedCategory === 'All' && styles.categoryButtonSelected]}
          onPress={() => setSelectedCategory('All')}
        >
          <Text style={[styles.categoryButtonText, selectedCategory === 'All' && styles.categoryButtonTextSelected]}>
            All
          </Text>
        </TouchableOpacity>
        {/* Then render the rest, excluding 'All' */}
        {categories
          .filter(category => category !== 'All')
          .sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }))
          .map(category => (
            <TouchableOpacity
              key={category}
              style={[styles.categoryButton, selectedCategory === category && styles.categoryButtonSelected]}
              onPress={() => setSelectedCategory(category)}
            >
              <Text style={[styles.categoryButtonText, selectedCategory === category && styles.categoryButtonTextSelected]}>
                {category}
              </Text>
            </TouchableOpacity>
          ))}
      </ScrollView>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <MaterialIcons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Manage Products</Text>
        <TouchableOpacity style={styles.addButton} onPress={() => router.push('./post-product')}>
          <MaterialIcons name="add" size={24} color="#fff" />
        </TouchableOpacity>
      </View>
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <MaterialIcons name="search" size={24} color="#666" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search products..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor="#666"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity style={styles.clearButton} onPress={() => setSearchQuery('')}>
              <MaterialIcons name="close" size={20} color="#666" />
            </TouchableOpacity>
          )}
        </View>
      </View>
      <FlatList
        data={filteredProducts}
        renderItem={renderProductItem}
        keyExtractor={(item) => getProductId(item)!}
        contentContainerStyle={styles.productsList}
        numColumns={2}
        showsVerticalScrollIndicator={false}
        onEndReached={loadMore}
        onEndReachedThreshold={0.5}
        onRefresh={handleRefresh}
        refreshing={isLoading && page === 1}
        ListFooterComponent={() => (
          isLoadingMore ? (
            <View style={styles.loadingMoreContainer}>
              <ActivityIndicator size="small" color="#6B3FA0" />
              <Text style={styles.loadingMoreText}>Loading more products...</Text>
            </View>
          ) : null
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  categoryFilterContainer: {
    flexDirection: 'row',
    marginVertical: 10,
    flexWrap: 'wrap',
  },
  categoryButton: {
    backgroundColor: '#eee',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 6,
    marginHorizontal: 4,
    marginVertical: 4,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  categoryButtonSelected: {
    backgroundColor: '#6B3FA0',
    borderColor: '#6B3FA0',
  },
  categoryButtonText: {
    color: '#333',
    fontWeight: '500',
  },
  categoryButtonTextSelected: {
    color: '#fff',
    fontWeight: '700',
  },
  container: { flex: 1, backgroundColor: '#f7f7f7' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' },
  loadingText: { marginTop: 16, fontSize: 16, color: '#666' },
  errorContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20, backgroundColor: '#fff' },
  errorText: { fontSize: 18, color: '#D32F2F', textAlign: 'center', marginBottom: 20 },
  retryButton: { backgroundColor: '#6B3FA0', paddingVertical: 12, paddingHorizontal: 30, borderRadius: 25, marginBottom: 15 },
  retryButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  loginButton: { borderColor: '#6B3FA0', borderWidth: 1, paddingVertical: 12, paddingHorizontal: 30, borderRadius: 25 },
  loginButtonText: { color: '#6B3FA0', fontSize: 16, fontWeight: 'bold' },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  emptyText: { fontSize: 18, color: '#666', marginBottom: 20 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 15, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#eee', backgroundColor: '#fff' },
  backButton: { padding: 5 },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#4A4A6A' },
  addButton: { backgroundColor: '#6B3FA0', padding: 8, borderRadius: 20 },
  searchContainer: { padding: 15, borderBottomWidth: 1, borderBottomColor: '#eee', backgroundColor: '#fff' },
  searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f0f0f0', borderRadius: 25, paddingHorizontal: 15 },
  searchIcon: { marginRight: 10 },
  searchInput: { flex: 1, height: 40, fontSize: 16, color: '#4A4A6A' },
  clearButton: { padding: 5 },
  productsList: { paddingHorizontal: 10, paddingTop: 10 },
  productCard: { flex: 1, margin: 5, backgroundColor: '#fff', borderRadius: 10, shadowColor: '#B0B0B0', shadowOpacity: 0.2, shadowRadius: 5, elevation: 3, overflow: 'hidden' },
  productImage: { width: '100%', height: 150 },
  productInfo: { padding: 10 },
  productName: { fontSize: 16, fontWeight: 'bold', marginBottom: 5, color: '#4A4A6A' },
  productPrice: { fontSize: 14, color: '#6B3FA0', marginBottom: 5 },
  productMeta: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  stockText: { fontSize: 12, color: '#666' },
  statusText: { fontSize: 12, fontWeight: 'bold' },
  actionButtons: { flexDirection: 'row', borderTopWidth: 1, borderTopColor: '#eee' },
  editButton: { flex: 1, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', padding: 10, backgroundColor: '#5C6BC0' },
  deleteButton: { flex: 1, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', padding: 10, backgroundColor: '#EF5350' },
  actionButtonText: { color: '#fff', marginLeft: 5, fontWeight: 'bold' },
  loadingMoreContainer: { paddingVertical: 20, alignItems: 'center' },
  loadingMoreText: { marginTop: 10, color: '#666' }
});