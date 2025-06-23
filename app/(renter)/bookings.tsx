import { MaterialIcons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import {
    ActivityIndicator,
    FlatList,
    Image,
    RefreshControl,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { Booking, BookingStatus, bookingService } from '@/services/booking.service';

const STATUS_COLORS = {
  pending: '#FFA500',
  confirmed: '#4CAF50',
  rejected: '#F44336',
  cancelled: '#F44336',
  completed: '#4CAF50',
} as const;

const STATUS_ICONS = {
  pending: 'schedule' as const,
  confirmed: 'check-circle' as const,
  cancelled: 'cancel' as const,
  rejected: 'close' as const,
  completed: 'check-circle' as const,
} as const;

export default function CustomerBookingsScreen() {
  const { user } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<BookingStatus | null>(null);
  const [error, setError] = useState<string | null>(null);

  const LIMIT = 10;

  const fetchBookings = useCallback(async (isRefreshing = false) => {
    if (loading || (!hasMore && !isRefreshing)) return;

    setLoading(true);
    if (isRefreshing) {
      setError(null);
    }

    const newPage = isRefreshing ? 1 : page;

    try {
      const data = await bookingService.getMyBookings(
        newPage,
        LIMIT,
        selectedStatus || undefined,
        searchQuery || undefined
      );

      if (data && Array.isArray(data)) {
        if (isRefreshing) {
          setBookings(data);
        } else {
          setBookings(prevBookings => [...prevBookings, ...data]);
        }
        setPage(newPage + 1);
        setHasMore(data.length === LIMIT);
      } else {
        setHasMore(false);
        if (isRefreshing) {
          setBookings([]);
        }
      }
    } catch (e) {
      console.error('Error fetching bookings:', e);
      setError('Failed to load bookings. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
      setIsInitialLoad(false);
    }
  }, [page, hasMore, loading, selectedStatus, searchQuery]);

  useFocusEffect(
    useCallback(() => {
      setIsInitialLoad(true);
      setPage(1);
      setHasMore(true);
      setBookings([]);
      fetchBookings(true);
    }, [selectedStatus, searchQuery])
  );

  const handleRefresh = () => {
    setRefreshing(true);
    setPage(1);
    setHasMore(true);
    fetchBookings(true);
  };

  const handleLoadMore = () => {
    if (!loading && hasMore) {
      fetchBookings();
    }
  };

  const filteredBookings = bookings;

  const renderStatusFilter = () => (
    <View style={styles.filterContainer}>
      {(Object.keys(STATUS_COLORS) as BookingStatus[]).map((status) => (
        <TouchableOpacity
          key={status}
          style={[
            styles.filterButton,
            selectedStatus === status && styles.filterButtonActive,
            { backgroundColor: selectedStatus === status ? STATUS_COLORS[status] : 'transparent' }
          ]}
          onPress={() => setSelectedStatus(selectedStatus === status ? null : status)}
        >
          <MaterialIcons
            name={STATUS_ICONS[status]}
            size={20}
            color={selectedStatus === status ? 'white' : STATUS_COLORS[status]}
          />
          <Text
            style={[
              styles.filterText,
              { color: selectedStatus === status ? 'white' : STATUS_COLORS[status] }
            ]}
          >
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderBookingItem = ({ item: booking }: { item: Booking }) => {
    const handlePress = () => {
      if (!user) return;

      const bookingId = booking.bookingId || booking.id;

      if (user.role === 'renter' || user.role === 'user') {
        router.push(`/(renter)/booking-details/${bookingId}`);
      } else if (user.role === 'freelancer') {
        router.push(`/(freelancer)/booking-details/${bookingId}`);
      } else {
        console.log(`User with role ${user.role} tried to access booking details.`);
      }
    };

    return (
      <TouchableOpacity
        style={styles.bookingCard}
        onPress={handlePress}
      >
        <View style={styles.bookingContent}>
          <View style={styles.imageContainer}>
            {booking.productImage ? (
              <Image source={{ uri: booking.productImage }} style={styles.productImage} />
            ) : (
              <View style={styles.noImageContainer}>
                <MaterialIcons name="photo-camera" size={30} color="#ccc" />
              </View>
            )}
          </View>
          <View style={styles.bookingInfo}>
            <View style={styles.headerRow}>
              <View style={styles.titleContainer}>
                <Text style={styles.serviceName} numberOfLines={2}>{booking.serviceName}</Text>
                <View style={styles.priceContainer}>
                  <Text style={styles.priceText}>₱{booking.price.toFixed(2)}</Text>
                </View>
              </View>
              <View style={[styles.statusBadge, { backgroundColor: STATUS_COLORS[booking.status] }]}>
                <MaterialIcons name={STATUS_ICONS[booking.status]} size={14} color="#fff" />
                <Text style={styles.statusText}>{booking.status}</Text>
              </View>
            </View>
            <View style={styles.detailsContainer}>
              <View style={styles.detailRow}>
                <MaterialIcons name="person" size={16} color="#666" />
                <Text style={styles.detailText}>{booking.ownerUsername}</Text>
              </View>
              <View style={styles.detailRow}>
                <MaterialIcons name="event" size={16} color="#666" />
                <Text style={styles.detailText}>{new Date(booking.date).toLocaleDateString()}</Text>
              </View>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderFooter = () => {
    if (!loading || isInitialLoad) return null;
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="small" color="#6B46C1" />
        <Text style={styles.loadingText}>Loading more...</Text>
      </View>
    );
  };

  if (isInitialLoad && loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6B46C1" />
        <Text style={styles.loadingText}>Loading your bookings...</Text>
      </View>
    );
  }

  if (error && !bookings.length) {
    return (
      <View style={styles.errorContainer}>
        <MaterialIcons name="error-outline" size={60} color="#F44336" />
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={() => handleRefresh()}>
          <Text style={styles.retryButtonText}>Try Again</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Bookings</Text>
      </View>
      <View style={styles.searchContainer}>
        <MaterialIcons name="search" size={24} color="#999" />
        <TextInput
          style={styles.searchInput}
          placeholder="Search by service or ID..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>
      {renderStatusFilter()}
      {filteredBookings.length === 0 && !loading ? (
        <View style={styles.emptyContainer}>
          <MaterialIcons name="inbox" size={80} color="#ccc" />
          <Text style={styles.emptyText}>No Bookings Found</Text>
          <Text style={styles.emptyText}>No bookings found</Text>
          <Text style={styles.emptySubtext}>
            {searchQuery || selectedStatus
              ? 'Try adjusting your filters'
              : 'Book your first rental to get started'}
          </Text>
          {!searchQuery && !selectedStatus && (
            <TouchableOpacity
              style={styles.browseButton}
              onPress={() => router.push('/(renter)')}
            >
              <Text style={styles.browseButtonText}>Browse Products</Text>
            </TouchableOpacity>
          )}
        </View>
      ) : (
        <FlatList
          data={filteredBookings}
          keyExtractor={(item) => item.id}
          renderItem={renderBookingItem}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={['#6B46C1']}
              tintColor="#6B46C1"
            />
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 16,
    color: '#333',
  },
  filterContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#ddd',
    marginRight: 8,
    marginBottom: 8,
  },
  filterButtonActive: {
    borderWidth: 0,
  },
  filterText: {
    fontSize: 14,
    marginLeft: 4,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  errorText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 16,
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: '#6B46C1',
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  emptySubtext: {
    marginTop: 8,
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  browseButton: {
    marginTop: 24,
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: '#6B46C1',
    borderRadius: 8,
  },
  browseButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  listContent: {
    padding: 12,
  },
  bookingCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 16,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  bookingContent: {
    flexDirection: 'row',
  },
  imageContainer: {
    width: 100,
    height: 100,
  },
  productImage: {
    width: '100%',
    height: '100%',
  },
  noImageContainer: {
    width: '100%',
    height: '100%',
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  bookingInfo: {
    flex: 1,
    padding: 12,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  titleContainer: {
    flex: 1,
    marginRight: 8,
  },
  serviceName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  priceText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#666',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#fff',
    marginLeft: 4,
  },
  detailsContainer: {
    marginTop: 4,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  detailText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 4,
  },
}); 