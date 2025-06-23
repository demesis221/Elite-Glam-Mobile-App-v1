import { api } from '@/services/api';
import { MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Image, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Product, productsService } from '@/services/products.service';

const ITEMS_PER_PAGE = 8;
const CACHE_EXPIRY = 5 * 60 * 1000; // 5 minutes in milliseconds
const SEARCH_CACHE_KEY = (query: string, page: number) => `search_${query}_${page}_cache`;
const SEARCH_HISTORY_KEY = 'search_history';
const MAX_HISTORY_ITEMS = 7;

const categories = [
  { id: 'all', name: 'All' },
  { id: 'gown', name: 'Gown' },
  { id: 'dress', name: 'Dress' },
  { id: 'suit', name: 'Suit' },
  { id: 'sportswear', name: 'Sportswear' },
  { id: 'other', name: 'Other' }
] as const;

interface CacheData {
  data: any;
  timestamp: number;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 20,
  },
  errorText: {
    marginTop: 16,
    fontSize: 16,
    color: '#FF3B30',
    textAlign: 'center',
    fontWeight: '500',
  },
  retryButton: {
    marginTop: 16,
    paddingVertical: 12,
    paddingHorizontal: 24,
    backgroundColor: '#7E57C2',
    borderRadius: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  searchContainer: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    backgroundColor: '#fff',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 48,
    borderWidth: 1,
    borderColor: '#eee',
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    height: '100%',
  },
  clearButton: {
    padding: 4,
  },
  categorySection: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  categoryScroll: {
    flexDirection: 'row',
  },
  categoryButton: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#eee',
  },
  categoryButtonActive: {
    backgroundColor: '#7E57C2',
    borderColor: '#7E57C2',
  },
  categoryButtonText: {
    color: '#666',
    fontSize: 14,
  },
  categoryButtonTextActive: {
    color: '#fff',
  },
  resultsContainer: {
    flex: 1,
    padding: 16,
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
  },
  productsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
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
  imageContainer: {
    position: 'relative',
    width: '100%',
    height: 200,
  },
  productImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  outOfStockOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  outOfStockText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
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
    marginBottom: 4,
  },
  productCategory: {
    fontSize: 12,
    color: '#666',
  },
  loadingMoreContainer: {
    width: '100%',
    padding: 10,
    alignItems: 'center',
  },
  loadingMoreText: {
    marginTop: 8,
    fontSize: 14,
    color: '#666',
  },
  historyContainer: {
    padding: 16,
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  historyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  clearHistoryText: {
    color: '#6B3FA0',
    fontSize: 14,
  },
  historyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  historyItemText: {
    marginLeft: 12,
    fontSize: 16,
    color: '#333',
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  currencyText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },
  priceValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },
});

