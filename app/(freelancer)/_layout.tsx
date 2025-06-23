import LoadingScreen from '@/components/LoadingScreen';
import { useNotifications } from '@/contexts/NotificationContext';
import NotificationSystem from '@/components/NotificationSystem';
import { useAuth } from '@/contexts/AuthContext';
import { FontAwesome, FontAwesome5 } from '@expo/vector-icons';
import { Tabs, useRouter } from 'expo-router';
import React from 'react';
import { Image, Text, View } from 'react-native';

const HeaderLogo = () => (
  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
    <Image
      source={require('@/assets/images/logo.png')}
      style={{ width: 36, height: 36, marginRight: 8, borderRadius: 18, backgroundColor: '#fff' }}
      resizeMode="contain"
    />
    <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 22 }}>
      Elite<Text style={{ color: '#FFD600' }}>G</Text>lam
    </Text>
  </View>
);

export default function FreelancerTabLayout() {
  const { unreadCount } = useNotifications();
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();


  if (isLoading || !user) {
    return <LoadingScreen />;
  }

  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: '#7E57C2' },
        headerTintColor: '#fff',
        tabBarActiveTintColor: '#7E57C2',
        tabBarInactiveTintColor: '#8e8e93',
        tabBarStyle: { backgroundColor: '#fff' },
        headerTitle: () => <HeaderLogo />,

      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Dashboard',
          tabBarIcon: ({ color }) => <FontAwesome size={28} name="dashboard" color={color} />,
        }}
      />
      <Tabs.Screen
        name="products"
        options={{
          title: 'My Products',
          tabBarIcon: ({ color }) => <FontAwesome size={28} name="tag" color={color} />,
        }}
      />
      <Tabs.Screen
        name="bookings"
        options={{
          title: 'Manage Bookings',
          tabBarIcon: ({ color }) => <FontAwesome5 size={26} name="calendar" color={color} />,
        }}
      />
      <Tabs.Screen
        name="notifications"
        options={{
          title: 'Notifications',
          tabBarIcon: ({ color }) => <FontAwesome size={26} name="bell" color={color} />,
          tabBarBadge: unreadCount > 0 ? unreadCount : undefined,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color }) => <FontAwesome size={28} name="user" color={color} />,
        }}
      />
      {/* Hidden screens for navigation only */}
      <Tabs.Screen name="post-product" options={{ href: null }} />
      <Tabs.Screen name="booking-details/[id]" options={{ href: null }} />
    </Tabs>
  );
}