import React from 'react';
import { View, TouchableOpacity, StyleSheet, Text, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useAuth } from '../contexts/AuthContext';

// Empty placeholder component
interface NotificationBellProps {
  unreadCount: number;
  isActive?: boolean; // Set if we're currently on the notifications page
}

const NotificationBell: React.FC<NotificationBellProps> = ({ 
  unreadCount, 
  isActive = false 
}) => {
  const scaleAnim = React.useRef(new Animated.Value(1)).current;
  
  const { user } = useAuth();

  // Navigate to the correct notifications page
  const handlePress = () => {
    if (user?.role === 'freelancer') {
      router.push('/(freelancer)/notifications');
    } else {
      router.push('/(renter)/notifications');
    }
  };

  React.useEffect(() => {
    if (unreadCount > 0) {
      // Create pulse animation when there are unread notifications
      Animated.sequence([
        Animated.timing(scaleAnim, {
          toValue: 1.3,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [unreadCount, scaleAnim]);



  return (
    <TouchableOpacity 
      style={styles.container} 
      onPress={handlePress}
      activeOpacity={0.7}
      accessibilityLabel="Notification bell"
      accessibilityHint="Opens notifications page"
      accessibilityRole="button"
      hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }} // Increase touch area
    >
      <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
        <Ionicons
          name={isActive ? "notifications" : "notifications-outline"}
          size={24}
          color="#FFFFFF"
        />
        {unreadCount > 0 && (
          <View style={styles.badge}>
            {unreadCount > 9 ? (
              <Text style={styles.badgeText}>9+</Text>
            ) : (
              <Text style={styles.badgeText}>{unreadCount}</Text>
            )}
          </View>
        )}
      </Animated.View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 8,
    position: 'relative',
    zIndex: 1,
  },
  badge: {
    position: 'absolute',
    right: -5,
    top: -5,
    backgroundColor: '#FF3B30',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
    zIndex: 2,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
    textAlign: 'center',
    paddingHorizontal: 2,
  },
});

export default NotificationBell; 