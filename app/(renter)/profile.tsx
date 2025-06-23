import { MaterialIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useState } from 'react';
import { ActivityIndicator, Alert, Image, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useAuth } from '@/contexts/AuthContext';

function getInitials(username?: string) {
  if (!username || typeof username !== 'string' || username.trim() === '') return 'U';
  return username.charAt(0).toUpperCase();
}

export default function ProfileScreen() {
  // Use only supported User properties for type safety
  const { user, logout, isLoading: authLoading } = useAuth();
  const username = user?.name || '';
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    // No need to manually load user data, the AuthContext handles it
    setIsRefreshing(false);
  };

  const handleLogout = async () => {
    try {
      Alert.alert(
        'Logout',
        'Are you sure you want to logout?',
        [
          {
            text: 'Cancel',
            style: 'cancel'
          },
          {
            text: 'Logout',
            style: 'destructive',
            onPress: async () => {
              try {
                // Use the logout function from AuthContext
                await logout();
                // No need to navigate, AuthContext will handle it
              } catch (error) {
                console.error('Error during logout:', error);
                Alert.alert('Error', 'Failed to logout. Please try again.');
              }
            }
          }
        ]
      );
    } catch (error) {
      console.error('Error in handleLogout:', error);
      Alert.alert('Error', 'Failed to logout. Please try again.');
    }
  };

  return (
    <ScrollView style={styles.container}>
      {/* Profile Header */}
      <View style={styles.profileHeader}>
        <View style={styles.profileImageContainer}>
          {authLoading ? (
            <ActivityIndicator size="large" color="#7E57C2" />
          ) : user?.profileImage ? (
            <Image
              source={{ uri: user.profileImage }}
              style={styles.profileImage}
              onError={(error) => {
                console.error('Error loading profile image:', error.nativeEvent);
              }}
            />
          ) : (
            <View style={styles.profileInitials}>
              <Text style={styles.initialsText}>
                {getInitials(username)}
              </Text>
            </View>
          )}
        </View>
        <Text style={styles.profileName}>{username && typeof username === 'string' && username.trim() !== '' ? username : 'User'}</Text>
        <Text style={styles.profileEmail}>{user?.email || ''}</Text>
        <TouchableOpacity
          style={styles.editProfileButton}
          onPress={() => router.push('/edit-profile')}
        >
          <Text style={styles.editProfileText}>Edit Profile</Text>
        </TouchableOpacity>
      </View>

      {/* Account Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Account</Text>
        <TouchableOpacity style={styles.menuItem} onPress={() => Alert.alert('Coming Soon', 'Notifications feature is under development. Stay tuned!', [{ text: 'OK' }])}>
          <MaterialIcons name="notifications" size={24} color="#7E57C2" />
          <Text style={styles.menuItemText}>Notifications</Text>
          <MaterialIcons name="chevron-right" size={24} color="#ccc" style={styles.menuItemIcon} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.menuItem} onPress={() => Alert.alert('Coming Soon', 'Privacy & Security feature is under development. Stay tuned!', [{ text: 'OK' }])}>
          <MaterialIcons name="lock" size={24} color="#7E57C2" />
          <Text style={styles.menuItemText}>Privacy & Security</Text>
          <MaterialIcons name="chevron-right" size={24} color="#ccc" style={styles.menuItemIcon} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.menuItem} onPress={() => Alert.alert('Coming Soon', 'Payment Methods feature is under development. Stay tuned!', [{ text: 'OK' }])}>
          <MaterialIcons name="payment" size={24} color="#7E57C2" />
          <Text style={styles.menuItemText}>Payment Methods</Text>
          <MaterialIcons name="chevron-right" size={24} color="#ccc" style={styles.menuItemIcon} />
        </TouchableOpacity>
      </View>

      {/* Bookings Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Bookings</Text>
        <TouchableOpacity style={styles.menuItem} onPress={() => router.push('/bookings')}>
          <MaterialIcons name="event-note" size={24} color="#7E57C2" />
          <Text style={styles.menuItemText}>My Bookings</Text>
          <MaterialIcons name="chevron-right" size={24} color="#ccc" style={styles.menuItemIcon} />
        </TouchableOpacity>
      </View>

      {/* Support Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Support</Text>
        <TouchableOpacity style={styles.menuItem} onPress={() => Alert.alert('Coming Soon', 'Help Center is under development. Stay tuned!', [{ text: 'OK' }])}>
          <MaterialIcons name="help" size={24} color="#7E57C2" />
          <Text style={styles.menuItemText}>Help Center</Text>
          <MaterialIcons name="chevron-right" size={24} color="#ccc" style={styles.menuItemIcon} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.menuItem} onPress={() => Alert.alert('Coming Soon', 'Send Feedback is under development. Stay tuned!', [{ text: 'OK' }])}>
          <MaterialIcons name="feedback" size={24} color="#7E57C2" />
          <Text style={styles.menuItemText}>Send Feedback</Text>
          <MaterialIcons name="chevron-right" size={24} color="#ccc" style={styles.menuItemIcon} />
        </TouchableOpacity>
      </View>

      {/* Logout Button */}
      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <MaterialIcons name="logout" size={24} color="#FF5252" />
        <Text style={styles.logoutText}>Logout</Text>
      </TouchableOpacity>

      <View style={styles.versionContainer}>
        <Text style={styles.versionText}>Elite Glam v1.0.0</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  profileHeader: {
    backgroundColor: '#7E57C2',
    padding: 20,
    alignItems: 'center',
    paddingBottom: 30,
  },
  profileImageContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 16,
    overflow: 'hidden',
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  profileImage: {
    width: '100%',
    height: '100%',
    borderRadius: 50,
  },
  profileInitials: {
    width: '100%',
    height: '100%',
    backgroundColor: '#5E35B1',
    justifyContent: 'center',
    alignItems: 'center',
  },
  initialsText: {
    fontSize: 40,
    fontWeight: 'bold',
    color: '#fff',
  },
  profileName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  profileEmail: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 16,
  },
  editProfileButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
  },
  editProfileText: {
    color: '#fff',
    fontWeight: '500',
  },
  section: {
    backgroundColor: '#fff',
    marginTop: 16,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
    paddingLeft: 8,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f5f5f5',
  },
  menuItemText: {
    flex: 1,
    fontSize: 16,
    marginLeft: 16,
    color: '#333',
  },
  menuItemIcon: {
    marginLeft: 'auto',
  },
  logoutButton: {
    marginTop: 20,
    backgroundColor: '#fff',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
  },
  logoutText: {
    fontSize: 16,
    color: '#FF5252',
    marginLeft: 16,
    fontWeight: '500',
  },
  versionContainer: {
    padding: 20,
    alignItems: 'center',
  },
  versionText: {
    color: '#999',
    fontSize: 12,
  },
});