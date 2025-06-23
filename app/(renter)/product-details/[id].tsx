import { Feather, FontAwesome, Ionicons } from '@expo/vector-icons';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  useWindowDimensions
} from 'react-native';
import { Switch } from 'react-native-gesture-handler';
import { useAuth } from '@/contexts/AuthContext';
import { useCart } from '@/contexts/CartContext';
import { Product, productsService } from '@/services/products.service';
import { Rating, ratingsService } from '@/services/ratings.service';
import { getUser } from '@/services/users.service';

// Default product image
const defaultImage = require('@/assets/images/dressProduct.png');

import { Modal, FlatList } from 'react-native';

// Extend imported Product type
type LocalProduct = Product & {
  hasMakeupService: boolean;
  makeupPrice?: number;
  makeupDescription?: string;
};

export default function ProductDetailsScreen() {
  const { id } = useLocalSearchParams();
  console.log('[ProductDetailsScreen] Route param id:', id);

  const router = useRouter();
  const { user } = useAuth();
  const { addToCart, cartItems } = useCart();
  const { width } = useWindowDimensions();

  // State variables
  const [product, setProduct] = useState<LocalProduct | null>(null);
  const [currentImage, setCurrentImage] = useState<string | null>(null);
  const [sellerProfile, setSellerProfile] = useState<any>(null);
  const [ratings, setRatings] = useState<Rating[]>([]);
  // For full image modal
  const [isImageModalVisible, setIsImageModalVisible] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [isRentingNow, setIsRentingNow] = useState(false);
  const [includeMakeup, setIncludeMakeup] = useState(false);
  const [isRatingMode, setIsRatingMode] = useState(false);
  const [averageRating, setAverageRating] = useState(0);
  const [isInCart, setIsInCart] = useState(false);
  const [makeupPrice, setMakeupPrice] = useState(1500); // Default makeup price
  const [makeupDuration, setMakeupDuration] = useState<number>(0);
  const [userRating, setUserRating] = useState(0);
  const [userComment, setUserComment] = useState('');
  const [hasUserRented, setHasUserRented] = useState(false); // Track if user has rented this product
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    console.log('[ProductDetailsScreen] useEffect for loadProductData fired, id:', id, 'user:', user);
    async function loadProductData() {
      if (!id) {
        console.error('[loadProductData] No product ID in route params!');
        setError('No product ID provided in the route. Please try again.');
        setLoading(false);
        return;
      }
      console.log('[loadProductData] Loading product data for ID:', id);
      setLoading(true);
      setError(null);
      try {
        const data = await productsService.getProductById(id as string);
        if (data) {
          setProduct({
            ...data,
            hasMakeupService: data.hasMakeupService || false,
            makeupPrice: data.makeupPrice,
            makeupDescription: data.makeupDescription
          });
          setCurrentImage(data.image || null);
          if (data.hasMakeupService) {
            setMakeupPrice(data.makeupPrice || 0);
            setMakeupDuration(Number(data.makeupDuration) || 0);
          }
          const sellerId = data.sellerUid || data.userId;
          if (typeof sellerId === 'string' && sellerId.length > 0) {
            getUser(sellerId)
              .then((sellerData) => {
                console.log('[loadProductData] Seller profile loaded:', sellerData?.name || 'Unknown');
                setSellerProfile(sellerData);
              })
              .catch((sellerError) => {
                console.error('[loadProductData] Error loading seller profile:', sellerError);
              });
          } else {
            console.error('[loadProductData] No valid sellerId found for product:', data);
          }
          setError(null);
        } else {
          setError('Sorry, this product could not be found. It may have been removed.');
        }
      } catch (error: any) {
        console.error('[loadProductData] Error:', error.message || error);
        setError('An error occurred while loading product details. Please try again later.');
      } finally {
        setLoading(false);
        console.log('[loadProductData] Done loading.');
      }
    }
    try {
      loadProductData();
    } catch (e) {
      console.error('[ProductDetailsScreen] Error in useEffect:', e);
    }
  }, [id, user]);



  // Calculate total price based on selected options
  const calculateTotalPrice = () => {
    if (!product) return 0;
    const total = product.price + (includeMakeup ? (product.makeupPrice || makeupPrice) : 0);
    console.log('Price debug:', { 
      productPrice: product.price, 
      makeupPrice: product.makeupPrice, 
      includeMakeup, 
      total 
    });
    return total;
  };

  // Handler for adding product to cart
  const handleAddToCart = async () => {
    if (!product) return;

    setIsAddingToCart(true);

    try {
      // Calculate total price based on options
      const totalPrice = calculateTotalPrice();

      // Create cart item with selected options
      const cartItem = {
        ...product,
        quantity: 1,
        includeMakeup,
        totalPrice,
      };

      await addToCart(cartItem);
      setIsInCart(true);
      Alert.alert('Success', 'Product added to cart!');
    } catch (error) {
      console.error('Error adding to cart:', error);
      Alert.alert('Error', 'Could not add to cart. Please try again.');
    } finally {
      setIsAddingToCart(false);
    }
  };

  // Handler for renting the product now
  const handleRentNow = async () => {
    if (isRentingNow) return; // guard against double taps
    setIsRentingNow(true);
    if (!product) {
      console.log('No product data available for booking');
      Alert.alert('Error', 'Product information not available. Please try again.');
      return;
    }

    // Start loading state
    setIsRentingNow(true);

    try {
      // Extended booking data to pass to the form
      const bookingData = {
        productId: product.id,
        productName: product.name,
        price: calculateTotalPrice(),
        includeMakeup,
        basePrice: product.price,
        makeupPrice: product.makeupPrice || 0,
        makeupDuration: product.makeupDuration || 0,
      };

      console.log('Booking data being passed to form:', bookingData);

      // Store in AsyncStorage as backup
      try {
        await AsyncStorage.setItem('pendingBooking', JSON.stringify(bookingData));
        console.log('Booking data saved to AsyncStorage');
      } catch (storageError) {
        console.error('Error saving booking data to AsyncStorage:', storageError);
      }

      // Navigate to booking form with all necessary details
      router.push({
        pathname: '/booking-form',
        params: {
          productId: bookingData.productId,
          price: bookingData.price.toString(),
          includeMakeup: String(bookingData.includeMakeup),
          productName: bookingData.productName,
          basePrice: bookingData.basePrice.toString(),
          makeupPrice: bookingData.makeupPrice.toString(),
          makeupDuration: bookingData.makeupDuration.toString(),
        },
      });
    } catch (error) {
      console.error('Error during rent now process:', error);
      Alert.alert('Error', 'Could not proceed to booking. Please try again.');
    } finally {
      // Stop loading state
      setIsRentingNow(false);
    }
  };

  // Handler for viewing seller profile
  const handleViewSellerProfile = () => {
    if (!product) return;

    const sellerId = product.sellerUid || product.userId;
    if (!sellerId) {
      Alert.alert('Error', 'Seller information not available');
      return;
    }

    // Navigate to seller profile with the ID as a query parameter
    router.push({
      pathname: '/seller-profile' as any,
      params: { id: sellerId }
    } as any);
  };

  // Handler for rating the product
  const handleRateProduct = () => {
    setIsRatingMode(true);
  };

  // Check if current user is the product owner
  const isProductOwner = () => {
    if (!product || !user) {
      console.log('No product or user data, isProductOwner returning false');
      return false;
    }

    // Extract IDs for comparison
    const userId = user.id;
    const productSellerId = product.sellerUid || product.userId;

    // Check if user is a freelancer (by role) or matches the seller ID
    // Handle different user object structures safely
    const userRole = (user as any).role;
    const userType = (user as any).userType || (user as any).type;

    const isFreelancer =
      userRole === 'freelancer' ||
      userRole === 'admin' ||
      userType === 'freelancer' ||
      userType === 'admin';

    const isMatchingId = userId === productSellerId;

    console.log('Checking isProductOwner:', {
      userId,
      productSellerId,
      userRole: userRole || userType,
      isFreelancer,
      isMatchingId,
      result: isMatchingId || isFreelancer
    });

    // Either the IDs match OR the user is a freelancer
    return isMatchingId || isFreelancer;
  };

  // Handler for editing product (for freelancers)
  const handleEditProduct = () => {
    if (!product) return;

    router.push({
      pathname: '/(freelancer)/post-product',
      params: { productId: product.id },
    } as any);
  };

  // Handler for managing bookings (for freelancers)
  const handleManageBookings = () => {
    if (!product) return;

    router.push({
      pathname: '/(freelancer)/bookings',
      params: { productId: product.id },
    } as any);
  };

  // Submit rating handler
  const handleSubmitRating = async () => {
    if (!product || !user || userRating === 0) {
      Alert.alert('Error', 'Please select a rating');
      return;
    }

    try {
      // Refresh ratings
      const newRating = await ratingsService.createRating({
        productId: product.id,
        rating: userRating,
        comment: userComment
      });
      setRatings(prevRatings => [newRating, ...prevRatings]);

      // Reset form
      setUserRating(0);
      setUserComment('');
      setUserComment('');
      setIsRatingMode(false);

      Alert.alert('Success', 'Your rating has been submitted!');
    } catch (error) {
      console.error('Error submitting rating:', error);
      Alert.alert('Error', 'Could not submit rating. Please try again.');
    }
  };

  // Check if user has rented this product
  useEffect(() => {
    // This would normally check the user's order/rental history
    // For now, we'll just set it to true for demo purposes
    if (user && product) {
      setHasUserRented(true);
    }
  }, [user, product]);

  
  // Load ratings on mount
  useEffect(() => {
    async function loadRatings() {
      if (!id) return;

      try {
        const ratingsData = await ratingsService.getProductRatings(String(id));
        setRatings(ratingsData);

        // Calculate average rating
        if (ratingsData.length > 0) {
          const total = ratingsData.reduce((sum, rating) => sum + rating.rating, 0);
          setAverageRating(total / ratingsData.length);
        }
      } catch (error) {
        console.error('Error loading ratings:', error);
      }
    }
    
    loadRatings();
  }, [id]);
  
  // Check if product is in cart
  useEffect(() => {
        if (product && cartItems) {
      const found = cartItems.find(item => item.id === product.id);
      setIsInCart(!!found);
    }
  }, [product, cartItems]);

  // Render makeup service option with modern style
  const renderMakeupOption = () => {
    if (!product) return null;
    return (
      <View style={styles.makeupSection}>
        <MaterialIcons name="face" size={24} color="#7E57C2" />
        <Text style={styles.makeupTitle}>Makeup Service Available</Text>
        <Text style={styles.detailValue}>{product.makeupDuration}</Text>
      </View>
    );
  };

  // Render size section
  const renderSizeSection = () => {
    if (!product?.size || product.size.length === 0) {
      return null;
    }

    // Convert size to array if it's a string
    const sizeArray = Array.isArray(product.size) ? product.size : [product.size];

    return (
      <View style={styles.sectionContainer}>
        <Text style={styles.sectionTitle}>Available Sizes</Text>
        <View style={styles.sizeRow}>
          {sizeArray.map((size: string, index: number) => (
            <View key={index} style={styles.sizeTag}>
              <Text style={styles.sizeText}>{size}</Text>
            </View>
          ))}
        </View>
      </View>
    );
  };


  // Render rating modal
  const renderRatingModal = () => {
    if (!isRatingMode) return null;
    
    return (
      <View style={styles.modalOverlay}>
        <View style={styles.ratingModal}>
          <Text style={styles.modalTitle}>Rate This Product</Text>
          
          {/* Star Rating Selector */}
          <View style={styles.starContainer}>
            {[1, 2, 3, 4, 5].map((star) => (
              <TouchableOpacity 
                key={star}
                onPress={() => setUserRating(star)}
              >
                <FontAwesome 
                  name={star <= userRating ? "star" : "star-o"} 
                  size={32} 
                  color="#FFD700" 
                  style={styles.starIcon}
                />
              </TouchableOpacity>
            ))}
          </View>
          
          {/* Comment Input */}
          <TextInput
            style={styles.commentInput}
            placeholder="Write your review (optional)"
            multiline
            numberOfLines={4}
            value={userComment}
            onChangeText={setUserComment}
          />
          
          {/* Buttons */}
          <View style={styles.modalButtons}>
            <TouchableOpacity 
              style={[styles.modalButton, styles.cancelButton]}
              onPress={() => setIsRatingMode(false)}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.modalButton, styles.submitButton]}
              onPress={handleSubmitRating}
            >
              <Text style={styles.submitButtonText}>Submit</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  // Render ratings section - only for users, not for product owners
  const renderRatings = () => {
    if (isProductOwner()) {
      return null; // Don't show ratings section for product owners
    }
    
    return (
      <View style={styles.ratingsSection}>
        <View style={styles.ratingsSectionHeader}>
          <Text style={styles.sectionTitle}>Ratings & Reviews</Text>
          {hasUserRented && (
            <TouchableOpacity 
              style={styles.addReviewButton}
              onPress={handleRateProduct}
            >
              <Text style={styles.addReviewText}>Add Review</Text>
            </TouchableOpacity>
          )}
        </View>
        
        <View style={styles.ratingsSummary}>
          <View style={styles.ratingStars}>
            <Text style={styles.ratingNumber}>{averageRating.toFixed(1)}</Text>
            <View style={styles.starRow}>
              {[1, 2, 3, 4, 5].map((star) => (
                <FontAwesome 
                  key={star}
                  name={star <= Math.round(averageRating) ? "star" : "star-o"} 
                  size={18} 
                  color="#FFD700" 
                  style={styles.ratingStar}
                />
              ))}
            </View>
            <Text style={styles.ratingCount}>({ratings.length} ratings)</Text>
          </View>
        </View>
        
        {ratings.length === 0 ? (
          <View style={styles.noReviewsContainer}>
            <Text style={styles.noReviewsText}>No reviews yet</Text>
          </View>
        ) : (
          <View style={styles.reviewsPreview}>
            <View style={styles.reviewItem}>
              <View style={styles.reviewHeader}>
                <Text style={styles.reviewerName}>{ratings[0].userName}</Text>
                <View style={styles.reviewStars}>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <FontAwesome 
                      key={star}
                      name={star <= ratings[0].rating ? "star" : "star-o"} 
                      size={14} 
                      color="#FFD700" 
                      style={styles.reviewStar}
                    />
                  ))}
                </View>
              </View>
              {ratings[0].comment && (
                <Text style={styles.reviewText}>{ratings[0].comment}</Text>
              )}
            </View>
            
            {ratings.length > 1 && (
              <TouchableOpacity style={styles.seeAllReviews}>
                <Text style={styles.seeAllText}>See all {ratings.length} reviews</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>
    );
  };

  // Render freelancer-specific actions
  const renderFreelancerActions = () => {
    const isOwner = isProductOwner();
    console.log('renderFreelancerActions called, isOwner:', isOwner);
    
    if (!isOwner) return null;
    
    return (
      <View style={styles.freelancerActionsContainer}>
        <Text style={styles.sectionTitle}>Manage Your Product</Text>
        
        <View style={styles.actionButtonsContainer}>
          <TouchableOpacity
            style={styles.editButton}
            onPress={handleEditProduct}
          >
            <Feather name="edit" size={20} color="#fff" />
            <Text style={styles.actionButtonText}>Edit Product</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.manageButton}
            onPress={handleManageBookings}
          >
            <Feather name="calendar" size={20} color="#fff" />
            <Text style={styles.actionButtonText}>Manage Bookings</Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{ratings.length}</Text>
            <Text style={styles.statLabel}>Reviews</Text>
          </View>
          
          <View style={styles.statItem}>
            <Text style={styles.price}>₱{calculateTotalPrice().toFixed(2)}</Text>
          </View>

          {product?.hasMakeupService && (
            <View style={styles.makeupTagContainer}>
              <Ionicons name="sparkles-outline" size={18} color="#6B46C1" />
              <Text style={styles.makeupTagText}>Makeup Service Available</Text>
            </View>
          )}

          <View style={styles.statItem}>
            <Text style={styles.statNumber}>0</Text>
            <Text style={styles.statLabel}>Pending</Text>
          </View>
        </View>
      </View>
    );
  };
  
  // Render customer-specific actions
  const renderCustomerActions = () => {
    const isOwner = isProductOwner();
    console.log('renderCustomerActions called, isOwner:', isOwner);
    
    if (isOwner) {
      console.log('User is product owner, hiding customer actions');
      return null;
    }
    
    console.log('User is NOT product owner, showing customer actions');
    return (
      <View style={styles.actionButtonsContainer}>
        <TouchableOpacity
          style={styles.addCartButton}
          onPress={handleAddToCart}
          disabled={isAddingToCart}
        >
          <Feather name="shopping-cart" size={20} color="#6B46C1" />
          <Text style={styles.addCartText}>
            {isAddingToCart ? "Adding..." : "Add to Cart"}
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.rentButton}
          onPress={handleRentNow}
          disabled={isRentingNow}
        >
          <Feather name="shopping-bag" size={20} color="#fff" />
          <Text style={styles.rentButtonText}>
            {isRentingNow ? "Processing..." : "Rent Now"}
          </Text>
        </TouchableOpacity>
      </View>
    );
  };

  // Loading state
  if (!product) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6B46C1" />
        <Text style={styles.loadingText}>Loading product...</Text>
      </View>
    );
  }

  // Main UI
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        style={styles.mainScrollView}
        showsVerticalScrollIndicator={false}
        bounces={true}
      >
        {/* Image Carousel Section */}
        <View style={styles.carouselContainer}>
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => {
              if (product?.images && product.images.length > 0) {
                const idx = product.images.findIndex((img: string) => img === currentImage);
                setSelectedImageIndex(idx >= 0 ? idx : 0);
                setIsImageModalVisible(true);
              }
            }}
          >
            <Image
              source={
                currentImage && typeof currentImage === 'string' && currentImage.length > 0
                  ? { uri: currentImage }
                  : product?.image && typeof product.image === 'string' && product.image.length > 0
                  ? { uri: product.image }
                  : defaultImage
              }
              style={styles.mainImage}
              resizeMode="cover"
            />
          </TouchableOpacity>
          
          {/* Pagination dots if multiple images */}
          {product && product.images && product.images.length > 1 && (
            <View style={styles.paginationDots}>
              {product.images.map((_: string, index: number) => (
                <View 
                  key={index} 
                  style={[
                    styles.paginationDot, 
                    currentImage === product?.images?.[index] && styles.paginationDotActive
                  ]} 
                />
              ))}
            </View>
          )}
        </View>
        
        {/* Thumbnail row */}
        {product && product.images && product.images.length > 0 && (
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false} 
            style={styles.thumbnailScroll}
            contentContainerStyle={styles.thumbnailContainer}
          >
            {product.images.map((image: string, index: number) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.thumbnailWrapper,
                  image === currentImage && styles.thumbnailActive,
                ]}
                onPress={() => setCurrentImage(image)}
              >
                <Image
                  source={image && typeof image === 'string' && image.length > 0 ? { uri: image } : defaultImage}
                  style={styles.thumbnail}
                  resizeMode="cover"
                />
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}
        
        <View style={styles.contentContainer}>
          {/* Product header info */}
          <View style={styles.productHeader}>
            <Text style={styles.title}>{product?.name || "Product Name"}</Text>
            {product && product.hasMakeupService && (
              <View style={styles.makeupTagContainer}>
                <Ionicons name="color-palette-outline" size={18} color="#6B46C1" />
                <Text style={styles.makeupTagText}>Makeup Service Available</Text>
              </View>
            )}
            <Text style={styles.price}>
              ₱{calculateTotalPrice().toLocaleString()}
            </Text>
            {includeMakeup && product?.hasMakeupService && (
              <Text style={styles.priceBreakdown}>
                Gown: ₱{(product?.price || 0).toLocaleString()} + Makeup: ₱{makeupPrice.toLocaleString()}
              </Text>
            )}
          </View>
          
          {/* FREELANCER VIEW */}
          {isProductOwner() && (
            <>
              {/* Description Section */}
              <View style={styles.sectionContainer}>
                <Text style={styles.sectionTitle}>Description</Text>
                <Text style={styles.description}>
                  {product?.description || "No description provided."}
                </Text>
              </View>
              
              {/* Size Section */}
              {renderSizeSection()}
              
              {/* Freelancer Actions */}
              {renderFreelancerActions()}
            </>
          )}
          
          {/* CUSTOMER VIEW */}
          {!isProductOwner() && (
            <>
              {/* Seller Info Card */}
              <View style={styles.sellerCard}>
                <View style={styles.sellerInfo}>
                  <View style={styles.sellerImageContainer}>
                    {sellerProfile?.profileImage ? (
                      <Image
                        source={{ uri: sellerProfile.profileImage }}
                        style={styles.sellerImage}
                      />
                    ) : (
                      <View style={styles.noSellerImage}>
                        <Text style={styles.sellerInitial}>?</Text>
                      </View>
                    )}
                  </View>
                  <View style={styles.sellerDetails}>
                    <Text style={styles.sellerName}>
                      {sellerProfile?.name || product?.sellerName || "Unknown Seller"}
                    </Text>
                    <Text style={styles.sellerTitle}>Product Owner</Text>
                  </View>
                </View>
                <TouchableOpacity 
                  style={styles.viewProfileButton}
                  onPress={handleViewSellerProfile}
                >
                  <Text style={styles.viewProfileText}>View Profile</Text>
                </TouchableOpacity>
              </View>

              {/* Description Section */}
              <View style={styles.sectionContainer}>
                <Text style={styles.sectionTitle}>Description</Text>
                <Text style={styles.description}>
                  {product?.description || "No description provided."}
                </Text>
              </View>

              {/* Ratings Section */}
              {renderRatings()}
              
              {/* Size Section */}
              {renderSizeSection()}
              
              {/* Makeup Service Option */}
              {product && product.hasMakeupService && renderMakeupOption()}
              
              {/* Customer Actions */}
              {renderCustomerActions()}
            </>
          )}
        </View>
      </ScrollView>

      {/* Fullscreen Image Modal */}
      {product?.images && product.images.length > 0 && (
        <Modal
          visible={isImageModalVisible}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setIsImageModalVisible(false)}
        >
          <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.97)', justifyContent: 'center', alignItems: 'center' }}>
            <FlatList
              data={product.images}
              horizontal
              pagingEnabled
              initialScrollIndex={selectedImageIndex}
              getItemLayout={(_, index) => ({ length: width, offset: width * index, index })}
              showsHorizontalScrollIndicator={false}
              renderItem={({ item }) => (
                <View style={{ width, height: '100%', justifyContent: 'center', alignItems: 'center' }}>
                  <Image source={{ uri: item }} style={{ width: width * 0.95, height: width * 1.2, resizeMode: 'contain' }} />
                </View>
              )}
              keyExtractor={(item, idx) => item + idx}
              style={{ flexGrow: 0 }}
            />
            <TouchableOpacity
              onPress={() => setIsImageModalVisible(false)}
              style={{ position: 'absolute', top: 40, right: 24, backgroundColor: 'rgba(0,0,0,0.7)', borderRadius: 20, padding: 8 }}
            >
              <Ionicons name="close" size={32} color="#fff" />
            </TouchableOpacity>
          </View>
        </Modal>
      )}

      {/* Back button as a floating element */}
      <TouchableOpacity 
        style={styles.backButton} 
        onPress={() => router.back()}
      >
        <View style={styles.backButtonInner}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </View>
      </TouchableOpacity>

      {/* Rating Modal - only for customers */}
      {!isProductOwner() && renderRatingModal()}
    </SafeAreaView>
  );
}