export default function SearchScreen() {
  const { initialQuery } = useLocalSearchParams<{ initialQuery?: string }>();
  const [searchQuery, setSearchQuery] = useState(initialQuery || '');
  const [results, setResults] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<typeof categories[number]['id']>('all');
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    loadSearchHistory();
    if (initialQuery) {
      handleSearch(initialQuery);
    }
  }, [initialQuery]);

  // Cache management functions
  const loadFromCache = async (key: string): Promise<any | null> => {
    try {
      const cached = await AsyncStorage.getItem(key);
      if (cached) {
        const { data, timestamp } = JSON.parse(cached) as CacheData;
        const isExpired = Date.now() - timestamp > CACHE_EXPIRY;
        if (!isExpired) {
          return data;
        }
      }
      return null;
    } catch (error) {
      console.error('Error loading from cache:', error);
      return null;
    }
  };

  const saveToCache = async (key: string, data: any) => {
    try {
      const cacheData: CacheData = {
        data,
        timestamp: Date.now(),
      };
      await AsyncStorage.setItem(key, JSON.stringify(cacheData));
    } catch (error) {
      console.error('Error saving to cache:', error);
    }
  };

  const loadSearchHistory = async () => {
    try {
      const history = await AsyncStorage.getItem(SEARCH_HISTORY_KEY);
      if (history) {
        setSearchHistory(JSON.parse(history));
      }
    } catch (error) {
      console.error('Error loading search history:', error);
    }
  };

  const saveSearchHistory = async (query: string) => {
    if (!query.trim()) return;
    
    try {
      let history = [...searchHistory];
      
      // Remove if already exists (to move it to the top)
      history = history.filter(item => item !== query);
      
      // Add to the beginning of the array
      history.unshift(query);
      
      // Limit number of items
      if (history.length > MAX_HISTORY_ITEMS) {
        history = history.slice(0, MAX_HISTORY_ITEMS);
      }
      
      setSearchHistory(history);
      await AsyncStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(history));
    } catch (error) {
      console.error('Error saving search history:', error);
    }
  };

  const clearSearchHistory = async () => {
    try {
      setSearchHistory([]);
      await AsyncStorage.removeItem(SEARCH_HISTORY_KEY);
    } catch (error) {
      console.error('Error clearing search history:', error);
    }
  };

  const fetchProducts = async (pageNumber = 1, reset = false) => {
    try {
      setErrorMessage(null);
      const cacheKey = SEARCH_CACHE_KEY(searchQuery, pageNumber);
      
      // Try to load from cache first (only for first page)
      if (pageNumber === 1 && !reset) {
        const cachedData = await loadFromCache(cacheKey);
        if (cachedData) {
          setResults(cachedData);
          return;
        }
      }
      
      if (pageNumber === 1) {
        setIsLoading(true);
      } else {
        setLoadingMore(true);
      }
      
      let productData: Product[] = [];
      
      if (searchQuery.trim()) {
        // Use search endpoint
        const response = await api.get('/products/search', {
          params: { query: searchQuery }
        });
        productData = response.data;
        
        if (selectedCategory !== 'all') {
          // Filter by category client-side
          productData = productData.filter((product) => 
            product.category.toLowerCase() === selectedCategory.toLowerCase()
          );
        }
      } else {
        // Use category filtering
        const categoryParam = selectedCategory !== 'all' ? selectedCategory : undefined;
        productData = await productsService.getProductsByPage(pageNumber, ITEMS_PER_PAGE, categoryParam);
      }
      
      // Save to cache (only first page)
      if (pageNumber === 1) {
        saveToCache(cacheKey, productData);
        
        // Save to search history if it's a search query
        if (searchQuery.trim()) {
          saveSearchHistory(searchQuery);
        }
      }
      
      // Update results
      if (pageNumber === 1 || reset) {
        setResults(productData);
      } else {
        setResults(prev => [...prev, ...productData]);
      }
      
      setHasMore(productData.length === ITEMS_PER_PAGE);
    } catch (error: any) {
      console.error('Error fetching products:', error);
      setErrorMessage(error.message || 'Failed to fetch products');
    } finally {
      setIsLoading(false);
      setLoadingMore(false);
    }
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setPage(1);
    setResults([]);
    fetchProducts(1, true);
  };

  const loadMore = () => {
    if (loadingMore || !hasMore) return;
    
    const nextPage = page + 1;
    setPage(nextPage);
    fetchProducts(nextPage);
  };

  const handleProductPress = (product: any) => {
    const productId = product.id || product._id;
    console.log('Navigating to product details with ID:', productId);
    
    if (!productId) {
      console.error('Cannot navigate: Product has no ID', product);
      Alert.alert('Error', 'Could not open product details. Please try again.');
      return;
    }
    
    router.push({ pathname: '/(renter)/product-details/[id]', params: { id: productId.toString() } });
  };

  const filteredProducts = results.filter(product => 
    selectedCategory === 'all' || product.category.toLowerCase() === selectedCategory.toLowerCase()
  );

  const renderSearchHistory = () => (
    <View style={styles.historyContainer}>
      <View style={styles.historyHeader}>
        <Text style={styles.historyTitle}>Recent Searches</Text>
        {searchHistory.length > 0 && (
          <TouchableOpacity onPress={clearSearchHistory}>
            <Text style={styles.clearHistoryText}>Clear All</Text>
          </TouchableOpacity>
        )}
      </View>
      {searchHistory.map((item, index) => (
        <TouchableOpacity
          key={index}
          style={styles.historyItem}
          onPress={() => handleSearch(item)}
        >
          <Text>
            <MaterialIcons name="history" size={20} color="#666" />
          </Text>
          <Text style={styles.historyItemText}>{item}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#7E57C2" />
        <Text style={styles.loadingText}>Loading products...</Text>
      </View>
    );
  }

  if (errorMessage) {
    return (
      <View style={styles.errorContainer}>
        <MaterialIcons name="error-outline" size={48} color="#FF3B30" />
        <Text style={styles.errorText}>{errorMessage}</Text>
        <TouchableOpacity 
          style={styles.retryButton}
          onPress={() => fetchProducts(1, true)}
        >
          <Text style={styles.retryButtonText}>Try Again</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <MaterialIcons name="search" size={24} color="#666" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search products..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={() => handleSearch(searchQuery)}
            returnKeyType="search"
            autoFocus={!!initialQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity style={styles.clearButton} onPress={() => setSearchQuery('')}>
              <MaterialIcons name="close" size={20} color="#666" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Categories */}
      <View style={styles.categorySection}>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          style={styles.categoryScroll}
        >
          {categories.map((category) => (
            <TouchableOpacity
              key={category.id}
              style={[
                styles.categoryButton,
                selectedCategory === category.id && styles.categoryButtonActive
              ]}
              onPress={() => setSelectedCategory(category.id)}
            >
              <Text style={[
                styles.categoryButtonText,
                selectedCategory === category.id && styles.categoryButtonTextActive
              ]}>
                {category.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Search Results or History */}
      <ScrollView 
        style={styles.resultsContainer}
        onScroll={({ nativeEvent }) => {
          const { layoutMeasurement, contentOffset, contentSize } = nativeEvent;
          const paddingToBottom = 20;
          const isCloseToBottom = layoutMeasurement.height + contentOffset.y >= 
              contentSize.height - paddingToBottom;
          
          if (isCloseToBottom && !searchQuery.length) {
            loadMore();
          }
        }}
        scrollEventThrottle={16}
      >
        {searchQuery.length === 0 ? (
          renderSearchHistory()
        ) : filteredProducts.length === 0 ? (
          <View style={styles.emptyStateContainer}>
            <MaterialIcons name="search-off" size={64} color="#ccc" />
            <Text style={styles.emptyStateText}>No products found</Text>
          </View>
        ) : (
          <View style={styles.productsGrid}>
            {filteredProducts.map((product) => (
              <TouchableOpacity 
                key={product.id} 
                style={styles.productCard}
                onPress={() => handleProductPress(product)}
              >
                <View style={styles.imageContainer}>
                  <Image 
                    source={
                      product.imageSource 
                        ? product.imageSource
                        : { uri: product.image || 'https://via.placeholder.com/150' }
                    } 
                    style={styles.productImage}
                    onError={() => {
                      console.log('Image failed to load:', product.image);
                    }}
                  />
                  {!product.available && (
                    <View style={styles.outOfStockOverlay}>
                      <Text style={styles.outOfStockText}>Out of Stock</Text>
                    </View>
                  )}
                </View>
                <View style={styles.productInfo}>
                  <Text style={styles.productName} numberOfLines={2}>
                    {product.name}
                  </Text>
                  {product.rating && product.rating > 0 && (
                    <View style={styles.ratingContainer}>
                      <Text>
                        <MaterialIcons name="star" size={16} color="#FFD700" />
                      </Text>
                      <Text style={styles.ratingText}>{product.rating.toFixed(1)}</Text>
                    </View>
                  )}
                  <View style={styles.priceContainer}>
                    <Text style={styles.currencyText}>PHP </Text>
                    <Text style={styles.priceValue}>{product.price.toLocaleString()}</Text>
                  </View>
                  <Text style={styles.productCategory}>{product.category}</Text>
                </View>
              </TouchableOpacity>
            ))}
            {loadingMore && (
              <View style={styles.loadingMoreContainer}>
                <ActivityIndicator size="small" color="#6B3FA0" />
                <Text style={styles.loadingMoreText}>Loading more...</Text>
              </View>
            )}
          </View>
        )}
      </ScrollView>
    </View>
  );
} 