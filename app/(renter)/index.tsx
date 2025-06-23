import { MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { Alert, Image, RefreshControl, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View, ActivityIndicator } from 'react-native';
import FilterModal from '../../components/FilterModal';
import LoadingScreen from '../../components/LoadingScreen';
import { useAuth } from '../../contexts/AuthContext';
import { productsService, Product } from '../../services/products.service';
import { bookingService } from '../../services/booking.service';
import { cartService } from '../../services/cart.service';

const ITEMS_PER_PAGE = 8; // Number of items to load per page
const CACHE_EXPIRY = 5 * 60 * 1000; // 5 minutes in milliseconds
const CACHE_KEY = 'home_products_cache';

const categories = [
  { id: 'all', name: 'All' },
  { id: 'dress', name: 'Dresses' },
  { id: 'gown', name: 'Gowns' },
  { id: 'other', name: 'Other' },
  { id: 'sportswear', name: 'Sportswear' },
  { id: 'suit', name: 'Suits' },
] as const;

const defaultProductImage = require('../../assets/images/logo.png');

interface CacheData {
  products: Product[];
  timestamp: number;
  category: string;
}

interface ProductWithRating extends Product {
  averageRating: number;
  reviewCount: number;
  hasMakeupService: boolean;
  makeupPrice?: number;
  makeupDescription?: string;
}

export default function HomeScreen() {
  const { user } = useAuth();
  const [selectedCategory, setSelectedCategory] = useState<typeof categories[number]['id']>('all');
  const [products, setProducts] = useState<ProductWithRating[]>([]);
  const [userStats, setUserStats] = useState([
    { label: 'Active Rentals', value: 0 },
    { label: 'Upcoming Bookings', value: 0 },
    { label: 'Saved Items', value: 0 },
  ]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [showSearchInput, setShowSearchInput] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isBannerExpanded, setIsBannerExpanded] = useState(true);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [selectedSizes, setSelectedSizes] = useState<string[]>([]);
  const recentBookings: any[] = [];

  const fetchDashboardData = useCallback(async () => {
    setIsLoading(true);
    try {
      // Fetch booking stats
      const activeBookings = await bookingService.getMyBookings(1, 100, 'confirmed');
      const upcomingBookings = await bookingService.getMyBookings(1, 100, 'pending');
      const savedItemsCount = await cartService.getCartCount();

      setUserStats([
        { label: 'Active Rentals', value: activeBookings.length },
        { label: 'Upcoming Bookings', value: upcomingBookings.length },
        { label: 'Saved Items', value: savedItemsCount },
      ]);

    } catch (err) {
      setError('Failed to load dashboard data.');
      console.error(err);
    } finally {
      // This will be set to false in fetchProducts
    }
  }, []);

  const loadProducts = useCallback(async (refresh = false) => {
    if (refresh) {
      setPage(1);
      setHasMore(true);
    }
    
    try {
      setIsLoading(true);
      let productsData: any[] = [];
      
      if (searchQuery.trim()) {
        productsData = await productsService.searchProducts(searchQuery.trim());
      } else {
        const categoryParam = selectedCategory !== 'all' ? undefined /* fetch unfiltered */ : undefined;
        productsData = await productsService.getProductsByPage(page, ITEMS_PER_PAGE, categoryParam);
        // Client-side category filtering (case-insensitive) to account for backend case mismatch
        if (selectedCategory !== 'all') {
          productsData = productsData.filter(p => p.category?.toLowerCase() === selectedCategory);
        }
      }
      
      let filteredProducts = productsData;
      if (selectedSizes.length > 0) {
        filteredProducts = filteredProducts.filter((product) => {
          if (!product.size) return false;
          const productSizes = Array.isArray(product.size) ? product.size : [product.size];
          return productSizes.some((size: string) => selectedSizes.includes(size));
        });
      }

      const productsWithRatings = filteredProducts.map(p => ({
  ...p,
  averageRating: p.averageRating || 0,
  hasMakeupService: p.hasMakeupService || false,
  makeupPrice: p.makeupPrice || 0,
  makeupDescription: p.makeupDescription || '',
  makeupDuration: p.makeupDuration || 0,
}));

      if (refresh) {
        setProducts(productsWithRatings);
      } else {
        setProducts(prev => [...prev, ...productsWithRatings]);
      }
      
      if (productsData.length < ITEMS_PER_PAGE) {
        setHasMore(false);
      }

      const cacheData: CacheData = { products: productsData, timestamp: Date.now(), category: selectedCategory };
      await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(cacheData));

    } catch (e) {
      setError('Failed to load products.');
      console.error(e);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
      setIsLoadingMore(false);
    }
  }, [page, selectedCategory, searchQuery, selectedSizes]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  useEffect(() => {
    loadProducts(true);
  }, [selectedCategory, searchQuery, selectedSizes]);

  const onRefresh = () => {
    setIsRefreshing(true);
    loadProducts(true);
  };

  const handleCategoryChange = (category: typeof categories[number]['id']) => {
    setSelectedCategory(category);
    setPage(1);
    setProducts([]);
    setHasMore(true);
  };

  const toggleBanner = () => setIsBannerExpanded(!isBannerExpanded);

  const handleApplyFilters = (sizes: string[]) => {
    setSelectedSizes(sizes);
    setShowFilterModal(false);
    setPage(1);
    setProducts([]);
    setHasMore(true);
  };

  const renderDashboard = () => (
    <View style={styles.dashboardContainer}>
      {/* Centered Profile Section */}
      <View style={styles.profileSectionModern}>
        <TouchableOpacity onPress={() => router.push('/(renter)/profile')}>
          <Image source={{ uri: user?.profileImage || 'https://i.pravatar.cc/150?img=3' }} style={styles.profilePicModern} />
        </TouchableOpacity>
        <Text style={styles.welcomeTextModern}>Welcome back,</Text>
        <Text style={styles.userNameModern}>{user?.name || user?.email || 'Guest'}</Text>
      </View>
      {/* Modern Stats Card */}
      <View style={styles.statsCardModern}>
        <View style={styles.statsRowModern}>
          <View style={styles.statBlockModern}>
            <MaterialIcons name="autorenew" size={26} color="#7E57C2" style={{ marginBottom: 4 }} />
            <Text style={styles.statValueModern}>{userStats[0]?.value}</Text>
            <Text style={styles.statLabelModern}>Active Rentals</Text>
          </View>
          <View style={styles.verticalDivider} />
          <View style={styles.statBlockModern}>
            <MaterialIcons name="event-available" size={26} color="#42A5F5" style={{ marginBottom: 4 }} />
            <Text style={styles.statValueModern}>{userStats[1]?.value}</Text>
            <Text style={styles.statLabelModern}>Upcoming</Text>
          </View>
          <View style={styles.verticalDivider} />
          <View style={styles.statBlockModern}>
            <MaterialIcons name="favorite-border" size={26} color="#FF9800" style={{ marginBottom: 4 }} />
            <Text style={styles.statValueModern}>{userStats[2]?.value}</Text>
            <Text style={styles.statLabelModern}>Saved Items</Text>
          </View>
        </View>
      </View>
      {/* Quick Actions */}
      <View style={styles.quickActionsContainer}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.quickActionGrid}>
          <TouchableOpacity style={styles.quickActionButton} onPress={() => router.push('/(renter)/search')}>
            <View style={[styles.quickActionIcon, { backgroundColor: '#E3F2FD' }]}><MaterialIcons name="search" size={24} color="#2196F3" /></View>
            <Text style={styles.quickActionText}>Find an Item</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.quickActionButton} onPress={() => router.push('/(renter)/bookings')}>
            <View style={[styles.quickActionIcon, { backgroundColor: '#E8F5E9' }]}><MaterialIcons name="event-note" size={24} color="#4CAF50" /></View>
            <Text style={styles.quickActionText}>My Bookings</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.quickActionButton} onPress={() => router.push('/(renter)/rent-later')}>
            <View style={[styles.quickActionIcon, { backgroundColor: '#FFF3E0' }]}> 
              <MaterialIcons name="shopping-cart" size={24} color="#FF9800" />
            </View>
            <Text style={styles.quickActionText}>Saved Items</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.quickActionButton} onPress={() => router.push('/(renter)/profile')}>
            <View style={[styles.quickActionIcon, { backgroundColor: '#F3E5F5' }]}> 
              <MaterialIcons name="person-outline" size={24} color="#9C27B0" />
            </View>
            <Text style={styles.quickActionText}>My Profile</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  return (
    <ScrollView
      style={styles.scrollView}
      refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />}
      contentContainerStyle={{ paddingBottom: 120 }}
      onScroll={({ nativeEvent }) => {
        const { layoutMeasurement, contentOffset, contentSize } = nativeEvent;
        const isCloseToBottom = layoutMeasurement.height + contentOffset.y >= contentSize.height - 100;
        if (isCloseToBottom && hasMore && !isLoadingMore && !isLoading) {
          setIsLoadingMore(true);
          setPage(prev => prev + 1);
        }
      }}
      scrollEventThrottle={200}
    >
      {renderDashboard()}
      {/* Category Chips */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryContainer}>
        {categories.map(cat => (
          <TouchableOpacity key={cat.id} style={[styles.categoryChip, selectedCategory === cat.id && styles.categoryChipActive]} onPress={() => handleCategoryChange(cat.id)}>
            <Text style={[styles.categoryChipText, selectedCategory === cat.id && styles.categoryChipTextActive]}>{cat.name}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
      {/* Product Grid */}
      <View style={styles.productListContainer}>
        <View style={styles.productHeaderRow}>
          <Text style={styles.sectionTitle}>Featured Products</Text>
          <TouchableOpacity style={styles.filterButton} onPress={() => setShowFilterModal(true)}>
            <MaterialIcons name="filter-list" size={28} color="#7E57C2" style={{ fontWeight: 'bold' }} />
          </TouchableOpacity>
        </View>
        {products.length === 0 && !isLoading ? (
          <Text style={{ textAlign: 'center', color: '#888', marginTop: 40 }}>No products found.</Text>
        ) : (
          <View style={styles.productGrid}>
            {products.map(item => {
  // Ensure hasMakeupService is always present in the mapped object
  const hasMakeup = !!item.hasMakeupService;
  return (
    <TouchableOpacity
      key={item.id || item._id}
      style={styles.productCard}
      onPress={() => {
        const productId = item.id || item._id;
        if (!productId) {
          console.error('Cannot navigate: Product has no ID', item);
          Alert.alert('Error', 'Could not open product details. Please try again.');
          return;
        }
        router.push({ pathname: '/(renter)/product-details/[id]', params: { id: productId.toString() } });
      }}
    >
      <Image source={item.images?.[0] ? { uri: item.images[0] } : defaultProductImage} style={styles.productImage} />
      <View style={styles.productInfo}>
        <Text style={styles.productName} numberOfLines={1}>{item.name}</Text>
        {hasMakeup && (
          <View style={styles.makeupBadgeRow}>
            <MaterialIcons name="face" size={16} color="#7E57C2" style={{ marginRight: 4 }} />
            <Text style={styles.makeupTag}>Makeup Available</Text>
          </View>
        )}
        <Text style={styles.productPrice}>₱{item.price.toFixed(2)}</Text>
      </View>
    </TouchableOpacity>
  );
})}
          </View>
        )}
        {isLoadingMore && (
          <ActivityIndicator size="small" color="#7E57C2" style={{ marginTop: 16 }} />
        )}
      </View>
      <FilterModal visible={showFilterModal} onClose={() => setShowFilterModal(false)} onApplyFilters={handleApplyFilters} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  dashboardContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    margin: 10,
    marginBottom: 18,
    elevation: 2,
  },
  profileSectionModern: {
    alignItems: 'center',
    marginBottom: 10,
  },
  profilePicModern: {
    width: 68,
    height: 68,
    borderRadius: 34,
    marginBottom: 8,
    borderWidth: 2,
    borderColor: '#7E57C2',
  },
  welcomeTextModern: {
    fontSize: 15,
    color: '#888',
    fontWeight: '400',
    marginBottom: 2,
  },
  userNameModern: {
    fontSize: 18,
    color: '#333',
    fontWeight: '700',
    marginBottom: 2,
  },
  statsCardModern: {
    flexDirection: 'row',
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    padding: 14,
    marginTop: 6,
    marginBottom: 6,
    justifyContent: 'space-between',
    elevation: 1,
  },
  statsRowModern: {
    flexDirection: 'row',
    flex: 1,
    justifyContent: 'space-between',
  },
  statBlockModern: {
    alignItems: 'center',
    flex: 1,
  },
  statValueModern: {
    fontSize: 20,
    fontWeight: '700',
    color: '#7E57C2',
  },
  statLabelModern: {
    fontSize: 13,
    color: '#888',
    marginTop: 2,
    textAlign: 'center',
  },
  verticalDivider: {
    width: 1,
    backgroundColor: '#E0E0E0',
    marginHorizontal: 10,
  },
  quickActionsContainer: {
    marginHorizontal: 18,
    marginTop: 8,
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333',
    marginBottom: 8,
    letterSpacing: 0.3,
  },
  quickActionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  quickActionButton: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    alignItems: 'center',
    width: '31%',
    elevation: 1,
  },
  quickActionIcon: {
    marginBottom: 6,
  },
  quickActionText: {
    fontSize: 13,
    color: '#7E57C2',
    fontWeight: '600',
    textAlign: 'center',
  },
  scrollView: { flex: 1, backgroundColor: '#F5F5F5' },
  categoryContainer: {
    flexDirection: 'row',
    paddingHorizontal: 18,
    paddingVertical: 10,
  },
  categoryChip: {
    backgroundColor: '#F5F5F5',
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 7,
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  categoryChipActive: {
    backgroundColor: '#7E57C2',
    borderColor: '#7E57C2',
  },
  categoryChipText: {
    color: '#333',
    fontWeight: '500',
    fontSize: 15,
  },
  categoryChipTextActive: {
    color: '#fff',
    fontWeight: '700',
  },
  productListContainer: {
    padding: 16,
  },
  productGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  productCard: {
    width: '48%',
    backgroundColor: '#fff',
    borderRadius: 8,
    marginBottom: 16,
    elevation: 2,
  },
  productImage: {
    width: '100%',
    height: 150,
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
  },
  productInfo: {
    padding: 12,
  },
  productName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  productPrice: {
    fontSize: 14,
    color: '#7E57C2',
    marginTop: 4,
  },
  endOfListText: {
    textAlign: 'center',
    paddingVertical: 20,
    color: '#888',
  },
  filterButtonText: {
    color: '#fff',
    fontWeight: '600',
    marginLeft: 6,
    fontSize: 15,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 2,
    paddingHorizontal: 2,
    height: 36, // Ensures button matches icon size for alignment
  },
  productHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
    marginTop: 8,
  },
  statsCard: {
    backgroundColor: '#f9f9fd',
    borderRadius: 16,
    paddingVertical: 18,
    paddingHorizontal: 8,
    marginBottom: 18,
    flexDirection: 'row',
    justifyContent: 'center',
    shadowColor: '#7E57C2',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 6,
    elevation: 2,
    flex: 1,
    alignItems: 'center',
  },
  statBlock: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 2,
    paddingHorizontal: 4,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#7E57C2',
    marginTop: 2,
    marginBottom: 0,
  },
  statLabel: {
    fontSize: 13,
    color: '#888',
    marginTop: 2,
    fontWeight: '500',
    textAlign: 'center',
  },
  welcomeTextImproved: {
    fontSize: 16,
    color: '#888',
    fontWeight: '500',
    marginBottom: 2,
    letterSpacing: 0.5,
  },
  userNameImproved: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#2D1457',
    marginBottom: 0,
  },
  profilePicWrapper: {
    borderWidth: 2,
    borderColor: '#E1E1E1',
    borderRadius: 24,
    padding: 2,
    backgroundColor: '#f5f5f5',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 3,
  },
  profilePic: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#eee',
  },
  dashboardHeaderImproved: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  makeupTag: {
    fontSize: 12,
    color: '#7E57C2',
    fontWeight: '600',
    marginBottom: 2,
  },
  makeupBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
});