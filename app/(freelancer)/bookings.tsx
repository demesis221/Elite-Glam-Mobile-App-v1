import { Booking, BookingStatus, bookingService } from '@/services/booking.service';
import { MaterialIcons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import React, { useCallback, useState } from 'react';
// Custom checkbox for cross-platform compatibility
const CustomCheckBox = ({ value, onValueChange }: { value: boolean, onValueChange: () => void }) => (
  <TouchableOpacity
    onPress={onValueChange}
    style={{ width: 24, height: 24, borderWidth: 2, borderColor: '#6B46C1', borderRadius: 4, alignItems: 'center', justifyContent: 'center', backgroundColor: value ? '#6B46C1' : '#fff' }}
  >
    {value ? <MaterialIcons name="check" size={18} color="#fff" /> : null}
  </TouchableOpacity>
);

import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';

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

export default function SellerBookingsScreen() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<BookingStatus | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [deleteMode, setDeleteMode] = useState(false);
  const [selectedBookings, setSelectedBookings] = useState<string[]>([]);

  // Fetch bookings when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      fetchBookings();
    }, [])
  );

  const fetchBookings = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Get seller bookings
      const data = await bookingService.getSellerBookings(1, 100, selectedStatus ?? undefined, searchQuery);
      setBookings(data as Booking[]);
    } catch (error) {
      console.error('Error fetching seller bookings:', error);
      setError('Failed to load bookings. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchBookings();
  };

  // Handle booking status update
  const handleUpdateStatus = async (bookingId: string, status: BookingStatus) => {
    try {
      Alert.alert(
        `${status.charAt(0).toUpperCase() + status.slice(1)} Booking`,
        `Are you sure you want to ${status} this booking?`,
        [
          {
            text: 'Cancel',
            style: 'cancel'
          },
          {
            text: 'Yes',
            onPress: async () => {
              try {
                await bookingService.updateBookingStatus(bookingId, status);
                Alert.alert('Success', `Booking has been ${status} successfully`);
                fetchBookings(); // Refresh the list
              } catch (error) {
                console.error(`Error updating booking status to ${status}:`, error);
                Alert.alert('Error', `Failed to update booking status. Please try again.`);
              }
            }
          }
        ]
      );
    } catch (error) {
      console.error('Error in handleUpdateStatus:', error);
      Alert.alert('Error', 'An unexpected error occurred. Please try again.');
    }
  };

  // Filter bookings based on search query and selected status
  const filteredBookings = bookings.filter(booking => {
    // Use only `id` (virtual) for type safety

    const matchesSearch = 
      (booking.serviceName?.toLowerCase().includes(searchQuery.toLowerCase()) || false) ||
      (booking.id ?? '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (booking.customerName?.toLowerCase().includes(searchQuery.toLowerCase()) || false);
    
    const matchesStatus = selectedStatus ? booking.status === selectedStatus : true;
    
    return matchesSearch && matchesStatus;
  });

  // Render status filter buttons
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

  // Render action buttons based on booking status
  const renderActionButtons = (booking: Booking) => {
    switch (booking.status) {
      case 'pending':
        return (
          <View style={styles.actionButtonsContainer}>
            <TouchableOpacity
              style={[styles.actionButton, styles.confirmButton]}
              onPress={() => handleUpdateStatus(booking.id, 'confirmed')}
            >
              <MaterialIcons name="check" size={16} color="#fff" />
              <Text style={styles.actionButtonText}>Confirm</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionButton, styles.rejectButton]}
              onPress={() => handleUpdateStatus(booking.id, 'rejected')}
            >
              <MaterialIcons name="close" size={16} color="#fff" />
              <Text style={styles.actionButtonText}>Reject</Text>
            </TouchableOpacity>
          </View>
        );
      case 'confirmed':
        return (
          <View style={styles.actionButtonsContainer}>
            <TouchableOpacity
              style={[styles.actionButton, styles.completeButton]}
              onPress={() => handleUpdateStatus(booking.id, 'completed')}
            >
              <MaterialIcons name="done-all" size={16} color="#fff" />
              <Text style={styles.actionButtonText}>Mark Complete</Text>
            </TouchableOpacity>
          </View>
        );
      default:
        return null;
    }
  };

  // Render a booking item
  const isDeletable = (booking: Booking) => ['cancelled', 'completed'].includes(booking.status);

  const handleLongPress = (booking: Booking) => {
    if (isDeletable(booking)) {
      setDeleteMode(true);
      setSelectedBookings([booking.id]);
    }
  };

  const handleSelectBooking = (bookingId: string) => {
    setSelectedBookings(prev =>
      prev.includes(bookingId)
        ? prev.filter(id => id !== bookingId)
        : [...prev, bookingId]
    );
  };

  const handleDeleteSelected = () => {
    Alert.alert(
      'Delete Bookings',
      'Are you sure you want to delete the selected bookings? This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete', style: 'destructive', onPress: () => {
            setBookings(prev => prev.filter(b => !selectedBookings.includes(b.id)));
            setSelectedBookings([]);
            setDeleteMode(false);
          }
        }
      ]
    );
  };

  const renderBookingItem = ({ item: booking }: { item: Booking }) => (
    <View style={styles.bookingCard}>
      <TouchableOpacity
        style={styles.bookingContent}
        onPress={() => !deleteMode && router.push(`/(freelancer)/booking-details/${booking.id}`)}
        onLongPress={() => handleLongPress(booking)}
      >
        <View style={styles.imageContainer}>
          {booking.productImage ? (
            <Image
              source={{ uri: booking.productImage }}
              style={styles.productImage}
              resizeMode="cover"
            />
          ) : (
            <View style={styles.noImageContainer}>
              <MaterialIcons name="image-not-supported" size={24} color="#ccc" />
            </View>
          )}
        </View>

        <View style={styles.bookingInfo}>
          <View style={styles.headerRow}>
            <View style={styles.titleContainer}>
              <Text style={styles.serviceName} numberOfLines={1}>
                {booking.serviceName || 'Product not Available'}
              </Text>
              <Text style={styles.customerName}>
                Customer: {booking.customerName || 'Unknown'}
              </Text>
            </View>
            <View style={[styles.statusBadge, { backgroundColor: STATUS_COLORS[booking.status] }]}>
              <MaterialIcons name={STATUS_ICONS[booking.status]} size={14} color="white" />
              <Text style={styles.statusText}>
                {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
              </Text>
            </View>
          </View>

          <View style={styles.detailsContainer}>
            {booking.eventLocation && (
              <View style={styles.detailRow}>
                <MaterialIcons name="location-on" size={16} color="#666" />
                <Text style={styles.detailText} numberOfLines={1}>{booking.eventLocation}</Text>
              </View>
            )}
            <View style={styles.detailRow}>
              <MaterialIcons name="event" size={16} color="#666" />
              <Text style={styles.detailText}>
                {new Date(booking.date).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric'
                })}
              </Text>
            </View>
            <View style={styles.priceRow}>
              <MaterialIcons name="attach-money" size={16} color="#6B46C1" />
              <Text style={styles.priceText}>₱{booking.price.toLocaleString()}</Text>
            </View>
          </View>
        </View>
      </TouchableOpacity>
      
      {/* Delete Mode Checkbox */}
      {deleteMode && isDeletable(booking) && (
        <View style={styles.checkboxContainer}>
          <CustomCheckBox
            value={selectedBookings.includes(booking.id)}
            onValueChange={() => handleSelectBooking(booking.id)}
          />
        </View>
      )}
      {/* Action Buttons */}
      {!deleteMode && renderActionButtons(booking)}
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Delete Bar */}
      {deleteMode && (
        <View style={styles.deleteBar}>
          <TouchableOpacity style={styles.deleteButton} onPress={() => { setDeleteMode(false); setSelectedBookings([]); }}>
            <MaterialIcons name="close" size={24} color="#fff" />
            <Text style={styles.deleteBarText}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.deleteButton, { opacity: selectedBookings.length === 0 ? 0.5 : 1 }]}
            onPress={handleDeleteSelected}
            disabled={selectedBookings.length === 0}
          >
            <MaterialIcons name="delete" size={24} color="#fff" />
            <Text style={styles.deleteBarText}>Delete Selected</Text>
          </TouchableOpacity>
        </View>
      )}
      {loading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#6B46C1" />
          <Text style={styles.loadingText}>Loading bookings...</Text>
        </View>
      ) : error ? (
        <View style={styles.errorContainer}>
          <MaterialIcons name="error" size={48} color="#F44336" />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={fetchBookings}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : filteredBookings.length === 0 ? (
        <ScrollView contentContainerStyle={{ flexGrow: 1, minHeight: require('react-native').Dimensions.get('window').height }} keyboardShouldPersistTaps="handled">
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
              <MaterialIcons name="arrow-back" size={24} color="#666" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Manage Bookings</Text>
            <View style={{ width: 24 }} />
          </View>
          <View style={styles.searchContainer}>
            <MaterialIcons name="search" size={20} color="#999" />
            <TextInput
              style={styles.searchInput}
              placeholder="Search by product or customer..."
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <MaterialIcons name="clear" size={20} color="#999" />
              </TouchableOpacity>
            )}
          </View>
          {renderStatusFilter()}
          <View style={styles.emptyContainer}>
            <MaterialIcons name="event-busy" size={64} color="#ccc" />
            <Text style={styles.emptyText}>No bookings found</Text>
            <Text style={styles.emptySubtext}>
              {searchQuery || selectedStatus
                ? 'Try adjusting your filters'
                : 'No one has booked your products yet'}
            </Text>
          </View>
        </ScrollView>
      ) : (
        <FlatList
          data={filteredBookings}
          keyExtractor={(item) => item.id}
          renderItem={renderBookingItem}
          contentContainerStyle={[
            styles.listContent,
            { flexGrow: 1, paddingBottom: 16, minHeight: require('react-native').Dimensions.get('window').height }
          ]}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} colors={["#6B46C1"]} />
          }
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            <>
              <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                  <MaterialIcons name="arrow-back" size={24} color="#666" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Manage Bookings</Text>
                <View style={{ width: 24 }} />
              </View>
              <View style={styles.searchContainer}>
                <MaterialIcons name="search" size={20} color="#999" />
                <TextInput
                  style={styles.searchInput}
                  placeholder="Search by product or customer..."
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                />
                {searchQuery.length > 0 && (
                  <TouchableOpacity onPress={() => setSearchQuery('')}>
                    <MaterialIcons name="clear" size={20} color="#999" />
                  </TouchableOpacity>
                )}
              </View>
              {renderStatusFilter()}
            </>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  deleteBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F44336',
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#D32F2F',
    padding: 10,
    borderRadius: 6,
  },

  deleteBarText: {
    color: '#fff',
    marginLeft: 8,
    fontWeight: 'bold',
    fontSize: 16,
  },
  checkboxContainer: {
    position: 'absolute',
    top: 10,
    right: 10,
    zIndex: 2,
  },
  container: {
    flex: 1,
    backgroundColor: '#f9f9f9',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#6B46C1',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 8,
    margin: 16,
    padding: 10,
    borderWidth: 1,
    borderColor: '#eee',
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 16,
  },
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingBottom: 16,
    flexWrap: 'wrap',
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    paddingVertical: 6,
    paddingHorizontal: 12,
    marginRight: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  filterButtonActive: {
    borderColor: 'transparent',
  },
  filterText: {
    marginLeft: 4,
    fontSize: 12,
    fontWeight: '500',
  },
  bookingCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    overflow: 'hidden',
  },
  bookingContent: {
    flexDirection: 'row',
  },
  imageContainer: {
    width: 100,
    height: 120,
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
    fontWeight: '600',
    marginBottom: 4,
  },
  customerName: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  priceText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B46C1',
    marginLeft: 6,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 12,
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 4,
  },
  detailsContainer: {
    marginTop: 8,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  detailText: {
    fontSize: 13,
    color: '#666',
    marginLeft: 6,
  },
  actionButtonsContainer: {
    flexDirection: 'row',
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    justifyContent: 'flex-end',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    marginLeft: 8,
  },
  confirmButton: {
    backgroundColor: '#4CAF50',
  },
  rejectButton: {
    backgroundColor: '#F44336',
  },
  completeButton: {
    backgroundColor: '#2196F3',
  },
  actionButtonText: {
    color: '#fff',
    fontWeight: '500',
    fontSize: 14,
    marginLeft: 4,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
    padding: 20,
  },
  errorText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 16,
    backgroundColor: '#6B46C1',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  emptySubtext: {
    marginTop: 8,
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  listContent: {
    padding: 16,
  },
}); 