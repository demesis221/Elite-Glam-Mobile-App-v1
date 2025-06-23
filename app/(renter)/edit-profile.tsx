import { MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import * as FileSystem from 'expo-file-system';
import * as ImageManipulator from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Image, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { getBestApiUrl } from '@/config/api.config';
import { useAuth } from '@/contexts/AuthContext';
import authService from '@/services/api';

interface UserData {
  username: string;
  email: string;
  profile?: {
    photoURL?: string;
    bio?: string;
    address?: {
      street?: string;
      city?: string;
      state?: string;
      zipCode?: string;
      country?: string;
    };
  };
}

interface UpdateProfileData {
  username: string;
  email: string;
  profile: {
    bio: string;
    photoURL: string;
    address: {
      street: string;
      city: string;
      state: string;
      zipCode: string;
      country: string;
    };
  };
}

export default function EditProfileScreen() {
  const { checkAuth, updateUser } = useAuth();
  const [userData, setUserData] = useState<UserData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  
  const [isOffline, setIsOffline] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    bio: '',
    profilePhoto: '',
    address: {
      street: '',
      city: '',
      state: '',
      zipCode: '',
      country: '',
    },
  });

  useEffect(() => {
    loadUserData();
    requestPermission();
    
    // Set up network listener
    const unsubscribe = NetInfo.addEventListener(() => {});
    return () => unsubscribe();
  }, []);

  const requestPermission = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please grant permission to access your photos');
    }
  };

  const loadUserData = async () => {
    try {
      setIsLoading(true);
      const storedUserData = await AsyncStorage.getItem('userData');
      if (storedUserData) {
        const userData = JSON.parse(storedUserData);
        setUserData(userData);
        setFormData(prev => ({
          ...prev,
          username: userData.username || '',
          email: userData.email || '',
          bio: userData.profile?.bio || '',
          profilePhoto: userData.profile?.photoURL || '',
          address: {
            street: userData.profile?.address?.street || '',
            city: userData.profile?.address?.city || '',
            state: userData.profile?.address?.state || '',
            zipCode: userData.profile?.address?.zipCode || '',
            country: userData.profile?.address?.country || '',
          },
        }));
      }
    } catch (error) {
      console.error('Error loading user data:', error);
      Alert.alert('Error', 'Failed to load user data');
    } finally {
      setIsLoading(false);
    }
  };

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        // resize/compress then encode to base64 to keep payload small
        const manipResult = await ImageManipulator.manipulateAsync(
          result.assets[0].uri,
          [{ resize: { width: 600 } }],
          { compress: 0.6, format: ImageManipulator.SaveFormat.JPEG, base64: true }
        );
        if (manipResult.base64) {
          setFormData(prev => ({ ...prev, profilePhoto: `data:image/jpeg;base64,${manipResult.base64}` }));
        }
      }
    } catch (error) {
      console.error('Error uploading photo:', error);
      Alert.alert('Error', 'Failed to upload photo. Please try again.');
    }
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      // Validate form data
      if (!formData.username.trim()) {
        Alert.alert('Error', 'Username is required');
        setIsSaving(false);
        return;
      }
      if (!formData.email.trim()) {
        Alert.alert('Error', 'Email is required');
        setIsSaving(false);
        return;
      }
      
      // Check if we're online
      const networkState = await NetInfo.fetch();
      const isConnected = networkState.isConnected;
      
      if (!isConnected) {
        Alert.alert('Offline','Please connect to internet to update profile');
        setIsSaving(false);
        return;

      }
      
      // Online mode - use the API
      const profileData = {
        username: formData.username,
        profileImage: formData.profilePhoto,
        profile: {
          bio: formData.bio,
          address: {
            street: formData.address.street,
            city: formData.address.city,
            state: formData.address.state,
            zipCode: formData.address.zipCode,
            country: formData.address.country,
          }
        }
      };
      
      const response = await authService.updateProfile(profileData);
      
      // Update local storage
      const updatedUserData = {
        ...userData,
        username: response.username,
        email: response.email || userData?.email,
        profileImage: formData.profilePhoto,
          profile: {
          ...userData?.profile,
          bio: formData.bio,
          photoURL: formData.profilePhoto,
          address: {
            street: formData.address.street,
            city: formData.address.city,
            state: formData.address.state,
            zipCode: formData.address.zipCode,
            country: formData.address.country,
          },
        },
      };
      await AsyncStorage.setItem('userData', JSON.stringify(updatedUserData));
      // refresh global auth context so profile screens update instantly
      updateUser(updatedUserData as any);
      setUserData(updatedUserData);
      setIsSaving(false);
      Alert.alert('Success', 'Profile updated successfully.');
      await checkAuth();
      router.back();
    } catch (error: any) {
      setIsSaving(false);
      Alert.alert('Error', error.message || 'Failed to update profile.');
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#7E57C2" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {isOffline && (
        <View style={styles.offlineWarning}>
          <MaterialIcons name="wifi-off" size={20} color="white" />
          <Text style={styles.offlineText}>You're offline. Changes will be saved locally only.</Text>
        </View>
      )}
      
      <View style={styles.form}>
        <View style={styles.photoSection}>
          <TouchableOpacity 
            style={styles.photoContainer}
            onPress={pickImage}
          >
            {formData.profilePhoto ? (
              <Image 
                source={{ uri: formData.profilePhoto }} 
                style={styles.profilePhoto}
              />
            ) : (
              <View style={styles.photoPlaceholder}>
                <MaterialIcons name="person" size={40} color="#7E57C2" />
              </View>
            )}
              <View style={styles.editOverlay}>
                <MaterialIcons name="camera-alt" size={24} color="#fff" />
              </View>
          </TouchableOpacity>
          <Text style={styles.photoText}>Tap to change photo</Text>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Username</Text>
          <TextInput
            style={styles.input}
            value={formData.username}
            onChangeText={(text) => setFormData(prev => ({ ...prev, username: text }))}
            placeholder="Enter username"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Email</Text>
          <TextInput
            style={styles.input}
            value={formData.email}
            onChangeText={(text) => setFormData(prev => ({ ...prev, email: text }))}
            placeholder="Enter email"
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Bio</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={formData.bio}
            onChangeText={(text) => setFormData(prev => ({ ...prev, bio: text }))}
            placeholder="Tell us about yourself"
            multiline
            numberOfLines={4}
          />
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Address</Text>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Street</Text>
          <TextInput
            style={styles.input}
            value={formData.address.street}
            onChangeText={(text) => setFormData(prev => ({ 
              ...prev, 
              address: { ...prev.address, street: text } 
            }))}
            placeholder="Enter street address"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>City</Text>
          <TextInput
            style={styles.input}
            value={formData.address.city}
            onChangeText={(text) => setFormData(prev => ({ 
              ...prev, 
              address: { ...prev.address, city: text } 
            }))}
            placeholder="Enter city"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>State/Province</Text>
          <TextInput
            style={styles.input}
            value={formData.address.state}
            onChangeText={(text) => setFormData(prev => ({ 
              ...prev, 
              address: { ...prev.address, state: text } 
            }))}
            placeholder="Enter state or province"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>ZIP/Postal Code</Text>
          <TextInput
            style={styles.input}
            value={formData.address.zipCode}
            onChangeText={(text) => setFormData(prev => ({ 
              ...prev, 
              address: { ...prev.address, zipCode: text } 
            }))}
            placeholder="Enter ZIP or postal code"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Country</Text>
          <TextInput
            style={styles.input}
            value={formData.address.country}
            onChangeText={(text) => setFormData(prev => ({ 
              ...prev, 
              address: { ...prev.address, country: text } 
            }))}
            placeholder="Enter country"
          />
        </View>

        <TouchableOpacity 
          style={[styles.saveButton, isSaving && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={isSaving}
        >
          {isSaving ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.saveButtonText}>Save Changes</Text>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
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
  },
  form: {
    padding: 16,
  },
  photoSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  photoContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    marginBottom: 8,
    position: 'relative',
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  profilePhoto: {
    width: '100%',
    height: '100%',
    borderRadius: 60,
  },
  photoPlaceholder: {
    width: '100%',
    height: '100%',
    borderRadius: 60,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  editOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingVertical: 4,
    alignItems: 'center',
  },
  photoText: {
    fontSize: 14,
    color: '#7E57C2',
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    marginBottom: 8,
    fontWeight: '500',
    color: '#333',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    backgroundColor: '#f9f9f9',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  sectionHeader: {
    marginVertical: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#7E57C2',
  },
  saveButton: {
    backgroundColor: '#7E57C2',
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 40,
  },
  saveButtonDisabled: {
    backgroundColor: '#b39ddb',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  offlineWarning: {
    backgroundColor: '#FF5252',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    gap: 8
  },
  offlineText: {
    color: 'white',
    fontWeight: '500'
  }
}); 