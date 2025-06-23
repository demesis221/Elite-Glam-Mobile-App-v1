import { useAuth } from '@/contexts/AuthContext';
import { bookingService } from '@/services/booking.service';
import { Product, productsService } from '@/services/products.service';
import { getUser } from '@/services/users.service';
import { Feather, Ionicons } from '@expo/vector-icons';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';

export default function BookingFormScreen() {
  const [sellerProfile, setSellerProfile] = useState<any>(null);
  const params = useLocalSearchParams();
  const router = useRouter();
  const { user } = useAuth();
  
  // State variables
  const [isLoading, setIsLoading] = useState(false);
  const [productDetails, setProductDetails] = useState<Product | null>(null);
  const [eventDate, setEventDate] = useState(new Date());
  const [eventTime, setEventTime] = useState(new Date());
  const [returnDate, setReturnDate] = useState(new Date(Date.now() + 86400000)); // Default +1 day
  const [location, setLocation] = useState('');
  const [additionalNotes, setAdditionalNotes] = useState('');
  const [price, setPrice] = useState(0);
  const [includeMakeup, setIncludeMakeup] = useState(false);
  const [productName, setProductName] = useState('');
  const [basePrice, setBasePrice] = useState(0);
  const [makeupPrice, setMakeupPrice] = useState(0);
  const [makeupDuration, setMakeupDuration] = useState('');
  const [initialized, setInitialized] = useState(false);
  
  // Date and time picker states
  const [showEventDatePicker, setShowEventDatePicker] = useState(false);
  const [showEventTimePicker, setShowEventTimePicker] = useState(false);
  const [showReturnDatePicker, setShowReturnDatePicker] = useState(false);
  
  // Memoize the loadProductDetails function to prevent recreation on each render
  const loadProductDetails = useCallback(async (productId: string) => {
    setIsLoading(true);
    console.log('Fetching product details from API for ID:', productId);
    try {
      const product = await productsService.getProductById(productId);
      console.log('Product details received:', product?.name || 'Unknown');
      if (product) {
        setProductDetails(product);
        setProductName(prevName => prevName ? prevName : (product.name || ''));
        // Fetch seller profile if sellerUid/userId exists
        const sellerId = product.sellerUid || product.userId;
        if (sellerId) {
          try {
            const seller = await getUser(sellerId);
            setSellerProfile(seller);
            console.log('Seller profile loaded:', seller);
          } catch (err) {
            console.error('Error loading seller profile:', err);
          }
        }
      } else {
        console.log('No product details returned from API');
        Alert.alert('Error', 'Could not load product details.');
      }
    } catch (error) {
      console.error('Error loading product details:', error);
      Alert.alert('Error', 'Failed to load product details. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, []);
  
  // Load booking data from storage (fallback for API failures)
  const loadBookingDataFromStorage = useCallback(async () => {
    console.log('Attempting to load booking data from AsyncStorage');
    try {
      const bookingDataStr = await AsyncStorage.getItem('pendingBooking');
      console.log('AsyncStorage returned:', bookingDataStr ? 'data found' : 'no data');
      
      if (bookingDataStr) {
        const bookingData = JSON.parse(bookingDataStr);
        console.log('Parsed booking data:', bookingData);
        
        if (bookingData.productId) {
          console.log('Loading product from booking data productId:', bookingData.productId);
          loadProductDetails(bookingData.productId);
        }
        
        if (bookingData.productName) {
          setProductName(bookingData.productName);
        }
        
        if (bookingData.price) {
          setPrice(bookingData.price);
        }
        
        if (bookingData.includeMakeup !== undefined) {
          setIncludeMakeup(bookingData.includeMakeup);
        }
        
        if (bookingData.basePrice) {
          setBasePrice(bookingData.basePrice);
        }
        
        if (bookingData.makeupPrice) {
          setMakeupPrice(bookingData.makeupPrice);
        }
        
        if (bookingData.makeupDuration) {
          setMakeupDuration(String(bookingData.makeupDuration));
        }
      } else {
        console.log('No booking data found in AsyncStorage');
      }
    } catch (error) {
      console.error('Error loading booking data from storage:', error);
    }
  }, [loadProductDetails]);

  // Initialize from params - run only once
  useEffect(() => {
    if (initialized) return; // Skip if already initialized
    
    console.log('BookingFormScreen initialized with params:', params);
    
    if (!user) {
      console.log('No user found, redirecting to login');
      Alert.alert('Login Required', 'You must be logged in to book a product.', [
        { text: 'OK', onPress: () => router.push('/login') }
      ]);
      return;
    }
    
    const productId = params.productId as string;
    const priceParam = params.price as string;
    const includeMakeupParam = params.includeMakeup as string;
    const productNameParam = params.productName as string;
    const basePriceParam = params.basePrice as string;
    const makeupPriceParam = params.makeupPrice as string;
    const makeupDurationParam = params.makeupDuration as string;
    
    console.log('Extracted params:', { productIdParam: productId, priceParam, includeMakeupParam, productNameParam, basePriceParam, makeupPriceParam, makeupDurationParam });
    
    if (productNameParam) {
      setProductName(productNameParam);
    }
    
    if (priceParam) {
      try {
        const parsedPrice = parseFloat(priceParam);
        setPrice(parsedPrice);
        console.log('Price set to:', parsedPrice);
      } catch (e) {
        console.error('Error parsing price param:', e);
      }
    }
    
    if (includeMakeupParam === 'true') {
      setIncludeMakeup(true);
      console.log('Include makeup set to true');
    }
    
    if (basePriceParam) {
      try {
        const parsedBasePrice = parseFloat(basePriceParam);
        setBasePrice(parsedBasePrice);
        console.log('Base price set to:', parsedBasePrice);
      } catch (e) {
        console.error('Error parsing base price param:', e);
      }
    }
    
    if (makeupPriceParam) {
      try {
        const parsedMakeupPrice = parseFloat(makeupPriceParam);
        setMakeupPrice(parsedMakeupPrice);
        console.log('Makeup price set to:', parsedMakeupPrice);
      } catch (e) {
        console.error('Error parsing makeup price param:', e);
      }
    }
    
    if (makeupDurationParam) {
      try {
        const parsedMakeupDuration = String(makeupDurationParam);
        setMakeupDuration(parsedMakeupDuration);
        console.log('Makeup duration set to:', parsedMakeupDuration);
      } catch (e) {
        console.error('Error parsing makeup duration param:', e);
      }
    }
    
    // Load product details
    if (productId) {
      console.log('Loading product details for ID:', productId);
      loadProductDetails(productId);
    } else {
      console.log('No product ID found in params, trying AsyncStorage');
      // Try to get from AsyncStorage if params are missing
      loadBookingDataFromStorage();
    }
    
    setInitialized(true);
  }, [params, user, router, loadProductDetails, loadBookingDataFromStorage, initialized]);
  
  // Date and time picker handlers
  const onEventDateChange = (event: any, selectedDate?: Date) => {
    setShowEventDatePicker(Platform.OS === 'ios');
    if (selectedDate) {
      setEventDate(selectedDate);
    }
  };
  
  const onEventTimeChange = (event: any, selectedTime?: Date) => {
    setShowEventTimePicker(Platform.OS === 'ios');
    if (selectedTime) {
      setEventTime(selectedTime);
    }
  };
  
  const onReturnDateChange = (event: any, selectedDate?: Date) => {
    setShowReturnDatePicker(Platform.OS === 'ios');
    if (selectedDate) {
      setReturnDate(selectedDate);
    }
  };
  
  // Format date for display
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      year: 'numeric', 
      month: 'long', 
      day: 'numeric'
    });
  };
  
  // Format time for display
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  
  // Submit booking
  const handleToggleMakeup = (newValue: boolean) => {
    setIncludeMakeup(newValue);
    if (newValue) {
      setPrice(basePrice + makeupPrice);
    } else {
      setPrice(basePrice);
    }
  };

    // Use React state to prevent double submission
    const [bookingInProgress, setBookingInProgress] = useState(false);
const bookingLock = React.useRef(false);
const handleSubmitBooking = async () => {
  if (bookingLock.current) return;
  bookingLock.current = true;
  setBookingInProgress(true);
  // Validate required fields
  if (!productDetails) {
    Alert.alert('Error', 'Product details are not available. Cannot proceed with booking.');
    return;
  }
  if (!user) {
    Alert.alert('Error', 'You must be logged in to make a booking.');
    return;
  }
  if (!location || location.trim().length === 0) {
    Alert.alert('Error', 'Please enter an event location.');
    return;
  }
  if (!eventDate || !eventTime || !returnDate) {
    Alert.alert('Error', 'Please select event and return dates/times.');
    return;
  }
  if (!productDetails.name || !productDetails.id || !productDetails.price) {
    Alert.alert('Error', 'Product details are incomplete.');
    return;
  }

  setIsLoading(true);
  try {
    // Combine event date and time
    const combinedEventDateTime = new Date(
      eventDate.getFullYear(),
      eventDate.getMonth(),
      eventDate.getDate(),
      eventTime.getHours(),
      eventTime.getMinutes(),
      0,
      0
    );
    console.log('combinedEventDateTime:', combinedEventDateTime);

    // Defensive validation for date
    if (!combinedEventDateTime || isNaN(combinedEventDateTime.getTime())) {
      setIsLoading(false);
      Alert.alert('Booking Error', 'Please select a valid event date and time.');
      return;
    }

    // Compose payload matching backend Booking model
    const bookingPayload: any = {
      // Use username, name, or displayName for customerName
      customerName: (user as any).username || user.name || (user as any).displayName || '',
      serviceName: productDetails.name,
      productId: productDetails.id,
      date: combinedEventDateTime.toISOString().split('T')[0], // e.g., '2025-06-21'
      time: combinedEventDateTime.toISOString().split('T')[1]?.slice(0,5) || '', // e.g., '13:00'
      price: price,
      ownerUid: sellerProfile?.id || productDetails.userId || '',
      ownerUsername: sellerProfile?.username || sellerProfile?.name || '',
      productImage: productDetails.image || '',
      eventTimePeriod: 'AM',
      eventType: '',
      fittingTime: '',
      fittingTimePeriod: 'AM',
      eventLocation: location,
      notes: additionalNotes,
      includeMakeupService: !!includeMakeup,
      makeupPrice: includeMakeup ? makeupPrice : 0,
      makeupDuration: includeMakeup ? makeupDuration : '',
      uid: user.id || (user as any).uid || '',
    };
    console.log('bookingPayload.date:', bookingPayload.date, 'bookingPayload.time:', bookingPayload.time);

    // Validate required backend fields
    const requiredFields = [
      'customerName', 'serviceName', 'productId', 'date', 'time', 'price', 'ownerUid', 'ownerUsername'
    ];
    for (const field of requiredFields) {
      if (!bookingPayload[field] || (typeof bookingPayload[field] === 'string' && bookingPayload[field].trim() === '')) {
        Alert.alert('Booking Error', `Missing required booking field: ${field}`);
        setIsLoading(false);
        return;
      }
    }

    console.log('[handleSubmitBooking] productDetails:', productDetails);
    console.log('[handleSubmitBooking] sellerProfile:', sellerProfile);
    console.log('[handleSubmitBooking] Submitting payload:', bookingPayload);
    const response = await bookingService.createBooking(bookingPayload);

    if (response && response.id) {
      await AsyncStorage.removeItem('pendingBooking');
      Alert.alert(
        'Booking Confirmed!',
        'Your booking has been successfully submitted.',
        [
          {
            text: 'OK',
            onPress: () => {
              router.replace({
                pathname: '/(renter)/booking-confirmation',
                params: { bookingId: response.id },
              });
            },
          },
        ]
      );
    } else {
      throw new Error('Invalid response from server.');
    }
  } catch (error: any) {
    // Improved error handling for debugging
    console.error('[handleSubmitBooking] Error submitting booking:', error);
    let errorMsg = 'Could not submit your booking. Please try again.';
    if (error.response) {
      // Axios: backend responded with error
      if (
        (error.response?.status === 409) ||
        (error.message && error.message.toLowerCase().includes('pending booking'))
      ) {
        Alert.alert('Duplicate Booking','You already have a pending booking for this product on this date.');
        console.log('[handleSubmitBooking] Redirecting to bookings due to duplicate');
        router.replace('/(renter)/bookings');
        return;
      }
      errorMsg = error.response.data?.message || JSON.stringify(error.response.data) || errorMsg;
    } else if (error.message) {
      if (error.message.toLowerCase().includes('pending booking')) {
        Alert.alert('Duplicate Booking','You already have a pending booking for this product on this date.');
        console.log('[handleSubmitBooking] Redirecting to bookings due to duplicate (message branch)');
        router.replace('/bookings');
        return;
      }
      // Fetch or network error
      errorMsg = error.message;
    } else {
      errorMsg = JSON.stringify(error);
    }
    Alert.alert('Booking Error', errorMsg);
  } finally {
    setIsLoading(false);
    setBookingInProgress(false);
    bookingLock.current = false;
  }
};
  
  // Loading state
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6B46C1" />
        <Text style={styles.loadingText}>Processing booking...</Text>
      </View>
    );
  }
  
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton} 
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Booking Details</Text>
          <View style={{ width: 24 }} />
        </View>
        
        {/* Product Summary */}
        <View style={styles.productSummary}>
          <Text style={styles.productName}>
            {productName || productDetails?.name || 'Product'}
          </Text>
          <View style={styles.switchRow}>
            <Text style={styles.productPrice}>₱{price.toLocaleString()}</Text>
            {productDetails?.hasMakeupService && (
              <Switch
                trackColor={{ false: "#E0E0E0", true: "#7E57C2" }}
                thumbColor={includeMakeup ? "#4A1E9E" : "#f4f3f4"}
                ios_backgroundColor="#3e3e3e"
                onValueChange={handleToggleMakeup}
                value={includeMakeup}
              />
            )}
          </View>
          {productDetails?.hasMakeupService && (
            <Text style={styles.makeupDetailsText}>
              {includeMakeup
                ? `Makeup service added (+₱${makeupPrice.toLocaleString()}, ${makeupDuration})`
                : `Add makeup service for ₱${makeupPrice.toLocaleString()} (${makeupDuration})`}
            </Text>
          )}
          {includeMakeup && productDetails?.makeupLocation && (
            <View style={{ flexDirection: 'row', marginTop: 4 }}>
              <MaterialIcons name="location-on" size={16} color="#7E57C2" style={{ marginRight: 4 }} />
              <Text style={[styles.makeupDetailsText, { color: '#555' }]}>{productDetails?.makeupLocation}</Text>
            </View>
          )}
          {includeMakeup && productDetails?.makeupDescription && (
            <Text style={[styles.makeupDetailsText, { fontStyle: 'italic', color: '#555', marginTop: 2 }]}>
              {productDetails?.makeupDescription}
            </Text>
          )}
        </View>
        
        {/* Booking Form */}
        <View style={styles.formContainer}>
          {/* Event Date */}
          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>Event Date</Text>
            <TouchableOpacity 
              style={styles.dateInput}
              onPress={() => setShowEventDatePicker(true)}
            >
              <Text style={styles.dateText}>{formatDate(eventDate)}</Text>
              <Feather name="calendar" size={20} color="#6B46C1" />
            </TouchableOpacity>
            {showEventDatePicker && (
              <DateTimePicker
                value={eventDate}
                mode="date"
                display="default"
                onChange={onEventDateChange}
                minimumDate={new Date()}
              />
            )}
          </View>
          
          {/* Event Time */}
          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>Event Time</Text>
            <TouchableOpacity 
              style={styles.dateInput}
              onPress={() => setShowEventTimePicker(true)}
            >
              <Text style={styles.dateText}>{formatTime(eventTime)}</Text>
              <Feather name="clock" size={20} color="#6B46C1" />
            </TouchableOpacity>
            {showEventTimePicker && (
              <DateTimePicker
                value={eventTime}
                mode="time"
                display="default"
                onChange={onEventTimeChange}
              />
            )}
          </View>
          
          {/* Return Date */}
          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>Return Date</Text>
            <TouchableOpacity 
              style={styles.dateInput}
              onPress={() => setShowReturnDatePicker(true)}
            >
              <Text style={styles.dateText}>{formatDate(returnDate)}</Text>
              <Feather name="calendar" size={20} color="#6B46C1" />
            </TouchableOpacity>
            {showReturnDatePicker && (
              <DateTimePicker
                value={returnDate}
                mode="date"
                display="default"
                onChange={onReturnDateChange}
                minimumDate={eventDate}
              />
            )}
          </View>
          
          {/* Location */}
          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>Event Location</Text>
            <TextInput
              style={styles.textInput}
              placeholder="Enter event location"
              value={location}
              onChangeText={setLocation}
            />
          </View>
          
          {/* Additional Notes */}
          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>Additional Notes</Text>
            <TextInput
              style={styles.textAreaInput}
              placeholder="Any special requests or notes for the seller"
              value={additionalNotes}
              onChangeText={setAdditionalNotes}
              multiline
              numberOfLines={4}
            />
          </View>
        </View>
        
        {/* Payment Summary */}
        <View style={styles.paymentSummary}>
          <Text style={styles.summaryTitle}>Payment Summary</Text>
          
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Gown Rental</Text>
            <Text style={styles.summaryValue}>₱{basePrice > 0 ? basePrice.toLocaleString() : (price - (includeMakeup ? makeupPrice : 0)).toLocaleString()}</Text>
          </View>
          
          {includeMakeup && (
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Makeup Service</Text>
              <Text style={styles.summaryValue}>₱{makeupPrice.toLocaleString()}</Text>
            </View>
          )}
          
          <View style={styles.summaryRow}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue}>₱{price.toLocaleString()}</Text>
          </View>
          </View>
          {/* Submit Button */}
          <TouchableOpacity 
            style={[styles.submitButton, (isLoading || bookingInProgress) && { opacity: 0.6 }]}
            onPress={handleSubmitBooking}
            disabled={isLoading || bookingInProgress}
          >
            <Text style={styles.submitButtonText}>{(isLoading || bookingInProgress) ? 'Processing...' : 'Confirm Booking'}</Text>
          </TouchableOpacity>
          {/* Cancellation Policy */}
          <View style={styles.policyContainer}>
            <Text style={styles.policyTitle}>Cancellation Policy</Text>
            <Text style={styles.policyText}>
              Free cancellation is available up to 48 hours before your event date.
              Cancellations made within 48 hours of the event may be subject to a fee.
            </Text>
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
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      paddingVertical: 20,
      backgroundColor: '#fff',
      borderBottomWidth: 1,
      borderBottomColor: '#f1f3f4',
    },
    backButton: {
      padding: 8,
    },
    headerTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      color: '#202124',
    },
    productSummary: {
      backgroundColor: '#fff',
      padding: 16,
      marginBottom: 16,
    },
    productName: {
      fontSize: 22,
      fontWeight: 'bold',
      color: '#202124',
      marginBottom: 8,
    },
    productPrice: {
      fontSize: 20,
      fontWeight: '700',
      color: '#6B46C1',
      marginBottom: 8,
    },
    makeupBadge: {
      backgroundColor: '#EDE9FF',
      paddingVertical: 6,
      paddingHorizontal: 12,
      borderRadius: 12,
      alignSelf: 'flex-start',
    },
    makeupBadgeText: {
      color: '#6B46C1',
      fontSize: 14,
      fontWeight: '600',
    },
    switchRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    makeupDetailsText: {
      fontSize: 14,
      color: '#5f6368',
      marginTop: 4,
    },
    formContainer: {
      backgroundColor: '#fff',
      padding: 16,
      marginBottom: 16,
    },
    formGroup: {
      marginBottom: 20,
    },
    formLabel: {
      fontSize: 16,
      fontWeight: '600',
      color: '#202124',
      marginBottom: 8,
    },
    dateInput: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: '#e1e3e6',
      borderRadius: 8,
      paddingHorizontal: 16,
      paddingVertical: 12,
    },
    dateText: {
      fontSize: 16,
      color: '#202124',
    },
    textInput: {
      borderWidth: 1,
      borderColor: '#e1e3e6',
      borderRadius: 8,
      paddingHorizontal: 16,
      paddingVertical: 12,
      fontSize: 16,
    },
    textAreaInput: {
      borderWidth: 1,
      borderColor: '#e1e3e6',
      borderRadius: 8,
      paddingHorizontal: 16,
      paddingVertical: 12,
      fontSize: 16,
      minHeight: 100,
    },
    paymentSummary: {
      backgroundColor: '#fff',
      padding: 16,
      marginBottom: 16,
    },
    summaryTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      color: '#202124',
      marginBottom: 16,
    },
    summaryRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 12,
    },
    summaryLabel: {
      fontSize: 16,
      color: '#5f6368',
    },
    summaryValue: {
      fontSize: 16,
      fontWeight: '500',
      color: '#202124',
    },
    totalRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginTop: 12,
      paddingTop: 12,
      borderTopWidth: 1,
      borderTopColor: '#e1e3e6',
    },
    totalLabel: {
      fontSize: 18,
      fontWeight: 'bold',
      color: '#202124',
    },
    totalValue: {
      fontSize: 18,
      fontWeight: 'bold',
      color: '#6B46C1',
    },
    submitButton: {
      backgroundColor: '#6B46C1',
      paddingVertical: 16,
      borderRadius: 12,
      marginHorizontal: 16,
      marginBottom: 16,
      alignItems: 'center',
    },
    submitButtonText: {
      color: '#fff',
      fontSize: 18,
      fontWeight: 'bold',
    },
    policyContainer: {
      padding: 16,
      marginBottom: 40,
    },
    policyTitle: {
      fontSize: 16,
      fontWeight: 'bold',
      color: '#202124',
      marginBottom: 8,
    },
    policyText: {
      fontSize: 14,
      lineHeight: 20,
      color: '#5f6368',
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
  });
