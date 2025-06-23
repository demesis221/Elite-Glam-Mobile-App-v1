import { MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Link, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Alert, Button, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useAuth } from '@/contexts/AuthContext';

interface UserProfile {
  username: string;
  email: string;
  role: string;
  profileImage?: string;
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

export default function FreelancerProfileScreen() {
  const { user, logout } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const router = useRouter();

  // Load profile data
  useEffect(() => {
    const loadProfileData = async () => {
      try {
        const userData = await AsyncStorage.getItem('userData');
        if (userData) {
          setProfile(JSON.parse(userData));
        }
      } catch (error) {
        console.error('Error loading profile data:', error);
      }
    };
    
    loadProfileData();
  }, []);

  const handleLogout = () => {
    Alert.alert(
      "Logout",
      "Are you sure you want to log out?",
      [
        {
          text: "Cancel",
          style: "cancel"
        },
        {
          text: "Logout",
          style: "destructive",
          onPress: async () => {
            await logout();
          }
        }
      ]
    );
  };

  return (
    <ScrollView style={styles.container}>
      {/* Profile Header */}
      <View style={styles.profileHeader}>
        <View style={styles.profileImageContainer}>
          {profile?.profileImage || profile?.profile?.photoURL ? (
            <Image 
              source={{ uri: profile?.profileImage || profile?.profile?.photoURL }} 
              style={styles.profileImage} 
            />
          ) : (
            <View style={styles.profileInitials}>
              <Text style={styles.initialsText}>
                {profile?.username?.charAt(0)?.toUpperCase() || 'F'}
              </Text>
            </View>
          )}
        </View>
        
        <Text style={styles.profileName}>{profile?.username || 'Freelancer'}</Text>
        <Text style={styles.profileEmail}>{profile?.email || ''}</Text>
        
        <TouchableOpacity 
          style={styles.editProfileButton}
          onPress={() => router.push({ pathname: '/(freelancer)/edit-profile' })}
        >
          <Text style={styles.editProfileText}>Edit Profile</Text>
        </TouchableOpacity>
      </View>
      
      {/* Account Settings */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Account</Text>
        
        <TouchableOpacity style={styles.menuItem}>
          <MaterialIcons name="notifications" size={24} color="#7E57C2" />
          <Text style={styles.menuItemText}>Notifications</Text>
          <MaterialIcons name="chevron-right" size={24} color="#ccc" style={styles.menuItemIcon} />
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.menuItem}>
          <MaterialIcons name="lock" size={24} color="#7E57C2" />
          <Text style={styles.menuItemText}>Privacy & Security</Text>
          <MaterialIcons name="chevron-right" size={24} color="#ccc" style={styles.menuItemIcon} />
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.menuItem}>
          <MaterialIcons name="payment" size={24} color="#7E57C2" />
          <Text style={styles.menuItemText}>Payment Methods</Text>
          <MaterialIcons name="chevron-right" size={24} color="#ccc" style={styles.menuItemIcon} />
        </TouchableOpacity>
      </View>
      
      {/* Store Settings */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Store Management</Text>
        
        <TouchableOpacity 
          style={styles.menuItem}
          onPress={() => router.push('/(freelancer)/products')}
        >
          <MaterialIcons name="inventory" size={24} color="#7E57C2" />
          <Text style={styles.menuItemText}>Manage Products</Text>
          <MaterialIcons name="chevron-right" size={24} color="#ccc" style={styles.menuItemIcon} />
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.menuItem}
          onPress={() => router.push('/(freelancer)/bookings')}
        >
          <MaterialIcons name="list-alt" size={24} color="#7E57C2" />
          <Text style={styles.menuItemText}>Bookings</Text>
          <MaterialIcons name="chevron-right" size={24} color="#ccc" style={styles.menuItemIcon} />
        </TouchableOpacity>
      </View>
      
      {/* Support Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Support</Text>
        
        <TouchableOpacity style={styles.menuItem}>
          <MaterialIcons name="help" size={24} color="#7E57C2" />
          <Text style={styles.menuItemText}>Help Center</Text>
          <MaterialIcons name="chevron-right" size={24} color="#ccc" style={styles.menuItemIcon} />
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.menuItem}>
          <MaterialIcons name="feedback" size={24} color="#7E57C2" />
          <Text style={styles.menuItemText}>Send Feedback</Text>
          <MaterialIcons name="chevron-right" size={24} color="#ccc" style={styles.menuItemIcon} />
        </TouchableOpacity>
      </View>
      
      {/* Dev Tools Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Developer Tools</Text>
        <Link href="/api-test" asChild>
          <Button title="API Endpoint Tester" color="#8e8e93" />
        </Link>
      </View>

      {/* Logout Button */}
      <TouchableOpacity 
        style={styles.logoutButton}
        onPress={handleLogout}
      >
        <MaterialIcons name="logout" size={24} color="#FF5252" />
        <Text style={styles.logoutText}>Logout</Text>
      </TouchableOpacity>
      
      <View style={styles.versionContainer}>
        <Text style={styles.versionText}>Elite Glam Freelancer v1.0.0</Text>
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