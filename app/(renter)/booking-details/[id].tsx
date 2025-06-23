import { Stack, useLocalSearchParams, router } from 'expo-router';
import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Image, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { bookingService, Booking } from '@/services/booking.service';

const STATUS_COLORS = {
  pending: '#F59E0B',
  confirmed: '#10B981',
  rejected: '#EF4444',
  cancelled: '#6B7280',
  completed: '#3B82F6',
} as const;

const STATUS_ICONS = {
  pending: 'schedule',
  confirmed: 'check-circle',
  rejected: 'cancel',
  cancelled: 'not-interested',
  completed: 'done-all',
} as const;

export default function RenterBookingDetailsScreen() {
  const { id } = useLocalSearchParams();
  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBooking = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await bookingService.getBookingById(id as string);
      setBooking(data);
    } catch (e: any) {
      setError(e?.message || 'Failed to load booking details');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchBooking();
  }, [fetchBooking]);

  if (loading) {
    return (
      <View style={styles.centered}><ActivityIndicator size="large" color="#7E57C2" /><Text>Loading booking details...</Text></View>
    );
  }

  if (error) {
    return (
      <View style={styles.centered}><Text style={{ color: 'red' }}>{error}</Text></View>
    );
  }

  if (!booking) {
    return (
      <View style={styles.centered}><Text>No booking found.</Text></View>
    );
  }

  const statusColor = STATUS_COLORS[booking.status] || '#6B7280';
  const statusIcon = STATUS_ICONS[booking.status] || 'help-outline';

  return (
    <ScrollView style={styles.container}>
      <Stack.Screen options={{ title: `Booking #${booking.bookingId || booking.id}` }} />
      <View style={styles.headerRow}>
        <Text style={styles.title}>Booking Details</Text>
        <View style={[styles.statusBadge, { backgroundColor: statusColor + '22' }]}> 
          <MaterialIcons name={statusIcon} size={18} color={statusColor} />
          <Text style={[styles.statusText, { color: statusColor }]}>{booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}</Text>
        </View>
      </View>
      {booking.productImage && (
        <Image source={{ uri: booking.productImage }} style={styles.productImage} />
      )}
      <View style={styles.section}>
        <Text style={styles.label}>Service</Text>
        <Text style={styles.value}>{booking.serviceName}</Text>
      </View>
      <View style={styles.sectionRow}>
        <View style={{ flex: 1 }}>
          <Text style={styles.label}>Date</Text>
          <Text style={styles.value}>{booking.date}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.label}>Time</Text>
          <Text style={styles.value}>{booking.time} {booking.eventTimePeriod}</Text>
        </View>
      </View>
      <View style={styles.sectionRow}>
        <View style={{ flex: 1 }}>
          <Text style={styles.label}>Location</Text>
          <Text style={styles.value}>{booking.eventLocation || booking.sellerLocation || '-'}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.label}>Price</Text>
          <Text style={styles.value}>₱{booking.price?.toLocaleString()}</Text>
        </View>
      </View>
      <View style={styles.section}>
        <Text style={styles.label}>Freelancer</Text>
        <Text style={styles.value}>{booking.ownerUsername || '-'}</Text>
      </View>
      {booking.includeMakeupService && (
        <View style={styles.sectionRow}>
          <Text style={styles.label}>Makeup Service Included</Text>
          <Text style={styles.value}>+₱{booking.makeupPrice?.toLocaleString()}</Text>
        </View>
      )}
      {booking.notes && (
        <View style={styles.section}>
          <Text style={styles.label}>Notes</Text>
          <Text style={styles.value}>{booking.notes}</Text>
        </View>
      )}
      {booking.rejectionMessage && (
        <View style={styles.section}>
          <Text style={[styles.label, { color: STATUS_COLORS.rejected }]}>Rejection Reason</Text>
          <Text style={[styles.value, { color: STATUS_COLORS.rejected }]}>{booking.rejectionMessage}</Text>
        </View>
      )}
      {/* Optional: Add a cancel button for renters if booking is pending/confirmed */}
      {(booking.status === 'pending' || booking.status === 'confirmed') && (
        <View style={styles.actionsRow}>
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: STATUS_COLORS.cancelled }]}
            onPress={() => {
              Alert.alert(
                'Cancel Booking',
                'Are you sure you want to cancel this booking?',
                [
                  { text: 'No', style: 'cancel' },
                  { text: 'Yes', style: 'destructive', onPress: async () => {
                    try {
                      await bookingService.updateBookingStatus(booking.id, 'cancelled');
                      Alert.alert('Booking Cancelled', 'Your booking has been cancelled.');
                      fetchBooking();
                    } catch (e: any) {
                      Alert.alert('Error', e?.message || 'Failed to cancel booking.');
                    }
                  }}
                ]
              );
            }}
          >
            <MaterialIcons name="cancel" size={20} color="#fff" />
            <Text style={styles.actionText}>Cancel Booking</Text>
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
    backgroundColor: '#fff',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 16,
    marginBottom: 12,
    paddingHorizontal: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#22223b',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 4,
    marginLeft: 8,
  },
  statusText: {
    marginLeft: 6,
    fontWeight: 'bold',
    fontSize: 14,
  },
  productImage: {
    width: '100%',
    height: 180,
    borderRadius: 12,
    marginBottom: 10,
    resizeMode: 'cover',
  },
  section: {
    marginTop: 12,
    marginBottom: 4,
    paddingHorizontal: 16,
  },
  sectionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
    marginBottom: 4,
    paddingHorizontal: 16,
  },
  label: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 2,
    fontWeight: '500',
  },
  value: {
    fontSize: 16,
    color: '#22223b',
    marginBottom: 2,
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 24,
    paddingHorizontal: 16,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#6B7280',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginLeft: 12,
  },
  actionText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
    marginLeft: 8,
  },
});
