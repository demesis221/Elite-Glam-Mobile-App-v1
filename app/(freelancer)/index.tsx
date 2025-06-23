import { FontAwesome5, Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useAuth } from '@/contexts/AuthContext';

export default function StoreDashboard() {
  const router = useRouter();
  const { user } = useAuth();


  return (
    <View style={styles.container}>
      {/* Purple Header Section */}
      <View style={styles.headerSection}>
        <Text style={styles.headerTitle}>Store Dashboard</Text>
        <Text style={styles.headerSubtitle}>Welcome to your store management</Text>
      </View>
      
      <ScrollView style={styles.contentContainer}>
        {/* Quick Actions Section */}
        <View style={styles.quickActionsContainer}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          
          {/* Add Product Button */}
          <TouchableOpacity 
            style={[styles.actionButton, styles.greenButton]}
            onPress={() => router.push('/(freelancer)/post-product')}
          >
            <View style={styles.actionIconContainer}>
              <Ionicons name="add" size={32} color="#4CAF50" />
            </View>
            <View style={styles.actionTextContainer}>
              <Text style={styles.actionTitle}>Add Product</Text>
              <Text style={styles.actionSubtitle}>Create new product listings</Text>
            </View>
            <MaterialIcons name="chevron-right" size={24} color="#888" />
          </TouchableOpacity>
          
          {/* View Orders Button */}
          <TouchableOpacity 
            style={[styles.actionButton, styles.blueButton]}
            onPress={() => router.push('/(freelancer)/bookings')}
          >
            <View style={styles.actionIconContainer}>
              <FontAwesome5 name="calendar" size={24} color="#2196F3" />
            </View>
            <View style={styles.actionTextContainer}>
              <Text style={styles.actionTitle}>Manage Bookings</Text>
              <Text style={styles.actionSubtitle}>View and manage all bookings</Text>
            </View>
            <MaterialIcons name="chevron-right" size={24} color="#888" />
          </TouchableOpacity>
          
          {/* Manage Products Button */}
          <TouchableOpacity 
            style={[styles.actionButton, styles.purpleButton]}
            onPress={() => router.push('/(freelancer)/products')}
          >
            <View style={styles.actionIconContainer}>
              <FontAwesome5 name="box" size={24} color="#9C27B0" />
            </View>
            <View style={styles.actionTextContainer}>
              <Text style={styles.actionTitle}>Manage Products</Text>
              <Text style={styles.actionSubtitle}>Edit or remove products</Text>
            </View>
            <MaterialIcons name="chevron-right" size={24} color="#888" />
          </TouchableOpacity>
        </View>
      </ScrollView>
      

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  headerSection: {
    backgroundColor: '#7E57C2',
    padding: 20,
    paddingTop: 20,
    paddingBottom: 40,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  contentContainer: {
    flex: 1,
    marginTop: -20,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    backgroundColor: '#f8f9fa',
  },
  quickActionsContainer: {
    backgroundColor: '#fff',
    margin: 16,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    minHeight: 80,
  },
  greenButton: {
    backgroundColor: '#E8F5E9',
  },
  blueButton: {
    backgroundColor: '#E3F2FD',
  },
  purpleButton: {
    backgroundColor: '#F3E5F5',
  },
  actionIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  actionTextContainer: {
    flex: 1,
  },
  actionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  actionSubtitle: {
    fontSize: 14,
    color: '#666',
  },
  floatingButton: {
    position: 'absolute',
    right: 20,
    bottom: 80,
    backgroundColor: '#7E57C2',
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
    flexDirection: 'column',
  },
  floatingButtonText: {
    color: '#fff',
    fontSize: 12,
    marginTop: 2,
  },
  statusIndicator: {
    position: 'absolute',
    top: 16,
    right: 16,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },
  onlineIndicator: {
    backgroundColor: '#4CAF50',
  },
  offlineIndicator: {
    backgroundColor: '#FF5722',
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 4,
  },
}); 