// Updated styles for the header section
const styles = StyleSheet.create({
  serviceLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#7E57C2',
    marginBottom: 2,
    marginTop: 8,
  },
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  mainScrollView: {
    flex: 1,
  },
  carouselContainer: {
    height: 350,
    position: 'relative',
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    overflow: 'hidden',
    marginBottom: 16,
  },
  mainImage: {
    width: '100%',
    height: '100%',
  },
  backButton: {
    position: 'absolute',
    top: 50,
    left: 20,
    zIndex: 10,
  },
  backButtonInner: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 50,
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  paginationDots: {
    position: 'absolute',
    bottom: 20,
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  paginationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    margin: 4,
  },
  paginationDotActive: {
    backgroundColor: '#fff',
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  thumbnailScroll: {
    marginBottom: 16,
  },
  thumbnailContainer: {
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  thumbnailWrapper: {
    width: 70,
    height: 70,
    marginRight: 12,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  thumbnailActive: {
    borderColor: '#6B46C1',
  },
  thumbnail: {
    width: '100%',
    height: '100%',
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 80, // Extra padding at the bottom to ensure nothing is cut off
  },
  productHeader: {
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#202124',
  },
  price: {
    fontSize: 24,
    fontWeight: '700',
    color: '#6B46C1',
    marginBottom: 8,
  },
  priceBreakdown: {
    fontSize: 15,
    color: '#5f6368',
    fontWeight: '500',
  },
  sellerCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  sellerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  sellerImageContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 16,
    backgroundColor: '#f1f3f4',
    overflow: 'hidden',
  },
  sellerImage: {
    width: '100%',
    height: '100%',
  },
  noSellerImage: {
    width: '100%',
    height: '100%',
    backgroundColor: '#6B46C1',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sellerInitial: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
  },
  sellerDetails: {
    flex: 1,
  },
  sellerName: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#202124',
    marginBottom: 2,
  },
  sellerTitle: {
    fontSize: 14,
    color: '#5f6368',
  },
  viewProfileButton: {
    backgroundColor: '#f1f3f4',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 12,
  },
  viewProfileText: {
    color: '#6B46C1',
    fontSize: 14,
    fontWeight: '600',
  },
  sectionContainer: {
    marginBottom: 24,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#202124',
    marginBottom: 12,
  },
  description: {
    fontSize: 16,
    lineHeight: 24,
    color: '#5f6368',
  },
  sizeContainer: {
    marginBottom: 24,
  },
  sizeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  sizeTag: {
    backgroundColor: '#f2f2f2',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginRight: 12,
    marginBottom: 8,
  },
  sizeText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#5f6368',
  },
  rateButton: {
    backgroundColor: '#6B46C1',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 24,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  rateButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  ratingsSection: {
    marginBottom: 24,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  ratingsSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  addReviewButton: {
    backgroundColor: '#f1f3f4',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  addReviewText: {
    color: '#6B46C1',
    fontSize: 14,
    fontWeight: '600',
  },
  ratingsSummary: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  ratingStars: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#202124',
    marginRight: 8,
  },
  starRow: {
    flexDirection: 'row',
    marginRight: 8,
  },
  ratingStar: {
    marginHorizontal: 2,
  },
  ratingCount: {
    fontSize: 14,
    color: '#5f6368',
  },
  noReviewsContainer: {
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  noReviewsText: {
    fontSize: 15,
    color: '#5f6368',
    fontStyle: 'italic',
  },
  reviewsPreview: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 16,
  },
  reviewItem: {
    marginBottom: 16,
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  reviewerName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#202124',
  },
  reviewStars: {
    flexDirection: 'row',
  },
  reviewStar: {
    marginLeft: 2,
  },
  reviewText: {
    fontSize: 14,
    color: '#5f6368',
    lineHeight: 20,
  },
  seeAllReviews: {
    alignItems: 'center',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#e1e3e6',
  },
  seeAllText: {
    color: '#6B46C1',
    fontSize: 14,
    fontWeight: '600',
  },
  serviceCard: {
    padding: 16,
  },
  serviceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  serviceInfo: {
    flex: 1,
  },
  serviceTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#202124',
    marginBottom: 4,
  },
  servicePrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#6B46C1',
  },
  serviceDescription: {
    fontSize: 14,
    color: '#5f6368',
    lineHeight: 20,
  },
  availableBadge: {
    backgroundColor: '#e6f4ea',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  availableBadgeText: {
    color: '#137333',
    fontSize: 12,
    fontWeight: '600',
  },
  actionButtonsContainer: {
    flexDirection: 'row',
    marginTop: 24,
    marginBottom: 40,
  },
  editButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4CAF50',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 20,
    marginRight: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  manageButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FF9800',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  loadingText: {
    color: '#6B46C1',
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 16,
  },
  addCartButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#6B46C1',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 20,
    marginRight: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  addCartText: {
    color: '#6B46C1',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  rentButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#6B46C1',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  rentButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  ratingModal: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 16,
    width: '85%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#202124',
    textAlign: 'center',
  },
  starContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 16,
  },
  starIcon: {
    marginHorizontal: 4,
  },
  commentInput: {
    height: 100,
    borderWidth: 1,
    borderColor: '#e1e3e6',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    backgroundColor: '#f8f9fa',
    fontSize: 15,
    color: '#202124',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  modalButton: {
    flex: 1,
    margin: 4,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    paddingVertical: 12,
  },
  cancelButton: {
    backgroundColor: '#f2f2f2',
  },
  cancelButtonText: {
    color: '#5f6368',
    fontSize: 16,
    fontWeight: '600',
  },
  submitButton: {
    backgroundColor: '#6B46C1',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  freelancerActionsContainer: {
    marginBottom: 24,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 24,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#e1e3e6',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#202124',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    color: '#5f6368',
  },
  makeupTagContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f3e8ff',
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 12,
    alignSelf: 'flex-start',
    marginTop: 12,
    marginBottom: 4,
  },
  makeupTagText: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: '600',
    color: '#6B46C1',
  },
  makeupSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  makeupInfo: {
    flex: 1,
    marginLeft: 16,
  },
  makeupTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#202124',
    marginBottom: 4,
  },
  makeupPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#6B46C1',
  },
  makeupDescription: {
    fontSize: 14,
    color: '#5f6368',
    lineHeight: 20,
  },
  detailValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#6B46C1',
  },
});