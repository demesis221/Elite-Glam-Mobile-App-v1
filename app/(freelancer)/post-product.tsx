import { productsService } from '@/services/products.service';
import { MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import React, { useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Image, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Switch, Text, TextInput, TouchableOpacity, View } from 'react-native';

const categories = ['Gown', 'Dress', 'Suit', 'Sportswear', 'Other'];
const sizes = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];

interface FormData {
  name: string;
  price: string;
  description: string;
  category: string;
  quantity: string;
  size: string;
  location: string;
  hasMakeupService: boolean;
  makeupPrice: string;
  makeupDuration: string;
  makeupLocation: string;
  makeupDescription: string;
}

export default function PostProductScreen() {
  const [isLoading, setIsLoading] = useState(false);
  const [images, setImages] = useState<string[]>([]);
  const [formData, setFormData] = useState<FormData>({
    name: '',
    price: '',
    description: '',
    category: '',
    quantity: '',
    size: '',
    location: '',
    hasMakeupService: false,
    makeupPrice: '',
    makeupDuration: '',
    makeupLocation: '',
    makeupDescription: ''
  });

  const pickImage = async () => {
    try {
      if (images.length >= 5) {
        Alert.alert('Maximum Limit', 'You can upload a maximum of 5 images per product');
        return;
      }
      
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Please grant permission to access your photo library');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        allowsEditing: true,
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setImages([...images, result.assets[0].uri]);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  const removeImage = (index: number) => {
    const updatedImages = [...images];
    updatedImages.splice(index, 1);
    setImages(updatedImages);
  };

  const handleSubmit = async () => {
    // Validate form
    if (!formData.name) {
      Alert.alert('Error', 'Product name is required');
      return;
    }
    if (!formData.price || isNaN(Number(formData.price))) {
      Alert.alert('Error', 'Valid price is required');
      return;
    }
    if (!formData.category) {
      Alert.alert('Error', 'Category is required');
      return;
    }
    if (!formData.size) {
      Alert.alert('Error', 'Size is required');
      return;
    }
    if (!formData.location) {
      Alert.alert('Error', 'Location is required');
      return;
    }
    if (images.length === 0) {
      Alert.alert('Error', 'At least one product image is required');
      return;
    }
    
    // Validate makeup service fields if enabled
    if (formData.hasMakeupService) {
      if (!formData.makeupPrice || isNaN(Number(formData.makeupPrice))) {
        Alert.alert('Error', 'Valid makeup price is required when makeup service is enabled');
        return;
      }
      if (!formData.makeupDuration || formData.makeupDuration.trim() === '') {
        Alert.alert('Error', 'Makeup service duration is required');
        return;
      }
      if (!formData.makeupDescription) {
        Alert.alert('Error', 'Makeup description is required when makeup service is enabled');
        return;
      }
    }

    try {
      setIsLoading(true);
      
      // Get current user data
      const userData = await AsyncStorage.getItem('userData');
      if (!userData) {
        throw new Error('User data not found');
      }
      const user = JSON.parse(userData);
      
      // Create form data for API
      const productData = {
        name: formData.name,
        description: formData.description || 'No description',
        price: formData.price,
        category: formData.category,
        quantity: formData.quantity || '1',
        size: formData.size,
        location: formData.location,
        userId: user.uid,
        image: images[0], // Use the first image as the main image
        images: images, // Send all images including the first one
        hasMakeupService: formData.hasMakeupService,
        makeupPrice: formData.hasMakeupService ? Number(formData.makeupPrice) : undefined,
        makeupDuration: formData.hasMakeupService ? formData.makeupDuration : undefined,
        makeupLocation: formData.hasMakeupService ? formData.makeupLocation || formData.location : undefined,
        makeupDescription: formData.hasMakeupService ? formData.makeupDescription : undefined
      };

      console.log('Sending product data:', productData);

      const result = await productsService.createProduct(productData);
      console.log('Product created:', result);
      Alert.alert('Success', 'Product created successfully', [
        { text: 'OK', onPress: () => router.back() }
      ]);
    } catch (error: any) {
      console.error('Error creating product:', error);
      Alert.alert('Error', `Failed to create product: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const renderImageItem = ({ item, index }: { item: string, index: number }) => (
    <View style={styles.imagePreviewContainer}>
      <Image source={{ uri: item }} style={styles.imagePreview} />
      <TouchableOpacity 
        style={styles.removeImageButton}
        onPress={() => removeImage(index)}
      >
        <MaterialIcons name="close" size={18} color="white" />
      </TouchableOpacity>
    </View>
  );

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1 }}
    >
      <ScrollView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <MaterialIcons name="arrow-back" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Add New Product</Text>
          <View style={{ width: 24 }} />
        </View>

        {/* Form */}
        <View style={styles.form}>
          {/* Image Upload */}
          <View>
            <Text style={styles.imageUploadTitle}>
              Product Images ({images.length}/5)
            </Text>
            <View style={styles.imagesContainer}>
              <FlatList
                data={images}
                renderItem={renderImageItem}
                keyExtractor={(_, index) => `image-${index}`}
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.imagesList}
                ListFooterComponent={
                  images.length < 5 ? (
                    <TouchableOpacity 
                      style={styles.addImageButton}
                      onPress={pickImage}
                    >
                      <MaterialIcons name="add-photo-alternate" size={32} color="#666" />
                      <Text style={styles.uploadText}>Add Image</Text>
                    </TouchableOpacity>
                  ) : null
                }
              />
              {images.length === 0 && (
                <TouchableOpacity 
                  style={styles.imageUploadButton}
                  onPress={pickImage}
                >
                  <View style={styles.uploadPlaceholder}>
                    <MaterialIcons name="add-photo-alternate" size={32} color="#666" />
                    <Text style={styles.uploadText}>Add Product Images (Up to 5)</Text>
                  </View>
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* Name */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Product Name*</Text>
            <TextInput
              style={styles.input}
              value={formData.name}
              onChangeText={(text) => setFormData({ ...formData, name: text })}
              placeholder="Enter product name"
            />
          </View>

          {/* Price */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Price (PHP)*</Text>
            <TextInput
              style={styles.input}
              value={formData.price}
              onChangeText={(text) => setFormData({ ...formData, price: text })}
              placeholder="Enter price"
              keyboardType="numeric"
            />
          </View>

          {/* Description */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Description</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={formData.description}
              onChangeText={(text) => setFormData({ ...formData, description: text })}
              placeholder="Enter product description"
              multiline
              numberOfLines={4}
            />
          </View>

          {/* Category */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Category*</Text>
            <View style={styles.chipContainer}>
              {categories.map((cat) => (
                <TouchableOpacity
                  key={cat}
                  style={[
                    styles.chip,
                    formData.category === cat && styles.chipSelected
                  ]}
                  onPress={() => setFormData({ ...formData, category: cat })}
                >
                  <Text
                    style={[
                      styles.chipText,
                      formData.category === cat && styles.chipTextSelected
                    ]}
                  >
                    {cat}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Size */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Size*</Text>
            <View style={styles.chipContainer}>
              {sizes.map((size) => (
                <TouchableOpacity
                  key={size}
                  style={[
                    styles.chip,
                    formData.size === size && styles.chipSelected
                  ]}
                  onPress={() => setFormData({ ...formData, size: size })}
                >
                  <Text
                    style={[
                      styles.chipText,
                      formData.size === size && styles.chipTextSelected
                    ]}
                  >
                    {size}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Location */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Location*</Text>
            <TextInput
              style={styles.input}
              value={formData.location}
              onChangeText={(text) => setFormData({ ...formData, location: text })}
              placeholder="Enter location"
            />
          </View>

          {/* Makeup Service Toggle */}
          <View style={styles.inputGroup}>
            <Text style={styles.sectionTitle}>Professional Services</Text>
            <View style={styles.makeupToggle}>
              <View style={styles.makeupToggleInfo}>
                <Text style={styles.makeupToggleTitle}>Offer Makeup Service</Text>
                <Text style={styles.makeupToggleDescription}>
                  Enable this if you provide professional makeup services with this product
                </Text>
              </View>
              <Switch
                value={formData.hasMakeupService}
                onValueChange={(value) => setFormData({ ...formData, hasMakeupService: value })}
                trackColor={{ false: '#d1d1d1', true: '#d6c8ff' }}
                thumbColor={formData.hasMakeupService ? '#6B4EFF' : '#f4f3f4'}
              />
            </View>
          </View>

          {/* Makeup Service Fields (conditionally rendered) */}
          {formData.hasMakeupService && (
            <View style={styles.makeupServiceSection}>
              {/* Makeup Price */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Makeup Service Price (PHP)*</Text>
                <TextInput
                  style={styles.input}
                  value={formData.makeupPrice}
                  onChangeText={(text) => setFormData({ ...formData, makeupPrice: text })}
                  placeholder="Enter makeup service price"
                  keyboardType="numeric"
                />
              </View>

              {/* Makeup Duration */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Makeup Service Duration*</Text>
                <TextInput
                  style={styles.input}
                  value={formData.makeupDuration}
                  onChangeText={(text) => setFormData({ ...formData, makeupDuration: text })}
                  placeholder="E.g., 2 hours"
                />
              </View>

              {/* Makeup Description */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Makeup Service Description*</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={formData.makeupDescription}
                  onChangeText={(text) => setFormData({ ...formData, makeupDescription: text })}
                  placeholder="Enter makeup service description"
                  multiline
                  numberOfLines={4}
                />
              </View>

              {/* Makeup Location */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Makeup Service Location</Text>
                <TextInput
                  style={styles.input}
                  value={formData.makeupLocation}
                  onChangeText={(text) => setFormData({ ...formData, makeupLocation: text })}
                  placeholder="Leave blank to use product location"
                />
                <Text style={styles.helperText}>
                  If left blank, the product location will be used
                </Text>
              </View>
            </View>
          )}

          {/* Submit Button */}
          <TouchableOpacity
            style={styles.submitButton}
            onPress={handleSubmit}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.submitButtonText}>Post Product</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  form: {
    backgroundColor: '#fff',
    padding: 16,
    marginTop: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    color: '#333',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#333',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f5f5f5',
    marginRight: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  chipSelected: {
    backgroundColor: '#7E57C2',
    borderColor: '#7E57C2',
  },
  chipText: {
    fontSize: 14,
    color: '#333',
  },
  chipTextSelected: {
    color: '#fff',
  },
  imagesContainer: {
    marginBottom: 16,
  },
  imageUploadTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    marginBottom: 8,
  },
  imagesList: {
    flexGrow: 0,
  },
  imageUploadButton: {
    width: '100%',
    height: 200,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#ddd',
    borderStyle: 'dashed',
    marginBottom: 16,
  },
  uploadPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  uploadText: {
    marginTop: 8,
    fontSize: 16,
    color: '#666',
  },
  uploadedImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'contain',
  },
  submitButton: {
    backgroundColor: '#7E57C2',
    borderRadius: 8,
    padding: 16,
    marginTop: 16,
    alignItems: 'center',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  imagePreviewContainer: {
    width: 120,
    height: 120,
    marginRight: 10,
    borderRadius: 8,
    overflow: 'hidden',
    position: 'relative',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  imagePreview: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  removeImageButton: {
    position: 'absolute',
    top: 5,
    right: 5,
    backgroundColor: 'rgba(0,0,0,0.6)',
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addImageButton: {
    width: 120,
    height: 120,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    borderStyle: 'dashed',
  },
  // Makeup service styles
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  makeupToggle: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f9f9f9',
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#eee',
  },
  makeupToggleInfo: {
    flex: 1,
    marginRight: 16,
  },
  makeupToggleTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 4,
  },
  makeupToggleDescription: {
    fontSize: 14,
    color: '#666',
  },
  makeupServiceSection: {
    backgroundColor: '#f9f9f9',
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#eee',
    marginBottom: 16,
  },
  helperText: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
    fontStyle: 'italic',
  },
}); 