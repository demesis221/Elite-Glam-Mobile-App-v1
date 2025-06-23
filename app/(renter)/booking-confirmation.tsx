import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { useAuth } from '@/contexts/AuthContext';

export default function BookingConfirmationScreen() {
  const { bookingId } = useLocalSearchParams();
  const router = useRouter();
  const { user } = useAuth();
  
  const [isLoading, setIsLoading] = useState(true);
  const [bookingData, setBookingData] = useState<any>(null);
  
  useEffect(() => {
    // In a real app, fetch booking data from API
    // For this example, we'll load it from AsyncStorage
    loadBookingData();
  }, [bookingId]);
  
  const loadBookingData = async () => {
    try {
      const bookingDataStr = await AsyncStorage.getItem('latestBooking');
      if (bookingDataStr) {
        const data = JSON.parse(bookingDataStr);
        setBookingData(data);
      }
      setIsLoading(false);
    } catch (error) {
      console.error('Error loading booking data:', error);
      setIsLoading(false);
    }
  };
  
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };
  
  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };
  
  const handleViewBookings = () => {
    router.push('/bookings');
  };
  
  const handleBackToHome = () => {
    router.push('/');
  };
  
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6B46C1" />
        <Text style={styles.loadingText}>Loading booking details...</Text>
      </View>
    );
  }
  
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        {/* Success Animation/Image */}
        <View style={styles.successContainer}>
          <View style={styles.successCircle}>
            <Ionicons name="checkmark" size={80} color="#fff" />
          </View>
          <Text style={styles.successTitle}>Booking Confirmed!</Text>
          <Text style={styles.successMessage}>
            Your booking request has been received and is pending approval from the seller.
          </Text>
        </View>
        
        {/* Booking Details */}
        <View style={styles.detailsCard}>
          <Text style={styles.cardTitle}>Booking Details</Text>
          <View style={styles.separator} />
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Booking ID</Text>
            <Text style={styles.detailValue}>{bookingId || 'BK' + Date.now().toString().slice(-6)}</Text>
          </View>
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Status</Text>
            <View style={styles.statusBadge}>
              <Text style={styles.statusText}>Pending</Text>
            </View>
          </View>
          
          {bookingData?.eventDate && (
            <>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Event Date</Text>
                <Text style={styles.detailValue}>{formatDate(bookingData.eventDate)}</Text>
              </View>
              
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Event Time</Text>
                <Text style={styles.detailValue}>{formatTime(bookingData.eventDate)}</Text>
              </View>
            </>
          )}
          
          {bookingData?.returnDate && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Return Date</Text>
              <Text style={styles.detailValue}>{formatDate(bookingData.returnDate)}</Text>
            </View>
          )}
          
          {bookingData?.location && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Location</Text>
              <Text style={styles.detailValue}>{bookingData.location}</Text>
            </View>
          )}
          
          {bookingData?.price && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Total Price</Text>
              <Text style={styles.priceValue}>₱{(bookingData.price + (bookingData.includeMakeupService ? bookingData.makeupPrice : 0)).toLocaleString()}</Text>
            </View>
          )}
        </View>
        
        {/* What's Next Section */}
        <View style={styles.nextStepsCard}>
          <Text style={styles.cardTitle}>What's Next?</Text>
          <View style={styles.separator} />
          
          <View style={styles.stepContainer}>
            <View style={styles.stepCircle}>
              <Text style={styles.stepNumber}>1</Text>
            </View>
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>Waiting for Approval</Text>
              <Text style={styles.stepDescription}>
                The seller will review your booking request and approve it soon.
              </Text>
            </View>
          </View>
          
          <View style={styles.stepContainer}>
            <View style={styles.stepCircle}>
              <Text style={styles.stepNumber}>2</Text>
            </View>
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>Payment Processing</Text>
              <Text style={styles.stepDescription}>
                Once approved, you can proceed with payment to confirm the booking.
              </Text>
            </View>
          </View>
          
          <View style={styles.stepContainer}>
            <View style={styles.stepCircle}>
              <Text style={styles.stepNumber}>3</Text>
            </View>
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>Confirmation Complete</Text>
              <Text style={styles.stepDescription}>
                After payment, your booking will be fully confirmed and ready for your event.
              </Text>
            </View>
          </View>
        </View>
        
        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity 
            style={styles.viewBookingsButton}
            onPress={handleViewBookings}
          >
            <Text style={styles.viewBookingsText}>View My Bookings</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.homeButton}
            onPress={handleBackToHome}
          >
            <Text style={styles.homeButtonText}>Back to Home</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  scrollView: {
    flex: 1,
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
    color: '#6B46C1',
  },
  successContainer: {
    backgroundColor: '#fff',
    padding: 32,
    alignItems: 'center',
    marginBottom: 16,
  },
  successCircle: {
    backgroundColor: '#6B46C1',
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  successTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#202124',
    marginBottom: 16,
    textAlign: 'center',
  },
  successMessage: {
    fontSize: 16,
    color: '#5f6368',
    textAlign: 'center',
    lineHeight: 24,
  },
  detailsCard: {
    backgroundColor: '#fff',
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#202124',
    marginBottom: 12,
  },
  separator: {
    height: 1,
    backgroundColor: '#e1e3e6',
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  detailLabel: {
    fontSize: 16,
    color: '#5f6368',
  },
  detailValue: {
    fontSize: 16,
    fontWeight: '500',
    color: '#202124',
    maxWidth: '60%',
    textAlign: 'right',
  },
  statusBadge: {
    backgroundColor: '#FFF8E1',
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  statusText: {
    color: '#FF9800',
    fontSize: 14,
    fontWeight: '600',
  },
  priceValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#6B46C1',
  },
  nextStepsCard: {
    backgroundColor: '#fff',
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  stepContainer: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  stepCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#EDE9FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  stepNumber: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#6B46C1',
  },
  stepContent: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#202124',
    marginBottom: 4,
  },
  stepDescription: {
    fontSize: 14,
    color: '#5f6368',
    lineHeight: 20,
  },
  actionButtons: {
    padding: 16,
    marginBottom: 32,
  },
  viewBookingsButton: {
    backgroundColor: '#6B46C1',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
  },
  viewBookingsText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  homeButton: {
    backgroundColor: '#f1f3f4',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  homeButtonText: {
    color: '#5f6368',
    fontSize: 16,
    fontWeight: '600',
  },
}); 